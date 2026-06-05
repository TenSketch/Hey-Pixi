"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { User, ProjectInvite } from "@/models";
import { sendProjectInviteEmail } from "@/lib/mail";
import { revalidatePath } from "next/cache";
import { UnauthorizedError, BadRequestError, NotFoundError } from "@/lib/errors";
import mongoose from "mongoose";

/**
 * Get the native MongoDB collection for direct operations.
 * We use native driver for parentId/role updates because Mongoose's
 * updateOne has been observed to silently fail to persist these fields
 * despite reporting modifiedCount=1 (likely a Mongoose 8.x schema caching issue).
 */
function getUsersCollection() {
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection not available");
    return db.collection("users");
}

// Helper to check if current user is admin and resolve their ownerId
async function checkAdminAuth() {
    const session = await auth();
    if (!session?.user?.email) {
        throw new UnauthorizedError("You must be logged in to manage team members.");
    }

    await dbConnect();

    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) {
        throw new NotFoundError("Current user not found.");
    }

    // Self-heal legacy entries using native driver
    const usersCol = getUsersCollection();
    const fieldsToSet: Record<string, unknown> = {};
    if (!dbUser.role) fieldsToSet.role = "admin";
    if (dbUser.tokenUsage === undefined) fieldsToSet.tokenUsage = 0;
    if (!dbUser.tokenLimit) fieldsToSet.tokenLimit = 100;
    if (!dbUser.subscriptionPlan) fieldsToSet.subscriptionPlan = "free";
    
    if (Object.keys(fieldsToSet).length > 0) {
        await usersCol.updateOne({ _id: dbUser._id }, { $set: fieldsToSet });
        // Update in-memory for the current request
        Object.assign(dbUser, fieldsToSet);
    }

    const { getActiveWorkspaceContextMongoose } = await import("@/lib/workspace");
    const { ownerId, role, isPersonal } = await getActiveWorkspaceContextMongoose(dbUser);

    if (role !== "admin" || !isPersonal) {
        throw new UnauthorizedError("Only workspace Admins (workspace owners) can manage team members for this workspace.");
    }

    return { dbUser, ownerId };
}

export async function inviteTeamMember(email: string, role: "admin" | "manager" | "viewer") {
    try {
        const { dbUser, ownerId } = await checkAdminAuth();
        const formattedEmail = email.toLowerCase().trim();

        if (!formattedEmail) {
            throw new BadRequestError("Email address is required.");
        }

        if (formattedEmail === dbUser.email.toLowerCase()) {
            throw new BadRequestError("You cannot invite yourself to the project.");
        }

        // Check if user is already a member
        const existingMember = await User.findOne({ email: formattedEmail });
        if (existingMember) {
            if (existingMember.parentId && existingMember.parentId.toString() === ownerId.toString()) {
                throw new BadRequestError("This user is already a member of your workspace.");
            }
            if (existingMember._id.toString() === ownerId.toString()) {
                throw new BadRequestError("This user is the owner of the workspace.");
            }

            // User already registered but not in this workspace yet. Add them immediately.
            // Use NATIVE driver for reliable parentId persistence
            const usersCol = getUsersCollection();
            const updateResult = await usersCol.updateOne(
                { _id: existingMember._id },
                { $set: { parentId: ownerId, role } }
            );
            console.log(`[Invites] Direct-add ${formattedEmail}: native updateOne result = matched=${updateResult.matchedCount}, modified=${updateResult.modifiedCount}`);

            // Track invite as accepted
            await ProjectInvite.findOneAndUpdate(
                { email: formattedEmail },
                {
                    role,
                    invitedBy: dbUser._id as mongoose.Types.ObjectId,
                    ownerId: ownerId as mongoose.Types.ObjectId,
                    status: "accepted",
                },
                { upsert: true, new: true }
            );

            // Send notification email
            const loginUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/signin`;
            await sendProjectInviteEmail(
                formattedEmail,
                dbUser.name || "Admin",
                role,
                loginUrl
            ).catch(err => console.error("Failed to send invite email notification:", err));

            revalidatePath("/dashboard/profile");
            revalidatePath("/dashboard");
            return { success: true, message: `Successfully added ${formattedEmail} directly to the team.` };
        }

        // User not registered. Check if a pending invite already exists.
        const pendingInvite = await ProjectInvite.findOne({ email: formattedEmail });
        if (pendingInvite && pendingInvite.status === "pending") {
            // Update the role or inviter if they re-invite
            pendingInvite.role = role;
            pendingInvite.invitedBy = dbUser._id as mongoose.Types.ObjectId;
            pendingInvite.ownerId = ownerId as mongoose.Types.ObjectId;
            await pendingInvite.save();
        } else {
            // Create a new pending invite
            await ProjectInvite.create({
                email: formattedEmail,
                role,
                invitedBy: dbUser._id as mongoose.Types.ObjectId,
                ownerId: ownerId as mongoose.Types.ObjectId,
                status: "pending",
            });
        }

        // Send invitation email with signup link
        const signupUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/signup?email=${encodeURIComponent(formattedEmail)}`;
        await sendProjectInviteEmail(
            formattedEmail,
            dbUser.name || "Admin",
            role,
            signupUrl
        );

        revalidatePath("/dashboard/profile");
        return { success: true, message: `Sent invitation link to ${formattedEmail}.` };
    } catch (error: unknown) {
        console.error("Server Action Error (inviteTeamMember):", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to invite user.";
        return { success: false, error: errorMessage };
    }
}

export async function removeTeamMember(memberId: string) {
    try {
        const { ownerId } = await checkAdminAuth();

        if (!mongoose.Types.ObjectId.isValid(memberId)) {
            throw new BadRequestError("Invalid member ID.");
        }

        const member = await User.findById(memberId);
        if (!member) {
            throw new NotFoundError("Team member not found.");
        }

        // Security check: Verify they are indeed a child member of this workspace owner
        if (!member.parentId || member.parentId.toString() !== ownerId.toString()) {
            throw new UnauthorizedError("You can only remove members belonging to your project workspace.");
        }

        // Remove association using NATIVE driver for reliable persistence
        const usersCol = getUsersCollection();
        await usersCol.updateOne(
            { _id: member._id },
            { $unset: { parentId: "" }, $set: { role: "admin" } }
        );

        // Delete any related invite record
        await ProjectInvite.deleteOne({ email: member.email.toLowerCase() });

        revalidatePath("/dashboard/profile");
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error: unknown) {
        console.error("Server Action Error (removeTeamMember):", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to remove member.";
        return { success: false, error: errorMessage };
    }
}

export async function revokeInvite(inviteId: string) {
    try {
        const { ownerId } = await checkAdminAuth();

        if (!mongoose.Types.ObjectId.isValid(inviteId)) {
            throw new BadRequestError("Invalid invite ID.");
        }

        const result = await ProjectInvite.deleteOne({ _id: inviteId, ownerId });
        if (result.deletedCount === 0) {
            throw new NotFoundError("Invitation not found or unauthorized.");
        }

        revalidatePath("/dashboard/profile");
        return { success: true };
    } catch (error: unknown) {
        console.error("Server Action Error (revokeInvite):", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to revoke invitation.";
        return { success: false, error: errorMessage };
    }
}

export async function getTeamData() {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            throw new UnauthorizedError("Not authenticated.");
        }

        await dbConnect();

        // Use native driver to read user data to avoid Mongoose schema caching issues
        const usersCol = getUsersCollection();
        const rawUser = await usersCol.findOne({ email: session.user.email });
        if (!rawUser) {
            throw new NotFoundError("User not found.");
        }

        // Self-heal legacy entries
        const fieldsToSet: Record<string, unknown> = {};
        if (!rawUser.role) fieldsToSet.role = "admin";
        if (rawUser.tokenUsage === undefined) fieldsToSet.tokenUsage = 0;
        if (!rawUser.tokenLimit) fieldsToSet.tokenLimit = 100;
        if (!rawUser.subscriptionPlan) fieldsToSet.subscriptionPlan = "free";
        
        if (Object.keys(fieldsToSet).length > 0) {
            await usersCol.updateOne({ _id: rawUser._id }, { $set: fieldsToSet });
            Object.assign(rawUser, fieldsToSet);
        }

        const ownerId = rawUser.parentId || rawUser._id;
        const effectiveRole = rawUser.role || "admin";

        // Fetch active members (all users with parentId pointing to ownerId)
        const activeMembers = await usersCol.find({ parentId: ownerId }).toArray();
        
        // Fetch workspace owner info
        const ownerUser = await usersCol.findOne({ _id: ownerId });
        
        // Fetch invites
        const invites = await ProjectInvite.find({ ownerId }).lean();

        // Serialize data
        const serializedMembers = activeMembers.map(m => ({
            _id: m._id.toString(),
            name: m.name,
            email: m.email,
            role: m.role || "viewer",
            createdAt: m.createdAt ? new Date(m.createdAt as Date).toISOString() : undefined,
        }));

        const serializedInvites = invites.map(i => ({
            _id: i._id.toString(),
            email: i.email,
            role: i.role,
            status: i.status,
            createdAt: i.createdAt ? (i.createdAt as Date).toISOString() : undefined,
        }));

        return {
            success: true,
            members: serializedMembers,
            invites: serializedInvites,
            currentUserRole: effectiveRole,
            isRootAdmin: !rawUser.parentId && effectiveRole === "admin",
            ownerInfo: ownerUser ? { name: ownerUser.name, email: ownerUser.email } : undefined,
        };
    } catch (error: unknown) {
        console.error("Server Action Error (getTeamData):", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch team data.";
        return { success: false, error: errorMessage };
    }
}

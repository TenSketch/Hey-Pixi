import { cookies } from "next/headers";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";

const WORKSPACE_COOKIE = "activeWorkspace";

interface UserDoc {
    _id: ObjectId;
    parentId?: ObjectId;
    role?: string;
    [key: string]: unknown;
}

/**
 * Resolves the active workspace ownerId based on the user's cookie preference.
 * 
 * - If cookie is "personal" or absent → returns the user's own _id
 * - If cookie is an ObjectId → validates the user has access (parentId matches) and returns it
 * - Falls back to the default (parentId || _id) if cookie is invalid
 * 
 * This function works with raw MongoDB documents (from native driver).
 */
export async function getActiveOwnerId(dbUser: UserDoc): Promise<ObjectId> {
    const cookieStore = await cookies();
    const pref = cookieStore.get(WORKSPACE_COOKIE)?.value;

    // No cookie or explicit "personal" → use own workspace
    if (!pref || pref === "personal") {
        return dbUser._id;
    }

    // Cookie is an ObjectId → validate access
    if (mongoose.Types.ObjectId.isValid(pref)) {
        const prefId = new ObjectId(pref);
        // Check if the user is actually invited to this workspace
        if (dbUser.parentId && dbUser.parentId.toString() === prefId.toString()) {
            return prefId;
        }
    }

    // Fallback to default behavior (invited workspace if exists, else personal)
    return (dbUser.parentId || dbUser._id) as ObjectId;
}

/**
 * Same as getActiveOwnerId but for Mongoose documents.
 * Returns a mongoose.Types.ObjectId.
 */
export async function getActiveOwnerIdMongoose(dbUser: { _id: mongoose.Types.ObjectId; parentId?: mongoose.Types.ObjectId }): Promise<mongoose.Types.ObjectId> {
    const cookieStore = await cookies();
    const pref = cookieStore.get(WORKSPACE_COOKIE)?.value;

    if (!pref || pref === "personal") {
        return new mongoose.Types.ObjectId(dbUser._id.toString());
    }

    if (mongoose.Types.ObjectId.isValid(pref)) {
        if (dbUser.parentId && dbUser.parentId.toString() === pref) {
            return new mongoose.Types.ObjectId(dbUser.parentId.toString());
        }
    }

    const fallback = dbUser.parentId || dbUser._id;
    return new mongoose.Types.ObjectId(fallback.toString());
}

/**
 * Resolves both the active workspace ownerId and the user's effective role in that workspace.
 * If in personal workspace, role is always "admin".
 * If in invited workspace, role is dbUser.role.
 */
export async function getActiveWorkspaceContext(dbUser: UserDoc) {
    const ownerId = await getActiveOwnerId(dbUser);
    
    let role = "admin";
    let isPersonal = true;

    if (ownerId.toString() !== dbUser._id.toString()) {
        role = dbUser.role || "viewer";
        isPersonal = false;
    }

    return { ownerId, role, isPersonal };
}

export async function getActiveWorkspaceContextMongoose(dbUser: { _id: mongoose.Types.ObjectId; parentId?: mongoose.Types.ObjectId; role?: string }) {
    const ownerId = await getActiveOwnerIdMongoose(dbUser);
    
    let role = "admin";
    let isPersonal = true;

    if (ownerId.toString() !== dbUser._id.toString()) {
        role = dbUser.role || "viewer";
        isPersonal = false;
    }

    return { ownerId, role, isPersonal };
}

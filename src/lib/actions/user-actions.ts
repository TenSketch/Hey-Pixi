"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models";
import { revalidatePath } from "next/cache";
import { UnauthorizedError, NotFoundError } from "@/lib/errors";

export async function updateUserRole(role: "admin" | "manager" | "viewer") {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            throw new UnauthorizedError();
        }

        await dbConnect();

        const dbUser = await User.findOne({ email: session.user.email });
        if (!dbUser) {
            throw new NotFoundError("User not found");
        }

        dbUser.role = role;
        await dbUser.save();

        // Revalidate the entire dashboard layout to trigger updates
        revalidatePath("/dashboard");
        revalidatePath("/dashboard/bots");
        revalidatePath("/dashboard/leads");

        return { success: true };
    } catch (error: unknown) {
        console.error("Server Action Error (updateUserRole):", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return { success: false, error: errorMessage };
    }
}

export async function simulateUsage(tokens: number) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            throw new UnauthorizedError();
        }

        await dbConnect();

        const dbUser = await User.findOne({ email: session.user.email });
        if (!dbUser) {
            throw new NotFoundError("User not found");
        }

        dbUser.tokenUsage = tokens;

        if (tokens >= 100) {
            dbUser.subscriptionStatus = "exhausted";
        } else if (tokens >= 85) {
            dbUser.subscriptionStatus = "warning_sent";
            const dashboardUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard/profile`;
            
            // Import dynamically to avoid circular references if any
            const { sendUsageWarningEmail } = await import("@/lib/mail");
            await sendUsageWarningEmail(dbUser.email, tokens, dbUser.tokenLimit, dashboardUrl);
        } else {
            dbUser.subscriptionStatus = "active";
        }

        await dbUser.save();
        revalidatePath("/dashboard/profile");

        return { success: true };
    } catch (error: unknown) {
        console.error("Server Action Error (simulateUsage):", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return { success: false, error: errorMessage };
    }
}

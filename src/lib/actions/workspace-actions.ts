"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const WORKSPACE_COOKIE = "activeWorkspace";

/**
 * Switch the active workspace. 
 * - "personal" = user's own workspace (their own _id as ownerId)
 * - An ObjectId string = an invited workspace ownerId
 */
export async function switchWorkspace(workspaceId: string) {
    const cookieStore = await cookies();
    cookieStore.set(WORKSPACE_COOKIE, workspaceId, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    // Revalidate all dashboard routes
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/bots");
    revalidatePath("/dashboard/leads");
    revalidatePath("/dashboard/profile");

    return { success: true };
}

/**
 * Get the active workspace preference from the cookie.
 * Returns "personal" or an ObjectId string.
 */
export async function getActiveWorkspaceCookie(): Promise<string> {
    const cookieStore = await cookies();
    return cookieStore.get(WORKSPACE_COOKIE)?.value || "personal";
}

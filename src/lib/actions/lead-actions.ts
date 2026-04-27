"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { Lead, User, BotConfig, ILead } from "@/models";
import { revalidatePath } from "next/cache";
import { UnauthorizedError, NotFoundError } from "@/lib/errors";

export async function updateLeadStatus(leadId: string, status: ILead["status"]) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            throw new UnauthorizedError();
        }

        await dbConnect();
        
        const dbUser = await User.findOne({ email: session.user.email });
        if (!dbUser) throw new NotFoundError("User not found");

        // Verify the lead belongs to a bot owned by this user
        const lead = await Lead.findById(leadId);
        if (!lead) throw new NotFoundError("Lead not found");

        const bot = await BotConfig.findOne({ _id: lead.botId, userId: dbUser._id });
        if (!bot) throw new UnauthorizedError("Unauthorized access to this lead");

        lead.status = status;
        await lead.save();

        revalidatePath("/dashboard/leads");
        return { success: true };
    } catch (error: unknown) {
        console.error("Server Action Error (updateLeadStatus):", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return { 
            success: false, 
            error: errorMessage,
        };
    }
}

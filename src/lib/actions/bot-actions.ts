"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { BotConfig, User } from "@/models";
import { revalidatePath } from "next/cache";

export async function createBot(data: {
    name: string;
    role: string;
    url: string;
    systemPrompt: string;
}) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            throw new Error("Unauthorized");
        }

        const { name, role, url, systemPrompt } = data;

        if (!name || !role || !systemPrompt) {
            throw new Error("Missing required fields");
        }

        await dbConnect();

        let dbUser = await User.findOne({ email: session.user.email });
        if (!dbUser) {
            dbUser = await User.create({
                email: session.user.email,
                name: session.user.name || "User",
            });
        }

        const newBot = await BotConfig.create({
            userId: dbUser._id,
            name,
            role,
            url: url || "",
            systemPrompt,
            isActive: false,
        });

        revalidatePath("/dashboard");
        return { success: true, botId: newBot._id.toString() };
    } catch (error: unknown) {
        console.error("Server Action Error (createBot):", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return { success: false, error: message };
    }
}

export async function deleteBot(botId: string) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            throw new Error("Unauthorized");
        }

        await dbConnect();
        
        // Ensure user owns the bot
        const dbUser = await User.findOne({ email: session.user.email });
        if (!dbUser) throw new Error("User not found");

        const result = await BotConfig.deleteOne({ _id: botId, userId: dbUser._id });
        
        if (result.deletedCount === 0) {
            throw new Error("Bot not found or unauthorized");
        }

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error: unknown) {
        console.error("Server Action Error (deleteBot):", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return { success: false, error: message };
    }
}

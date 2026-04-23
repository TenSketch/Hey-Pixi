"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { BotConfig, User } from "@/models";
import { revalidatePath } from "next/cache";
import { UnauthorizedError, BadRequestError, NotFoundError } from "@/lib/errors";
import { LIMITS } from "@/lib/constants";

export async function createBot(data: {
    name: string;
    role: string;
    url: string;
    systemPrompt: string;
}) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            throw new UnauthorizedError();
        }

        const { name, role, url, systemPrompt } = data;

        if (!name || !role || !systemPrompt) {
            throw new BadRequestError("Missing required fields");
        }

        // EDGE CASE: Prevent prompt bloat
        if (typeof systemPrompt !== "string" || systemPrompt.length > LIMITS.MAX_SYSTEM_PROMPT_LENGTH) {
            throw new BadRequestError(`System prompt is too long (max ${LIMITS.MAX_SYSTEM_PROMPT_LENGTH} characters)`);
        }

        await dbConnect();

        let dbUser = await User.findOne({ email: session.user.email });
        if (!dbUser) {
            dbUser = await User.create({
                email: session.user.email,
                name: session.user.name || "User",
            });
        }

        // Enforce bot limit per user
        const existingBotCount = await BotConfig.countDocuments({ userId: dbUser._id });
        if (existingBotCount >= LIMITS.MAX_BOTS_PER_USER) {
            throw new BadRequestError(`You've reached the maximum number of bots (${LIMITS.MAX_BOTS_PER_USER}).`);
        }

        const newBot = await BotConfig.create({
            userId: dbUser._id,
            name: name.trim().substring(0, LIMITS.MAX_NAME_LENGTH),
            role: role.trim(),
            url: url?.trim() || "",
            systemPrompt: systemPrompt.trim(),
            isActive: false,
        });

        revalidatePath("/dashboard");
        return { success: true, botId: newBot._id.toString() };
    } catch (error: unknown) {
        console.error("Server Action Error (createBot):", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const statusCode = (error && typeof error === 'object' && 'statusCode' in error) 
            ? (error as { statusCode: number }).statusCode 
            : 500;
        return { 
            success: false, 
            error: errorMessage,
            statusCode
        };
    }
}

export async function deleteBot(botId: string) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            throw new UnauthorizedError();
        }

        await dbConnect();
        
        const dbUser = await User.findOne({ email: session.user.email });
        if (!dbUser) throw new NotFoundError("User not found");

        const result = await BotConfig.deleteOne({ _id: botId, userId: dbUser._id });
        
        if (result.deletedCount === 0) {
            throw new NotFoundError("Bot not found or unauthorized");
        }

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error: unknown) {
        console.error("Server Action Error (deleteBot):", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const statusCode = (error && typeof error === 'object' && 'statusCode' in error) 
            ? (error as { statusCode: number }).statusCode 
            : 500;
        return { 
            success: false, 
            error: errorMessage,
            statusCode
        };
    }
}

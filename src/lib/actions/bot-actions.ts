"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { BotConfig, User } from "@/models";
import { revalidatePath } from "next/cache";
import { UnauthorizedError, BadRequestError, NotFoundError } from "@/lib/errors";

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
        if (systemPrompt.length > 4000) {
            throw new BadRequestError("System prompt is too long (max 4000 characters)");
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
            name: name.trim(),
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

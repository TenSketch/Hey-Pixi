import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { BotConfig, User, Lead, Payment } from "@/models";
import mongoose from "mongoose";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid bot ID" }, { status: 400 });
    }

    await dbConnect();
    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const bot = await BotConfig.findOne({ _id: id, userId: dbUser._id });
    if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 });

    return NextResponse.json({ bot });
  } catch (error: unknown) {
    console.error("Failed to fetch bot:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch bot";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid bot ID" }, { status: 400 });
    }

    const body = await req.json();
    const { systemPrompt, name, role } = body;


    // Validate system prompt length
    if (systemPrompt !== undefined && typeof systemPrompt === "string" && systemPrompt.length > 4000) {
      return NextResponse.json({ error: "System prompt is too long (max 4000 characters)" }, { status: 400 });
    }

    await dbConnect();
    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Build update object dynamically to avoid overwriting with undefined
    const updateData: {
      systemPrompt?: string;
      name?: string;
      role?: string;
    } = {};
    if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt;
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (role !== undefined) updateData.role = role;

    const bot = await BotConfig.findOneAndUpdate(
      { _id: id, userId: dbUser._id },
      { $set: updateData },
      { new: true }
    );

    if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 });

    return NextResponse.json({ bot, success: true });
  } catch (error: unknown) {
    console.error("Failed to update bot:", error);
    const message = error instanceof Error ? error.message : "Failed to update bot";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid bot ID" }, { status: 400 });
    }

    await dbConnect();
    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Verify ownership before deleting
    const bot = await BotConfig.findOne({ _id: id, userId: dbUser._id });
    if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 });

    // Cascading deletion — delete related data first, then the bot
    await Lead.deleteMany({ botId: id });
    await Payment.deleteMany({ botId: id });
    await BotConfig.deleteOne({ _id: id });

    return NextResponse.json({ success: true, message: "Bot and all associated data deleted successfully" });
  } catch (error: unknown) {
    console.error("Failed to delete bot:", error);
    const message = error instanceof Error ? error.message : "Failed to delete bot";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

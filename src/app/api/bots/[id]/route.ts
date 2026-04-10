import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { BotConfig, User, Lead, Payment } from "@/models";
import mongoose from "mongoose";

// Force refresh the model in development to ensure schema changes are picked up
if (process.env.NODE_ENV === "development") {
  delete mongoose.models.BotConfig;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await dbConnect();
    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const bot = await BotConfig.findOne({ _id: id, userId: dbUser._id });
    if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 });

    console.log("DEBUG [GET] Fetching bot:", { id, whatsAppOptIn: bot.whatsAppOptIn });
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
    const body = await req.json();
    const { systemPrompt, name, role, notificationPhone, whatsAppOptIn } = body;

    // Validate: if notificationPhone is provided, whatsAppOptIn must be true
    if (notificationPhone && !whatsAppOptIn) {
      return NextResponse.json(
        { error: "You must agree to the WhatsApp notifications policy to enable lead alerts." },
        { status: 400 }
      );
    }

    await dbConnect();
    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Build update object dynamically to avoid overwriting with undefined
    const updateData: {
      systemPrompt?: string;
      name?: string;
      role?: string;
      notificationPhone?: string;
      whatsAppOptIn?: boolean;
    } = {};
    if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt;
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (notificationPhone !== undefined) updateData.notificationPhone = notificationPhone;
    if (whatsAppOptIn !== undefined) updateData.whatsAppOptIn = whatsAppOptIn;

    const bot = await BotConfig.findOneAndUpdate(
      { _id: id, userId: dbUser._id },
      { $set: updateData },
      { new: true }
    );

    if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 });

    console.log("DEBUG [PATCH] Updated bot result:", { id, whatsAppOptIn: bot.whatsAppOptIn });

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

    await dbConnect();
    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Verify ownership before deleting
    const bot = await BotConfig.findOne({ _id: id, userId: dbUser._id });
    if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 });

    // Cascading deletion
    await Promise.all([
      BotConfig.deleteOne({ _id: id }),
      Lead.deleteMany({ botId: id }),
      Payment.deleteMany({ botId: id }),
    ]);

    return NextResponse.json({ success: true, message: "Bot and all associated data deleted successfully" });
  } catch (error: unknown) {
    console.error("Failed to delete bot:", error);
    const message = error instanceof Error ? error.message : "Failed to delete bot";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

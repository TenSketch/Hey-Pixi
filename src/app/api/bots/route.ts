import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { BotConfig, User } from "@/models";
import { LIMITS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, role, url, systemPrompt } = body;

    if (!name || !role || !systemPrompt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate system prompt length
    if (typeof systemPrompt !== "string" || systemPrompt.length > LIMITS.MAX_SYSTEM_PROMPT_LENGTH) {
      return NextResponse.json({ error: `System prompt is too long (max ${LIMITS.MAX_SYSTEM_PROMPT_LENGTH} characters)` }, { status: 400 });
    }

    await dbConnect();

    // Find the user object ID
    let dbUser = await User.findOne({ email: session.user.email });
    
    // If user is missing (e.g. first login via credentials/oauth bypassed dashboard ensure-logic), create them
    if (!dbUser) {
        dbUser = await User.create({
            email: session.user.email,
            name: session.user.name || "User",
        });
    }

    // Enforce bot limit per user
    const existingBotCount = await BotConfig.countDocuments({ userId: dbUser._id });
    if (existingBotCount >= LIMITS.MAX_BOTS_PER_USER) {
      return NextResponse.json(
        { error: `You've reached the maximum number of bots (${LIMITS.MAX_BOTS_PER_USER}).` },
        { status: 400 }
      );
    }

    // Create the bot (isActive=false by default, requires payment)
    const newBot = await BotConfig.create({
      userId: dbUser._id,
      name: name.trim().substring(0, LIMITS.MAX_NAME_LENGTH),
      role: role.trim(),
      url: url?.trim() || "",
      systemPrompt: systemPrompt.trim(),
      isActive: false, // Set to true after Razorpay payment
    });

    return NextResponse.json({ success: true, botId: newBot._id });
  } catch (error: unknown) {
    console.error("Failed to create bot:", error);
    const message = error instanceof Error ? error.message : "Failed to create bot";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

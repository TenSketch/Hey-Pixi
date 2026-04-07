import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { BotConfig, User } from "@/models";

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

    // Create the bot (isActive=false by default, requires payment)
    const newBot = await BotConfig.create({
      userId: dbUser._id,
      name,
      role,
      url: url || "",
      systemPrompt,
      isActive: false, // Set to true after Razorpay payment
    });

    return NextResponse.json({ success: true, botId: newBot._id });
  } catch (error: unknown) {
    console.error("Failed to create bot:", error);
    const message = error instanceof Error ? error.message : "Failed to create bot";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

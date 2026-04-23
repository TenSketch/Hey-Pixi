import { NextResponse } from "next/server";
import { auth } from "@/auth";
import Razorpay from "razorpay";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import { BotConfig, User } from "@/models";
import { PRICING } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { botId } = await req.json();
    if (!botId) return NextResponse.json({ error: "Missing botId" }, { status: 400 });

    // Validate botId format
    if (!mongoose.Types.ObjectId.isValid(botId)) {
      return NextResponse.json({ error: "Invalid bot ID" }, { status: 400 });
    }

    await dbConnect();

    // Verify bot ownership
    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const bot = await BotConfig.findOne({ _id: botId, userId: dbUser._id });
    if (!bot) return NextResponse.json({ error: "Bot not found or unauthorized" }, { status: 404 });

    // Check if already active
    if (bot.isActive) {
      return NextResponse.json({ error: "Bot is already active" }, { status: 400 });
    }

    // Ensure Razorpay keys exist
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
        return NextResponse.json({ error: "Razorpay keys not configured" }, { status: 500 });
    }

    const razorpay = new Razorpay({ key_id, key_secret });

    const options = {
        amount: PRICING.BOT_ACTIVATION_AMOUNT_PAISE,
        currency: PRICING.CURRENCY,
        receipt: `receipt_bot_${botId}`,
        notes: {
            botId: botId.toString(),
            userId: dbUser._id.toString()
        }
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order = await razorpay.orders.create(options as any);

    return NextResponse.json({ success: true, order });
  } catch (error: unknown) {
    console.error("Razorpay Order Error:", error);
    const message = error instanceof Error ? error.message : "Failed to create order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

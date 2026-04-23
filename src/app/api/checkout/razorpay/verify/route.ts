import { NextResponse } from "next/server";
import crypto from "crypto";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import { auth } from "@/auth";
import { BotConfig, Payment, User } from "@/models";
import { PRICING } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, botId } = await req.json();

    // Input validation: all fields must be present and be strings
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !botId) {
        return NextResponse.json({ error: "Missing required payment fields" }, { status: 400 });
    }

    if (typeof razorpay_order_id !== "string" || typeof razorpay_payment_id !== "string" || typeof razorpay_signature !== "string") {
        return NextResponse.json({ error: "Invalid payment field types" }, { status: 400 });
    }

    // Validate botId format
    if (!mongoose.Types.ObjectId.isValid(botId)) {
        return NextResponse.json({ error: "Invalid bot ID" }, { status: 400 });
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
        return NextResponse.json({ error: "Razorpay keys not configured" }, { status: 500 });
    }

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generated_signature = crypto
        .createHmac("sha256", key_secret)
        .update(text)
        .digest("hex");

    if (generated_signature !== razorpay_signature) {
        return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    // Payment is authentic — now verify bot ownership
    await dbConnect();

    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const bot = await BotConfig.findOne({ _id: botId, userId: dbUser._id });
    if (!bot) {
        return NextResponse.json({ error: "Bot not found or unauthorized" }, { status: 403 });
    }

    // Activate bot
    await BotConfig.findByIdAndUpdate(botId, { isActive: true });

    // Store purchase details (unique razorpayPaymentId prevents replay)
    await Payment.create({
        userId: dbUser._id,
        botId,
        amount: PRICING.BOT_ACTIVATION_AMOUNT_PAISE,
        currency: PRICING.CURRENCY,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "successful"
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Payment Verification Error:", error);

    // Handle duplicate payment (replay attack)
    if (error && typeof error === "object" && "code" in error && (error as { code: number }).code === 11000) {
        return NextResponse.json({ error: "This payment has already been processed" }, { status: 409 });
    }

    const message = error instanceof Error ? error.message : "Failed to verify payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

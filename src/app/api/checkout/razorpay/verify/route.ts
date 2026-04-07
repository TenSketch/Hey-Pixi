import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/mongodb";
import { auth } from "@/auth";
import { BotConfig, Payment } from "@/models";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, botId } = await req.json();

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

    // Payment is authentic, activate the bot and save receipt
    await dbConnect();
    await BotConfig.findByIdAndUpdate(botId, { isActive: true });

    // Store purchase details
    await Payment.create({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        userId: (session.user as any).id,
        botId,
        amount: 1999 * 100, // Stored in paise as per standard
        currency: "INR",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "successful"
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Payment Verification Error:", error);
    const message = error instanceof Error ? error.message : "Failed to verify payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

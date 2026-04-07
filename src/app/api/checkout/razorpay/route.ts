import { NextResponse } from "next/server";
import { auth } from "@/auth";
import Razorpay from "razorpay";
import dbConnect from "@/lib/mongodb";
import { BotConfig } from "@/models";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { botId } = await req.json();
    if (!botId) return NextResponse.json({ error: "Missing botId" }, { status: 400 });

    await dbConnect();
    const bot = await BotConfig.findById(botId);
    if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 });

    // Ensure Razorpay keys exist
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
        return NextResponse.json({ error: "Razorpay keys not configured" }, { status: 500 });
    }

    const razorpay = new Razorpay({ key_id, key_secret });

    // Price is fixed at 1999 INR for this demo
    const options = {
        amount: 1999 * 100, // amount in absolute smallest currency unit
        currency: "INR",
        receipt: `receipt_bot_${botId}`,
        notes: {
            botId: botId.toString(),
            userId: session.user.id
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

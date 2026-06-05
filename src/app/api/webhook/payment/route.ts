import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/mongodb";
import { User, Payment } from "@/models";

export async function POST(req: Request) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers.get("x-razorpay-signature");
    const payloadText = await req.text();

    // Verify webhook signature if secret is configured
    if (secret && signature) {
      const shasum = crypto.createHmac("sha256", secret);
      shasum.update(payloadText);
      const digest = shasum.digest("hex");
      if (digest !== signature) {
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
      }
    } else {
      console.warn("Razorpay Webhook: Signature verification skipped (RAZORPAY_WEBHOOK_SECRET not set).");
    }

    const eventData = JSON.parse(payloadText);
    const event = eventData.event;
    console.log(`[Webhook] Received Razorpay event: ${event}`);

    await dbConnect();

    // 1. Handle recurring subscription charge (standing instruction capture)
    if (event === "subscription.charged") {
      const subscription = eventData.payload.subscription.entity;
      const payment = eventData.payload.payment?.entity;
      const userId = subscription.notes?.userId;

      if (userId) {
        const user = await User.findById(userId);
        if (user) {
          user.subscriptionPlan = "pro";
          user.tokenUsage = 0; // Reset token usage
          user.tokenLimit = 10000; // Give high limit for Pro
          user.subscriptionStatus = "active";
          user.paymentMandateId = subscription.id;
          user.autoRenew = true;
          await user.save();
          console.log(`[Webhook] User ${user.email} successfully upgraded to PRO via subscription charge.`);

          // Log transaction record
          if (payment) {
            await Payment.create({
              userId: user._id,
              amount: payment.amount,
              currency: payment.currency,
              razorpayOrderId: payment.order_id || "",
              razorpayPaymentId: payment.id,
              razorpaySignature: signature || "webhook",
              status: "successful",
            });
          }
        }
      }
    }

    // 2. Handle cancellation/expiration
    if (event === "subscription.cancelled" || event === "subscription.expired") {
      const subscription = eventData.payload.subscription.entity;
      const userId = subscription.notes?.userId;

      if (userId) {
        const user = await User.findById(userId);
        if (user) {
          user.subscriptionPlan = "free";
          user.tokenLimit = 100;
          user.subscriptionStatus = "active";
          user.autoRenew = false;
          await user.save();
          console.log(`[Webhook] User ${user.email} subscription cancelled/expired. Plan reverted to free.`);
        }
      }
    }

    // 3. Handle payment failure / halted subscription
    if (event === "subscription.halted") {
      const subscription = eventData.payload.subscription.entity;
      const userId = subscription.notes?.userId;

      if (userId) {
        const user = await User.findById(userId);
        if (user) {
          user.subscriptionStatus = "past_due";
          await user.save();
          console.log(`[Webhook] User ${user.email} subscription payment failed. Status set to past_due.`);
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error: unknown) {
    console.error("Webhook processing error:", error);
    const message = error instanceof Error ? error.message : "Webhook failure";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

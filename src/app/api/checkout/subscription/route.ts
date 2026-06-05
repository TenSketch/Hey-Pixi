import { NextResponse } from "next/server";
import { auth } from "@/auth";
import Razorpay from "razorpay";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { getActiveWorkspaceContextMongoose } = await import("@/lib/workspace");
    const { ownerId, role: effectiveRole } = await getActiveWorkspaceContextMongoose(dbUser);

    // Enforce RBAC
    if (effectiveRole === "viewer") {
      return NextResponse.json({ error: "Unauthorized: Viewers cannot subscribe to plans" }, { status: 403 });
    }

    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    const planId = process.env.RAZORPAY_PLAN_ID;

    if (!key_id || !key_secret) {
        return NextResponse.json({ error: "Razorpay keys not configured" }, { status: 500 });
    }

    if (!planId) {
        return NextResponse.json({ error: "Razorpay Plan ID not configured in environment" }, { status: 500 });
    }

    const razorpay = new Razorpay({ key_id, key_secret });

    // Create a subscription plan in Razorpay
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 12, // 12 cycles (e.g. 1 year monthly renew)
      quantity: 1,
      customer_notify: 1,
      notes: {
        userId: ownerId.toString()
      }
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      keyId: key_id
    });

  } catch (error: unknown) {
    console.error("Razorpay Subscription Error:", error);
    const message = error instanceof Error ? error.message : "Failed to create subscription";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

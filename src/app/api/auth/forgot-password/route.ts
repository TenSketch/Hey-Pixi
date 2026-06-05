import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models";
import { rateLimit } from "@/lib/rate-limit";
import { VALIDATION } from "@/lib/constants";
import { sendResetPasswordEmail } from "@/lib/mail";
import crypto from "crypto";

// Rate limiter for forgot-password: 3 requests per hour per IP
const limiter = rateLimit({
  interval: 60 * 60 * 1000,
  uniqueTokenPerInterval: 500,
});

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { isRateLimited, headers } = limiter.check(3, ip);

    if (isRateLimited) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in an hour." },
        { status: 429, headers }
      );
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400, headers });
    }

    // Validate email format
    if (typeof email !== "string" || !VALIDATION.EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400, headers });
    }

    await dbConnect();

    // Find the user
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // For security: return generic success even if user does not exist
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account is associated with this email, a reset link has been sent.",
      }, { headers });
    }

    // Generate secure token and expiration (15 minutes)
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Update user document
    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires;
    await user.save();

    // Construct reset URL
    const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${origin}/auth/reset-password?token=${token}`;

    if (process.env.NODE_ENV === "development") {
      console.log(`\n--- [DEV] PASSWORD RESET LINK ---`);
      console.log(resetUrl);
      console.log(`---------------------------------\n`);
    }

    // Send email
    try {
      await sendResetPasswordEmail(user.email, resetUrl);
    } catch (mailError) {
      console.error("Failed to send reset password email:", mailError);
      // Even if email fails to send in dev, we return success so the user can use the console link,
      // or in production we might show an error depending on preference.
      // But let's log the error.
    }

    return NextResponse.json({
      success: true,
      message: "If an account is associated with this email, a reset link has been sent.",
    }, { headers });

  } catch (error: unknown) {
    console.error("Forgot Password Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

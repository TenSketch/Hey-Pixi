import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models";
import bcrypt from "bcryptjs";
import { VALIDATION } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate password length
    if (typeof password !== "string" || password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters` },
        { status: 400 }
      );
    }

    // Validate password contains at least one number
    if (!/\d/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one number" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find user with matching, non-expired token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and clear reset fields
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    });

  } catch (error: unknown) {
    console.error("Reset Password Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

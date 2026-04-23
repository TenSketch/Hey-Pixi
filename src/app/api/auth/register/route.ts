import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models";
import bcrypt from "bcryptjs";
import { rateLimit } from "@/lib/rate-limit";
import { VALIDATION, LIMITS } from "@/lib/constants";

// Rate limiter for registration: 5 requests per hour per IP
const limiter = rateLimit({
  interval: 60 * 60 * 1000, 
  uniqueTokenPerInterval: 500, 
});

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { isRateLimited, headers } = limiter.check(5, ip);

    if (isRateLimited) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again in an hour." },
        { status: 429, headers }
      );
    }

    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400, headers });
    }

    // Validate email format
    if (typeof email !== "string" || !VALIDATION.EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400, headers });
    }

    // Validate name length
    if (typeof name !== "string" || name.trim().length === 0 || name.trim().length > LIMITS.MAX_NAME_LENGTH) {
      return NextResponse.json({ error: `Name must be between 1 and ${LIMITS.MAX_NAME_LENGTH} characters` }, { status: 400, headers });
    }

    // Strengthened Password Policy: Min 8 chars, must contain a number
    if (typeof password !== "string" || password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      return NextResponse.json({ error: `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters` }, { status: 400, headers });
    }

    if (!/\d/.test(password)) {
      return NextResponse.json({ error: "Password must contain at least one number" }, { status: 400, headers });
    }

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400, headers });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const newUser = await User.create({
      name: name.trim().substring(0, LIMITS.MAX_NAME_LENGTH),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    return NextResponse.json({ 
      success: true, 
      message: "User registered successfully",
      userId: newUser._id 
    }, { headers });

  } catch (error: unknown) {
    console.error("Registration Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

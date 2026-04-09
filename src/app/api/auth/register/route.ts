import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models";
import bcrypt from "bcryptjs";
import { rateLimit } from "@/lib/rate-limit";

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

    // Strengthened Password Policy: Min 8 chars, must contain a number
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400, headers });
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
      name: name.trim(),
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

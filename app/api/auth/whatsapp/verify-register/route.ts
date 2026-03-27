/**
 * WhatsApp Register - Verify OTP and create account
 * POST /api/auth/whatsapp/verify-register
 */
import { NextResponse } from "next/server";
import { createDb } from "@/lib/db";
import { whatsappOtp, users, userPhones } from "@/lib/schema";
import { eq, and, gt, desc } from "drizzle-orm";
import { formatPhoneNumber } from "@/lib/whatsapp";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

const MAX_VERIFY_ATTEMPTS = 5;

async function hashOTP(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp + (process.env.AUTH_SECRET || "otp-secret"));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      phone?: string;
      otp?: string;
      email?: string;
      username?: string;
      name?: string;
      password?: string;
    };
    const { phone, otp, email, username, name, password } = body;

    if (!phone || !otp || !email || !username || !password) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (username.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Username cannot contain @" },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(phone);
    const otpHash = await hashOTP(otp);

    const db = createDb();

    // Find OTP record
    const otpRecord = await db.query.whatsappOtp.findFirst({
      where: and(
        eq(whatsappOtp.phone, formattedPhone),
        eq(whatsappOtp.purpose, "register"),
        eq(whatsappOtp.verified, false),
        gt(whatsappOtp.expiresAt, new Date())
      ),
      orderBy: desc(whatsappOtp.createdAt),
    });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, error: "OTP expired or not found" },
        { status: 400 }
      );
    }

    if (otpRecord.attempts >= MAX_VERIFY_ATTEMPTS) {
      return NextResponse.json(
        { success: false, error: "Too many failed attempts" },
        { status: 429 }
      );
    }

    // Verify OTP
    if (otpRecord.otpHash !== otpHash) {
      await db
        .update(whatsappOtp)
        .set({ attempts: otpRecord.attempts + 1 })
        .where(eq(whatsappOtp.id, otpRecord.id));

      return NextResponse.json(
        { success: false, error: "Invalid OTP" },
        { status: 400 }
      );
    }

    // Check if email/username already taken (final check)
    const existingEmail = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });
    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: "Email already registered" },
        { status: 409 }
      );
    }

    const existingUsername = await db.query.users.findFirst({
      where: eq(users.username, username),
    });
    if (existingUsername) {
      return NextResponse.json(
        { success: false, error: "Username already taken" },
        { status: 409 }
      );
    }

    const existingPhone = await db.query.userPhones.findFirst({
      where: eq(userPhones.phone, formattedPhone),
    });
    if (existingPhone) {
      return NextResponse.json(
        { success: false, error: "Phone already registered" },
        { status: 409 }
      );
    }

    // Mark OTP as verified
    await db
      .update(whatsappOtp)
      .set({ verified: true, verifiedAt: new Date() })
      .where(eq(whatsappOtp.id, otpRecord.id));

    // Create user
    const hashedPassword = await bcrypt.hash(password, 12);
    const [newUser] = await db
      .insert(users)
      .values({
        username,
        email: email.toLowerCase(),
        name: name?.trim() || username,
        password: hashedPassword,
        emailVerified: new Date(), // Already verified via WhatsApp
      })
      .returning();

    // Link phone to user
    await db.insert(userPhones).values({
      userId: newUser.id,
      phone: formattedPhone,
      verified: true,
      verifiedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
    });
  } catch (error) {
    console.error("WhatsApp verify register error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

/**
 * WhatsApp Reset Password - Verify OTP and set new password
 * POST /api/auth/whatsapp/verify-reset
 */
import { NextResponse } from "next/server";
import { createDb } from "@/lib/db";
import { whatsappOtp, users } from "@/lib/schema";
import { eq, and, gt, desc } from "drizzle-orm";
import { formatPhoneNumber } from "@/lib/whatsapp";
import bcrypt from "bcryptjs";

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
      newPassword?: string;
    };
    const { phone, otp, newPassword } = body;

    if (!phone || !otp || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Phone, OTP, and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters" },
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
        eq(whatsappOtp.purpose, "reset"),
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

    if (!otpRecord.userId) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Mark OTP as verified
    await db
      .update(whatsappOtp)
      .set({ verified: true, verifiedAt: new Date() })
      .where(eq(whatsappOtp.id, otpRecord.id));

    // Update user password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, otpRecord.userId));

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("WhatsApp verify reset error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

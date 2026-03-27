/**
 * WhatsApp Reset Password - Request OTP
 * POST /api/auth/whatsapp/request-reset
 */
import { NextResponse } from "next/server";
import { createDb } from "@/lib/db";
import { whatsappOtp, userPhones, users } from "@/lib/schema";
import { eq, and, gt, desc } from "drizzle-orm";
import { sendWhatsAppOTP, generateOTP, formatPhoneNumber } from "@/lib/whatsapp";

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const MAX_REQUESTS_PER_HOUR = 3;
const MIN_REQUEST_INTERVAL_MS = 60 * 1000;

async function hashOTP(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp + (process.env.AUTH_SECRET || "otp-secret"));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { phone?: string };
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Phone number is required" },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(phone);

    if (!/^62\d{9,12}$/.test(formattedPhone)) {
      return NextResponse.json(
        { success: false, error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    const db = createDb();

    // Check if phone is linked to a user
    const userPhone = await db.query.userPhones.findFirst({
      where: and(
        eq(userPhones.phone, formattedPhone),
        eq(userPhones.verified, true)
      ),
      with: { user: true },
    });

    if (!userPhone || !userPhone.user) {
      return NextResponse.json(
        { success: false, error: "Phone number not registered" },
        { status: 404 }
      );
    }

    // Rate limit check
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentRequests = await db.query.whatsappOtp.findMany({
      where: and(
        eq(whatsappOtp.phone, formattedPhone),
        eq(whatsappOtp.purpose, "reset"),
        gt(whatsappOtp.createdAt, oneHourAgo)
      ),
      orderBy: desc(whatsappOtp.createdAt),
    });

    if (recentRequests.length >= MAX_REQUESTS_PER_HOUR) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Try again later." },
        { status: 429 }
      );
    }

    if (recentRequests.length > 0) {
      const lastRequest = recentRequests[0];
      const timeSince = Date.now() - lastRequest.createdAt.getTime();
      if (timeSince < MIN_REQUEST_INTERVAL_MS) {
        const wait = Math.ceil((MIN_REQUEST_INTERVAL_MS - timeSince) / 1000);
        return NextResponse.json(
          { success: false, error: `Please wait ${wait} seconds` },
          { status: 429 }
        );
      }
    }

    // Generate and send OTP
    const otpCode = generateOTP(6);
    const otpHash = await hashOTP(otpCode);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    const sendResult = await sendWhatsAppOTP(formattedPhone, otpCode);

    if (!sendResult.success) {
      return NextResponse.json(
        { success: false, error: "Failed to send OTP" },
        { status: 500 }
      );
    }

    await db.insert(whatsappOtp).values({
      phone: formattedPhone,
      otpHash,
      userId: userPhone.userId,
      purpose: "reset",
      messageId: sendResult.messageId,
      expiresAt,
    });

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      expires_in: Math.floor(OTP_EXPIRY_MS / 1000),
    });
  } catch (error) {
    console.error("WhatsApp reset request error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

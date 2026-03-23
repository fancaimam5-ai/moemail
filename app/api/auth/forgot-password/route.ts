import { NextResponse } from "next/server"
import { sendResetPasswordEmail } from "@/lib/email/tokens"
import { verifyTurnstileToken } from "@/lib/turnstile"

export async function POST(request: Request) {
  try {
    const { email, turnstileToken } = await request.json() as { email: string; turnstileToken?: string }

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const verification = await verifyTurnstileToken(turnstileToken)
    if (!verification.success) {
      return NextResponse.json({ error: "Please complete the security verification" }, { status: 400 })
    }

    const ipHeader = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown"
    const result = await sendResetPasswordEmail(email.toLowerCase(), ipHeader)

    if (!result.success && result.error) {
      return NextResponse.json({ error: result.error }, { status: 429 })
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({ success: true, message: "If an account with this email exists, a reset link has been sent." })
  } catch {
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}

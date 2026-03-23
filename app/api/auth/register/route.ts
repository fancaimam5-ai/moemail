import { NextResponse } from "next/server"
import { register } from "@/lib/auth"
import { registerSchema, RegisterSchema, DEFAULT_ALLOWED_EMAIL_DOMAINS } from "@/lib/validation"
import { verifyTurnstileToken } from "@/lib/turnstile"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { sendVerificationEmail } from "@/lib/email/tokens"
import { checkRateLimit } from "@/lib/email"

async function getAllowedDomains(): Promise<string[]> {
  try {
    const { env } = getCloudflareContext()
    const custom = await env.SITE_CONFIG.get("ALLOWED_EMAIL_DOMAINS")
    if (custom) {
      const parsed = JSON.parse(custom) as string[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // fallback to defaults
  }
  return DEFAULT_ALLOWED_EMAIL_DOMAINS
}

export async function POST(request: Request) {
  try {
    // IP-based rate limit: 10 registrations per hour per IP
    const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown"
    const rateCheck = await checkRateLimit(`register:${ip}`, "register", 10, 60 * 60 * 1000)
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "Too many registration attempts. Please try again later." }, { status: 429 })
    }

    const json = await request.json() as RegisterSchema
    
    try {
      registerSchema.parse(json)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Invalid input format" },
        { status: 400 }
      )
    }

    const { username, password, email, name, turnstileToken } = json

    const verification = await verifyTurnstileToken(turnstileToken)
    if (!verification.success) {
      const message = verification.reason === "missing-token"
        ? "Please complete the security verification"
        : "Security verification failed"
      return NextResponse.json({ error: message }, { status: 400 })
    }

    // Validate email domain
    const emailDomain = email.toLowerCase().split("@")[1]
    const allowedDomains = await getAllowedDomains()
    if (!allowedDomains.includes(emailDomain)) {
      return NextResponse.json(
        { error: "Registration is only available for major email providers (Gmail, Outlook, Yahoo, etc.)" },
        { status: 400 }
      )
    }

    const user = await register(username, password, email, name)

    // Send verification email (non-blocking — don't fail registration if this fails)
    try {
      await sendVerificationEmail(user.id, ip)
    } catch (e) {
      console.error("Failed to send verification email:", e)
    }

    return NextResponse.json({ user: { id: user.id, username: user.username, email: user.email } })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed"
    const status = message.includes("already") ? 409 : 500
    return NextResponse.json({ error: message }, { status })
  }
} 

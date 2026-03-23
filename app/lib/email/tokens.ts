import { createDb } from "@/lib/db"
import { emailTokens, users } from "@/lib/schema"
import { eq, and, gt, isNull } from "drizzle-orm"
import { sendEmail, checkRateLimit, checkGlobalDailyLimit } from "@/lib/email"
import { verifyEmailTemplate, resetPasswordTemplate, magicLinkTemplate } from "@/lib/email/templates"
import { getCloudflareContext } from "@opennextjs/cloudflare"

type TokenType = "verify" | "reset" | "magic_link" | "magic_session"

const TOKEN_EXPIRY: Record<TokenType, number> = {
  verify: 24 * 60 * 60 * 1000, // 24 hours
  reset: 60 * 60 * 1000,       // 1 hour
  magic_link: 10 * 60 * 1000,  // 10 minutes
  magic_session: 60 * 1000,    // 60 seconds (one-time auto-login)
}

const RATE_LIMITS: Record<TokenType, { max: number; windowMs: number }> = {
  verify: { max: 3, windowMs: 60 * 60 * 1000 },     // 3 per hour
  reset: { max: 3, windowMs: 60 * 60 * 1000 },       // 3 per hour
  magic_link: { max: 5, windowMs: 60 * 60 * 1000 },  // 5 per hour
  magic_session: { max: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
}

async function hashToken(token: string): Promise<string> {
  const encoded = new TextEncoder().encode(token)
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded)
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("")
}

export async function createToken(userId: string, type: TokenType): Promise<string> {
  const db = createDb()
  const token = crypto.randomUUID()
  const tokenHash = await hashToken(token)
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY[type])

  // Invalidate existing unused tokens of the same type for this user
  await db
    .select({ id: emailTokens.id })
    .from(emailTokens)
    .where(
      and(
        eq(emailTokens.userId, userId),
        eq(emailTokens.type, type),
        isNull(emailTokens.usedAt),
        gt(emailTokens.expiresAt, new Date())
      )
    )

  // We don't delete — just let them expire. New token takes precedence.

  await db.insert(emailTokens).values({
    userId,
    tokenHash,
    type,
    expiresAt,
  })

  return token
}

export async function verifyToken(token: string, type: TokenType): Promise<{ valid: boolean; userId?: string }> {
  const db = createDb()
  const tokenHash = await hashToken(token)

  const record = await db
    .select()
    .from(emailTokens)
    .where(
      and(
        eq(emailTokens.tokenHash, tokenHash),
        eq(emailTokens.type, type),
        isNull(emailTokens.usedAt),
        gt(emailTokens.expiresAt, new Date())
      )
    )
    .limit(1)

  if (!record[0]) {
    return { valid: false }
  }

  // Mark as used
  await db
    .update(emailTokens)
    .set({ usedAt: new Date() })
    .where(eq(emailTokens.id, record[0].id))

  return { valid: true, userId: record[0].userId }
}

interface SendTokenResult {
  success: boolean
  error?: string
}

export async function sendVerificationEmail(userId: string, rateLimitKey: string): Promise<SendTokenResult> {
  // Rate limit check
  const rateLimit = await checkRateLimit(rateLimitKey, "verify_resend", RATE_LIMITS.verify.max, RATE_LIMITS.verify.windowMs)
  if (!rateLimit.allowed) {
    return { success: false, error: "Too many requests. Please try again later." }
  }

  const globalLimit = await checkGlobalDailyLimit()
  if (!globalLimit.allowed) {
    return { success: false, error: "Email service is temporarily unavailable. Please try again later." }
  }

  const db = createDb()
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user[0] || !user[0].email) {
    return { success: false, error: "User not found or no email address" }
  }

  const token = await createToken(userId, "verify")
  const baseUrl = await getBaseUrl()
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`
  const locale = user[0].locale || "en"
  const template = verifyEmailTemplate(user[0].name || user[0].username || "User", verifyUrl, locale)

  const result = await sendEmail({
    to: user[0].email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    emailType: "verify",
  })

  return { success: result.success, error: result.error }
}

export async function sendResetPasswordEmail(email: string, rateLimitKey: string): Promise<SendTokenResult> {
  const rateLimit = await checkRateLimit(rateLimitKey, "reset_password", RATE_LIMITS.reset.max, RATE_LIMITS.reset.windowMs)
  if (!rateLimit.allowed) {
    return { success: false, error: "Too many requests. Please try again later." }
  }

  const globalLimit = await checkGlobalDailyLimit()
  if (!globalLimit.allowed) {
    return { success: false, error: "Email service is temporarily unavailable. Please try again later." }
  }

  const db = createDb()
  const user = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (!user[0]) {
    // Don't reveal if user exists — return success anyway
    return { success: true }
  }

  const token = await createToken(user[0].id, "reset")
  const baseUrl = await getBaseUrl()
  const resetUrl = `${baseUrl}/reset-password?token=${token}`
  const locale = user[0].locale || "en"
  const template = resetPasswordTemplate(user[0].name || user[0].username || "User", resetUrl, locale)

  const result = await sendEmail({
    to: user[0].email!,
    subject: template.subject,
    html: template.html,
    text: template.text,
    emailType: "reset",
  })

  return { success: result.success, error: result.error }
}

export async function sendMagicLinkEmail(email: string, rateLimitKey: string): Promise<SendTokenResult> {
  const rateLimit = await checkRateLimit(rateLimitKey, "magic_link", RATE_LIMITS.magic_link.max, RATE_LIMITS.magic_link.windowMs)
  if (!rateLimit.allowed) {
    return { success: false, error: "Too many requests. Please try again later." }
  }

  const globalLimit = await checkGlobalDailyLimit()
  if (!globalLimit.allowed) {
    return { success: false, error: "Email service is temporarily unavailable. Please try again later." }
  }

  const db = createDb()
  const user = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (!user[0]) {
    // Don't reveal if user exists
    return { success: true }
  }

  const token = await createToken(user[0].id, "magic_link")
  const baseUrl = await getBaseUrl()
  const loginUrl = `${baseUrl}/api/auth/magic-link?token=${token}`
  const locale = user[0].locale || "en"
  const template = magicLinkTemplate(user[0].name || user[0].username || "User", loginUrl, locale)

  const result = await sendEmail({
    to: user[0].email!,
    subject: template.subject,
    html: template.html,
    text: template.text,
    emailType: "magic_link",
  })

  return { success: result.success, error: result.error }
}

async function getBaseUrl(): Promise<string> {
  try {
    const { env } = getCloudflareContext()
    const configuredUrl = await env.SITE_CONFIG.get("SITE_URL")
    if (configuredUrl) return configuredUrl
  } catch {
    // fallback
  }
  return process.env.NEXTAUTH_URL || process.env.SITE_URL || "https://localhost:3000"
}

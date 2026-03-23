import { createDb } from "@/lib/db"
import { emailProviders, emailDeliveryLogs, emailRateLimits } from "@/lib/schema"
import { eq, and, asc, sql } from "drizzle-orm"
import { decrypt } from "./crypto"
import { SendGridAdapter } from "./providers/sendgrid"
import { HttpRelayAdapter } from "./providers/http-relay"
import type { EmailProviderAdapter, EmailMessage, SendResult, ProviderConfig } from "./providers/base"

const adapters: Record<string, EmailProviderAdapter> = {
  sendgrid: new SendGridAdapter(),
  http_relay: new HttpRelayAdapter(),
}

function getAdapter(providerType: string): EmailProviderAdapter {
  const adapter = adapters[providerType]
  if (!adapter) throw new Error(`Unknown provider type: ${providerType}`)
  return adapter
}

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  emailType: string // 'verify' | 'reset' | 'magic_link' | 'notif_quota' | 'notif_security' | 'notif_premium' | 'test'
}

export async function sendEmail(options: SendEmailOptions): Promise<SendResult> {
  const db = createDb()

  // Check global daily send limit for user-originated outbound emails
  if (options.emailType === "outbound_user") {
    const globalLimit = await checkGlobalDailyLimit()
    if (!globalLimit.allowed) {
      return { success: false, error: "Daily outbound email limit reached. Please try again tomorrow." }
    }
  }

  // Get active providers ordered by priority (lower = higher priority)
  const providers = await db
    .select()
    .from(emailProviders)
    .where(eq(emailProviders.status, "active"))
    .orderBy(asc(emailProviders.priority))

  if (providers.length === 0) {
    return { success: false, error: "No active email provider configured" }
  }

  const message: EmailMessage = {
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  }

  // Try providers in priority order (fallback chain)
  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i]
    const attempt = i + 1

    try {
      let apiKey = ""
      if (provider.encryptedApiKey) {
        apiKey = await decrypt(provider.encryptedApiKey)
      }

      let relayAuth: string | null = null
      if (provider.encryptedRelayAuth) {
        relayAuth = await decrypt(provider.encryptedRelayAuth)
      }

      const config: ProviderConfig = {
        apiKey,
        fromEmail: provider.fromEmail,
        fromName: provider.fromName,
        replyTo: provider.replyTo,
        relayEndpoint: provider.relayEndpoint,
        relayAuth,
      }

      const adapter = getAdapter(provider.providerType)
      const result = await adapter.send(message, config)

      // Log the delivery attempt
      await db.insert(emailDeliveryLogs).values({
        providerId: provider.id,
        providerLabel: provider.label,
        emailType: options.emailType,
        toAddress: options.to,
        subject: options.subject,
        status: result.success ? "sent" : "failed",
        statusCode: result.statusCode,
        providerMessageId: result.messageId,
        errorMessage: result.error,
        attemptNumber: attempt,
      })

      if (result.success) {
        // Update provider stats
        await db
          .update(emailProviders)
          .set({ totalSent: sql`${emailProviders.totalSent} + 1` })
          .where(eq(emailProviders.id, provider.id))

        return result
      }

      // Update failure stats
      await db
        .update(emailProviders)
        .set({ totalFailed: sql`${emailProviders.totalFailed} + 1` })
        .where(eq(emailProviders.id, provider.id))

      // If this was the last provider, return the failure
      if (i === providers.length - 1) {
        return result
      }
      // Otherwise continue to next provider in fallback chain
    } catch (err) {
      // Log error and try next provider
      await db.insert(emailDeliveryLogs).values({
        providerId: provider.id,
        providerLabel: provider.label,
        emailType: options.emailType,
        toAddress: options.to,
        subject: options.subject,
        status: "failed",
        errorMessage: err instanceof Error ? err.message : "Unknown error",
        attemptNumber: attempt,
      })

      if (i === providers.length - 1) {
        return { success: false, error: err instanceof Error ? err.message : "All providers failed" }
      }
    }
  }

  return { success: false, error: "No providers available" }
}

// Rate limiting

interface RateLimitCheck {
  allowed: boolean
  remaining: number
  resetAt: Date
}

export async function checkRateLimit(
  key: string,
  action: string,
  maxCount: number,
  windowMs: number
): Promise<RateLimitCheck> {
  const db = createDb()
  const now = Date.now()
  const windowStart = now - windowMs

  const existing = await db
    .select()
    .from(emailRateLimits)
    .where(
      and(
        eq(emailRateLimits.key, key),
        eq(emailRateLimits.action, action)
      )
    )
    .limit(1)

  const record = existing[0]

  if (!record || record.windowStart.getTime() < windowStart) {
    // Window expired or no record — reset
    if (record) {
      await db
        .update(emailRateLimits)
        .set({ count: 1, windowStart: new Date(now) })
        .where(eq(emailRateLimits.id, record.id))
    } else {
      await db.insert(emailRateLimits).values({
        key,
        action,
        count: 1,
        windowStart: new Date(now),
      })
    }
    return { allowed: true, remaining: maxCount - 1, resetAt: new Date(now + windowMs) }
  }

  if (record.count >= maxCount) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(record.windowStart.getTime() + windowMs),
    }
  }

  await db
    .update(emailRateLimits)
    .set({ count: record.count + 1 })
    .where(eq(emailRateLimits.id, record.id))

  return {
    allowed: true,
    remaining: maxCount - record.count - 1,
    resetAt: new Date(record.windowStart.getTime() + windowMs),
  }
}

// Global daily send limit (SendGrid free = 100/day)
export async function checkGlobalDailyLimit(): Promise<RateLimitCheck> {
  const maxDaily = 90 // Leave 10 buffer from SendGrid's 100/day
  return checkRateLimit("global", "daily_send", maxDaily, 24 * 60 * 60 * 1000)
}

// Test a specific provider
export async function testProvider(providerId: string): Promise<SendResult> {
  const db = createDb()
  const provider = await db
    .select()
    .from(emailProviders)
    .where(eq(emailProviders.id, providerId))
    .limit(1)

  if (!provider[0]) {
    return { success: false, error: "Provider not found" }
  }

  const p = provider[0]
  let apiKey = ""
  if (p.encryptedApiKey) {
    apiKey = await decrypt(p.encryptedApiKey)
  }

  let relayAuth: string | null = null
  if (p.encryptedRelayAuth) {
    relayAuth = await decrypt(p.encryptedRelayAuth)
  }

  const config: ProviderConfig = {
    apiKey,
    fromEmail: p.fromEmail,
    fromName: p.fromName,
    replyTo: p.replyTo,
    relayEndpoint: p.relayEndpoint,
    relayAuth,
  }

  const adapter = getAdapter(p.providerType)
  const result = await adapter.testConnection(config)

  // Update test result
  const newStatus = result.success
    ? (p.status === "draft" || p.status === "failed" ? "tested" : p.status)
    : "failed"

  await db
    .update(emailProviders)
    .set({
      lastTestedAt: new Date(),
      lastTestResult: result.success ? "success" : (result.error || "failed"),
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(emailProviders.id, providerId))

  // Log test delivery
  await db.insert(emailDeliveryLogs).values({
    providerId: p.id,
    providerLabel: p.label,
    emailType: "test",
    toAddress: p.fromEmail,
    subject: "IfMail - Email Provider Test",
    status: result.success ? "sent" : "failed",
    statusCode: result.statusCode,
    providerMessageId: result.messageId,
    errorMessage: result.error,
    attemptNumber: 1,
  })

  return result
}

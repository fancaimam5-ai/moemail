import { createDb } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { sendEmail, checkRateLimit, checkGlobalDailyLimit } from "@/lib/email"
import {
  quotaWarningTemplate,
  quotaExhaustedTemplate,
  securityAlertTemplate,
  premiumActivatedTemplate,
  premiumExpiringTemplate,
} from "@/lib/email/templates"
import { getCloudflareContext } from "@opennextjs/cloudflare"

async function getBaseUrl(): Promise<string> {
  try {
    const { env } = getCloudflareContext()
    const configuredUrl = await env.SITE_CONFIG.get("SITE_URL")
    if (configuredUrl) return configuredUrl
  } catch {
    // fallback
  }

  return process.env.NEXTAUTH_URL || process.env.SITE_URL || "https://if-mail.tech"
}

export async function sendQuotaNotification(userId: string, used: number, total: number) {
  const rateLimit = await checkRateLimit(userId, "notif_quota", 1, 24 * 60 * 60 * 1000) // 1 per day
  if (!rateLimit.allowed) return

  const globalLimit = await checkGlobalDailyLimit()
  if (!globalLimit.allowed) return

  const db = createDb()
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user[0]?.email) return

  const locale = user[0].locale || "en"
  const userName = user[0].name || user[0].username || "User"
  const isExhausted = used >= total
  const baseUrl = await getBaseUrl()
  const pricingUrl = `${baseUrl}/pricing`
  const template = isExhausted
    ? quotaExhaustedTemplate(userName, used, total, pricingUrl, locale)
    : quotaWarningTemplate(userName, used, total, locale)

  await sendEmail({
    to: user[0].email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    emailType: isExhausted ? "notif_quota_exhausted" : "notif_quota",
  })
}

export async function sendSecurityNotification(userId: string, ipHash: string) {
  const rateLimit = await checkRateLimit(userId, "notif_security", 3, 60 * 60 * 1000) // 3 per hour
  if (!rateLimit.allowed) return

  const globalLimit = await checkGlobalDailyLimit()
  if (!globalLimit.allowed) return

  const db = createDb()
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user[0]?.email) return

  const locale = user[0].locale || "en"
  const time = new Date().toISOString()
  const template = securityAlertTemplate(user[0].name || user[0].username || "User", ipHash, time, locale)

  await sendEmail({
    to: user[0].email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    emailType: "notif_security",
  })
}

export async function sendPremiumNotification(userId: string) {
  const globalLimit = await checkGlobalDailyLimit()
  if (!globalLimit.allowed) return

  const db = createDb()
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user[0]?.email) return

  const locale = user[0].locale || "en"
  const template = premiumActivatedTemplate(user[0].name || user[0].username || "User", locale)

  await sendEmail({
    to: user[0].email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    emailType: "notif_premium",
  })
}

export async function sendPremiumExpiringNotification(userId: string, expiryDate: Date) {
  const rateLimit = await checkRateLimit(userId, "notif_premium_expiring", 1, 24 * 60 * 60 * 1000) // 1 per day
  if (!rateLimit.allowed) return

  const globalLimit = await checkGlobalDailyLimit()
  if (!globalLimit.allowed) return

  const db = createDb()
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user[0]?.email) return

  const locale = user[0].locale || "en"
  const baseUrl = await getBaseUrl()
  const renewUrl = `${baseUrl}/pricing`
  const template = premiumExpiringTemplate(user[0].name || user[0].username || "User", expiryDate, renewUrl, locale)

  await sendEmail({
    to: user[0].email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    emailType: "notif_premium_expiring",
  })
}

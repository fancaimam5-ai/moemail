import { requireAdmin, logAdminAction } from "@/lib/admin"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { EMAIL_CONFIG } from "@/config"
import { ROLES } from "@/lib/permissions"

function normalizeConfigValue(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback
  const normalized = value.trim()
  if (!normalized || normalized === "undefined" || normalized === "null") {
    return fallback
  }
  return normalized
}

export async function GET() {
  const { error, status } = await requireAdmin()
  if (error) return Response.json({ error }, { status })

  const env = getCloudflareContext().env

  const [
    defaultRole,
    emailDomains,
    adminContact,
    maxEmails,
    turnstileEnabled,
    turnstileSiteKey,
    turnstileSecretKey,
    allowedEmailDomains,
    siteUrl,
    emailEncryptionKey,
    dokuClientId,
    dokuSecretKey,
    freeDomains,
    cronSecret,
  ] = await Promise.all([
    env.SITE_CONFIG.get("DEFAULT_ROLE"),
    env.SITE_CONFIG.get("EMAIL_DOMAINS"),
    env.SITE_CONFIG.get("ADMIN_CONTACT"),
    env.SITE_CONFIG.get("MAX_EMAILS"),
    env.SITE_CONFIG.get("TURNSTILE_ENABLED"),
    env.SITE_CONFIG.get("TURNSTILE_SITE_KEY"),
    env.SITE_CONFIG.get("TURNSTILE_SECRET_KEY"),
    env.SITE_CONFIG.get("ALLOWED_EMAIL_DOMAINS"),
    env.SITE_CONFIG.get("SITE_URL"),
    env.SITE_CONFIG.get("EMAIL_ENCRYPTION_KEY"),
    env.SITE_CONFIG.get("DOKU_CLIENT_ID"),
    env.SITE_CONFIG.get("DOKU_SECRET_KEY"),
    env.SITE_CONFIG.get("FREE_DOMAINS"),
    env.SITE_CONFIG.get("CRON_SECRET"),
  ])

  return Response.json({
    defaultRole: normalizeConfigValue(defaultRole, ROLES.CIVILIAN),
    emailDomains: normalizeConfigValue(emailDomains, "ifmail.email"),
    adminContact: normalizeConfigValue(adminContact, ""),
    maxEmails: normalizeConfigValue(maxEmails, String(EMAIL_CONFIG.MAX_ACTIVE_EMAILS)),
    turnstile: {
      enabled: turnstileEnabled === "true",
      siteKey: normalizeConfigValue(turnstileSiteKey, ""),
      hasSecretKey: !!turnstileSecretKey,
    },
    allowedEmailDomains: normalizeConfigValue(allowedEmailDomains, ""),
    siteUrl: normalizeConfigValue(siteUrl, ""),
    hasEncryptionKey: !!emailEncryptionKey,
    doku: {
      clientId: normalizeConfigValue(dokuClientId, ""),
      hasSecretKey: !!dokuSecretKey,
    },
    freeDomains: normalizeConfigValue(freeDomains, ""),
    hasCronSecret: !!cronSecret,
  })
}

export async function POST(request: Request) {
  const { error, status, userId: adminId } = await requireAdmin()
  if (error) return Response.json({ error }, { status })

  const body = await request.json() as {
    defaultRole: string
    emailDomains: string
    adminContact: string
    maxEmails: string
    turnstile?: { enabled: boolean; siteKey: string; secretKey?: string }
    allowedEmailDomains?: string
    siteUrl?: string
    emailEncryptionKey?: string
    doku?: { clientId: string; secretKey?: string }
    freeDomains?: string
    cronSecret?: string
  }

  if (![ROLES.DUKE, ROLES.KNIGHT, ROLES.CIVILIAN].includes(body.defaultRole as typeof ROLES.DUKE)) {
    return Response.json({ error: "Invalid role" }, { status: 400 })
  }

  const turnstile = body.turnstile ?? { enabled: false, siteKey: "", secretKey: undefined }
  if (turnstile.enabled && !turnstile.siteKey) {
    return Response.json({ error: "Turnstile requires a Site Key" }, { status: 400 })
  }

  const env = getCloudflareContext().env
  const safeEmailDomains = normalizeConfigValue(body.emailDomains, "ifmail.email")
  const safeAdminContact = normalizeConfigValue(body.adminContact, "")
  const safeMaxEmails = normalizeConfigValue(body.maxEmails, String(EMAIL_CONFIG.MAX_ACTIVE_EMAILS))

  const puts: Promise<void>[] = [
    env.SITE_CONFIG.put("DEFAULT_ROLE", body.defaultRole),
    env.SITE_CONFIG.put("EMAIL_DOMAINS", safeEmailDomains),
    env.SITE_CONFIG.put("ADMIN_CONTACT", safeAdminContact),
    env.SITE_CONFIG.put("MAX_EMAILS", safeMaxEmails),
    env.SITE_CONFIG.put("TURNSTILE_ENABLED", turnstile.enabled.toString()),
    env.SITE_CONFIG.put("TURNSTILE_SITE_KEY", normalizeConfigValue(turnstile.siteKey ?? "", "")),
  ]

  if (turnstile.secretKey) {
    puts.push(env.SITE_CONFIG.put("TURNSTILE_SECRET_KEY", normalizeConfigValue(turnstile.secretKey, "")))
  }

  if (body.allowedEmailDomains !== undefined) {
    // Validate JSON array format if non-empty
    if (body.allowedEmailDomains) {
      try {
        const parsed = JSON.parse(body.allowedEmailDomains)
        if (!Array.isArray(parsed)) throw new Error("Must be an array")
        puts.push(env.SITE_CONFIG.put("ALLOWED_EMAIL_DOMAINS", body.allowedEmailDomains))
      } catch {
        return Response.json({ error: "Allowed email domains must be a valid JSON array" }, { status: 400 })
      }
    } else {
      puts.push(env.SITE_CONFIG.delete("ALLOWED_EMAIL_DOMAINS") as unknown as Promise<void>)
    }
  }

  if (body.siteUrl !== undefined) {
    puts.push(env.SITE_CONFIG.put("SITE_URL", body.siteUrl))
  }

  if (body.doku) {
    puts.push(env.SITE_CONFIG.put("DOKU_CLIENT_ID", body.doku.clientId || ""))
    if (body.doku.secretKey) {
      puts.push(env.SITE_CONFIG.put("DOKU_SECRET_KEY", body.doku.secretKey))
    }
  }

  if (body.emailEncryptionKey) {
    if (body.emailEncryptionKey.length !== 64 || !/^[0-9a-f]+$/i.test(body.emailEncryptionKey)) {
      return Response.json({ error: "Encryption key must be 64 hex characters (32 bytes)" }, { status: 400 })
    }
    puts.push(env.SITE_CONFIG.put("EMAIL_ENCRYPTION_KEY", body.emailEncryptionKey))
  }

  if (body.freeDomains !== undefined) {
    puts.push(env.SITE_CONFIG.put("FREE_DOMAINS", body.freeDomains))
  }

  if (body.cronSecret) {
    puts.push(env.SITE_CONFIG.put("CRON_SECRET", body.cronSecret))
  }

  await Promise.all(puts)

  await logAdminAction(adminId!, "update_settings", "config", undefined, {
    defaultRole: body.defaultRole,
    emailDomains: body.emailDomains,
  })

  return Response.json({ success: true })
}

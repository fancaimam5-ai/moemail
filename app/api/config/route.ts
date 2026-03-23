import { PERMISSIONS, Role, ROLES } from "@/lib/permissions"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { EMAIL_CONFIG } from "@/config"
import { checkPermission } from "@/lib/auth"

function normalizeConfigValue(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback
  const normalized = value.trim()
  if (!normalized || normalized === "undefined" || normalized === "null") {
    return fallback
  }
  return normalized
}

export async function GET() {
  const env = getCloudflareContext().env
  const canManageConfig = await checkPermission(PERMISSIONS.MANAGE_CONFIG)

  const [
    defaultRole,
    emailDomains,
    adminContact,
    maxEmails,
    turnstileEnabled,
    turnstileSiteKey,
    turnstileSecretKey
  ] = await Promise.all([
    env.SITE_CONFIG.get("DEFAULT_ROLE"),
    env.SITE_CONFIG.get("EMAIL_DOMAINS"),
    env.SITE_CONFIG.get("ADMIN_CONTACT"),
    env.SITE_CONFIG.get("MAX_EMAILS"),
    env.SITE_CONFIG.get("TURNSTILE_ENABLED"),
    env.SITE_CONFIG.get("TURNSTILE_SITE_KEY"),
    env.SITE_CONFIG.get("TURNSTILE_SECRET_KEY")
  ])

  return Response.json({
    defaultRole: normalizeConfigValue(defaultRole, ROLES.CIVILIAN),
    emailDomains: normalizeConfigValue(emailDomains, "ifmail.email"),
    adminContact: normalizeConfigValue(adminContact, ""),
    maxEmails: normalizeConfigValue(maxEmails, EMAIL_CONFIG.MAX_ACTIVE_EMAILS.toString()),
    turnstile: canManageConfig ? {
      enabled: turnstileEnabled === "true",
      siteKey: normalizeConfigValue(turnstileSiteKey, ""),
      hasSecretKey: !!turnstileSecretKey,
    } : undefined
  })
}

export async function POST(request: Request) {
  const canAccess = await checkPermission(PERMISSIONS.MANAGE_CONFIG)

  if (!canAccess) {
    return Response.json({
      error: "Insufficient permissions"
    }, { status: 403 })
  }

  const {
    defaultRole,
    emailDomains,
    adminContact,
    maxEmails,
    turnstile
  } = await request.json() as { 
    defaultRole: Exclude<Role, typeof ROLES.EMPEROR>,
    emailDomains: string,
    adminContact: string,
    maxEmails: string,
    turnstile?: {
      enabled: boolean,
      siteKey: string,
      secretKey: string
    }
  }
  
  if (![ROLES.DUKE, ROLES.KNIGHT, ROLES.CIVILIAN].includes(defaultRole)) {
    return Response.json({ error: "Invalid role" }, { status: 400 })
  }

  const turnstileConfig = turnstile ?? {
    enabled: false,
    siteKey: "",
    secretKey: ""
  }

  if (turnstileConfig.enabled && (!turnstileConfig.siteKey || !turnstileConfig.secretKey)) {
    return Response.json({ error: "Turnstile requires both Site Key and Secret Key when enabled" }, { status: 400 })
  }

  const env = getCloudflareContext().env
  const safeEmailDomains = normalizeConfigValue(emailDomains, "ifmail.email")
  const safeAdminContact = normalizeConfigValue(adminContact, "")
  const safeMaxEmails = normalizeConfigValue(maxEmails, EMAIL_CONFIG.MAX_ACTIVE_EMAILS.toString())

  await Promise.all([
    env.SITE_CONFIG.put("DEFAULT_ROLE", defaultRole),
    env.SITE_CONFIG.put("EMAIL_DOMAINS", safeEmailDomains),
    env.SITE_CONFIG.put("ADMIN_CONTACT", safeAdminContact),
    env.SITE_CONFIG.put("MAX_EMAILS", safeMaxEmails),
    env.SITE_CONFIG.put("TURNSTILE_ENABLED", turnstileConfig.enabled.toString()),
    env.SITE_CONFIG.put("TURNSTILE_SITE_KEY", normalizeConfigValue(turnstileConfig.siteKey, "")),
    env.SITE_CONFIG.put("TURNSTILE_SECRET_KEY", normalizeConfigValue(turnstileConfig.secretKey, ""))
  ])

  return Response.json({ success: true })
} 

import { NextResponse } from "next/server"
import { nanoid } from "nanoid"
import { createDb } from "@/lib/db"
import { emails, users, userPlans } from "@/lib/schema"
import { eq, and, sql } from "drizzle-orm"
import { EXPIRY_OPTIONS } from "@/types/email"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { getUserId } from "@/lib/apiKey"
import { getUserRole } from "@/lib/auth"
import { ROLES } from "@/lib/permissions"
import { createEmailCredential } from "@/lib/credential"
import { sendQuotaNotification } from "@/lib/email/notifications"
import { FREE_DOMAINS } from "@/config"

const DEFAULT_FREE_LIMIT = 3

function parseLimitValue(value: string | null): number | null {
  if (!value) return null
  const normalized = value.trim()
  if (!normalized || normalized === "undefined" || normalized === "null") {
    return null
  }
  const parsed = Number(normalized)
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return parsed
}

function getConfiguredDomains(domainString: string | null): string[] {
  if (!domainString) return ["ifmail.email"]
  const normalized = domainString.trim()
  if (!normalized || normalized === "undefined" || normalized === "null") {
    return ["ifmail.email"]
  }
  return normalized.split(",").map(d => d.trim()).filter(Boolean)
}

export async function POST(request: Request) {
  const db = createDb()
  const env = getCloudflareContext().env

  const userId = await getUserId()
  const userRole = await getUserRole(userId!)

  try {
    // Determine max emails for this user based on plan
    let maxEmails = DEFAULT_FREE_LIMIT
    let maxExpiryHours = 72

    if (userRole === ROLES.EMPEROR || userRole === ROLES.KNIGHT) {
      maxEmails = Infinity
      maxExpiryHours = Infinity
    } else {
      // Check user plan
      const userPlan = await db.query.userPlans.findFirst({
        where: and(
          eq(userPlans.userId, userId!),
        ),
        with: { plan: true },
      })

      if (userPlan?.plan) {
        const plan = userPlan.plan
        // Check if plan hasn't expired
        if (!userPlan.expiresAt || userPlan.expiresAt > new Date()) {
          maxEmails = plan.maxEmails
          maxExpiryHours = plan.maxExpiryHours ?? 72
        }
      }

      // Also check KV override
      const kvLimit = parseLimitValue(await env.SITE_CONFIG.get("MAX_EMAILS"))
      if (kvLimit !== null) {
        maxEmails = Math.min(maxEmails, kvLimit)
      }

      // Check total lifetime email created count (not active count)
      const userRecord = await db.query.users.findFirst({
        where: eq(users.id, userId!),
        columns: { totalEmailsCreated: true },
      })

      const totalCreated = userRecord?.totalEmailsCreated ?? 0

      if (totalCreated >= maxEmails) {
        // Notify when user is blocked by limit (non-blocking, rate-limited to 1/day in sender)
        sendQuotaNotification(userId!, totalCreated, maxEmails).catch(e =>
          console.error("Failed to send quota notification on limit block:", e)
        )

        return NextResponse.json(
          {
            error: `Email creation limit reached (${totalCreated}/${maxEmails}). Upgrade your plan to create more.`,
            code: "EMAIL_LIMIT",
            limit: maxEmails,
            totalCreated,
          },
          { status: 403 }
        )
      }
    }

    const { name, expiryTime, domain } = await request.json<{
      name: string
      expiryTime: number
      domain: string
    }>()

    const RESERVED_NAMES = ["admin", "administrator", "noreply", "no-reply", "support", "help", "info", "contact", "abuse", "security", "webmaster", "postmaster", "hostmaster", "mailer-daemon", "root", "notification", "notifications", "newsletter"]
    if (name && RESERVED_NAMES.includes(name.toLowerCase())) {
      return NextResponse.json(
        { error: "This email name is reserved and cannot be used" },
        { status: 400 }
      )
    }

    if (name && (!/^[a-zA-Z0-9._-]+$/.test(name) || name.length > 30)) {
      return NextResponse.json(
        { error: "Invalid email name. Only letters, numbers, dots, hyphens, and underscores allowed (max 30 chars)" },
        { status: 400 }
      )
    }

    if (!EXPIRY_OPTIONS.some(option => option.value === expiryTime)) {
      return NextResponse.json(
        { error: "Invalid expiry time" },
        { status: 400 }
      )
    }

    // Validate expiry doesn't exceed plan max
    if (maxExpiryHours !== Infinity && expiryTime !== 0) {
      const maxMs = maxExpiryHours * 60 * 60 * 1000
      if (expiryTime > maxMs) {
        return NextResponse.json(
          { error: "Expiry time exceeds your plan limit" },
          { status: 400 }
        )
      }
    }

    // Block permanent emails for free (civilian) users
    if (expiryTime === 0 && userRole !== ROLES.EMPEROR && userRole !== ROLES.KNIGHT) {
      return NextResponse.json(
        { error: "Permanent emails require a premium plan" },
        { status: 403 }
      )
    }

    const domainString = await env.SITE_CONFIG.get("EMAIL_DOMAINS")
    const domains = getConfiguredDomains(domainString)

    if (!domains || !domains.includes(domain)) {
      return NextResponse.json(
        { error: "Invalid domain" },
        { status: 400 }
      )
    }

    // Free (Civilian) users can only use the 3 free domains
    if (userRole === ROLES.CIVILIAN && !FREE_DOMAINS.includes(domain)) {
      return NextResponse.json(
        { error: "This domain requires a Premium plan. Upgrade to access all domains." },
        { status: 403 }
      )
    }

    const address = `${name || nanoid(8)}@${domain}`
    const existingEmail = await db.query.emails.findFirst({
      where: eq(sql`LOWER(${emails.address})`, address.toLowerCase())
    })

    if (existingEmail) {
      return NextResponse.json(
        { error: "This email address is already taken" },
        { status: 409 }
      )
    }

    const now = new Date()
    const expires = expiryTime === 0
      ? new Date('9999-01-01T00:00:00.000Z')
      : new Date(now.getTime() + expiryTime)

    const emailData: typeof emails.$inferInsert = {
      address,
      createdAt: now,
      expiresAt: expires,
      userId: userId!
    }

    // Use batch to atomically insert email + increment counter
    const batchResults = await db.batch([
      db.insert(emails)
        .values(emailData)
        .returning({ id: emails.id, address: emails.address }),
      db.update(users)
        .set({ totalEmailsCreated: sql`${users.totalEmailsCreated} + 1` })
        .where(eq(users.id, userId!)),
    ])

    const result = batchResults[0]

    // Create credential for auto-login access
    let credential: string
    try {
      credential = await createEmailCredential(result[0].id)
    } catch (credError) {
      // Rollback: delete the email and decrement counter
      await db.batch([
        db.delete(emails).where(eq(emails.id, result[0].id)),
        db.update(users)
          .set({ totalEmailsCreated: sql`CASE WHEN ${users.totalEmailsCreated} > 0 THEN ${users.totalEmailsCreated} - 1 ELSE 0 END` })
          .where(eq(users.id, userId!)),
      ])
      throw credError
    }

    // Send quota notification (non-blocking)
    if (userRole !== ROLES.EMPEROR) {
      try {
        const userRecord = await db.query.users.findFirst({
          where: eq(users.id, userId!),
          columns: { totalEmailsCreated: true },
        })
        const newTotal = userRecord?.totalEmailsCreated ?? 1
        // Notify at 80% usage or when limit is reached
        if (newTotal >= maxEmails || (maxEmails > 1 && newTotal >= Math.ceil(maxEmails * 0.8))) {
          sendQuotaNotification(userId!, newTotal, maxEmails).catch(e =>
            console.error("Failed to send quota notification:", e)
          )
        }
      } catch {
        // Don't fail the request for notification errors
      }
    }

    return NextResponse.json({
      id: result[0].id,
      email: result[0].address,
      credential,
    })
  } catch (error) {
    console.error('Failed to generate email:', error)
    return NextResponse.json(
      { error: "Failed to create email" },
      { status: 500 }
    )
  }
}
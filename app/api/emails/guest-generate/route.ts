import { NextResponse } from "next/server"
import { nanoid } from "nanoid"
import { createDb } from "@/lib/db"
import { emails } from "@/lib/schema"
import { eq, sql } from "drizzle-orm"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { verifyTurnstileToken } from "@/lib/turnstile"
import { createEmailCredential } from "@/lib/credential"
import {
  hashForStorage,
  getClientIp,
  checkGuestLimit,
  createGuestSession,
  GUEST_EMAIL_EXPIRY_MS,
} from "@/lib/guest"
import { FREE_DOMAINS } from "@/config"

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

  try {
    const body = await request.json<{
      name?: string
      domain?: string
      turnstileToken?: string
      fingerprint?: string
    }>()

    // 1. Verify Turnstile CAPTCHA
    const turnstileResult = await verifyTurnstileToken(body.turnstileToken)
    if (!turnstileResult.success) {
      return NextResponse.json(
        { error: "CAPTCHA verification failed" },
        { status: 403 }
      )
    }

    // 2. Anti-abuse: hash IP and fingerprint
    const ip = getClientIp(request)
    const ipHash = await hashForStorage(ip)
    const fingerprintHash = body.fingerprint
      ? await hashForStorage(body.fingerprint)
      : undefined

    // 3. Check guest limit
    const guestCheck = await checkGuestLimit(ipHash, fingerprintHash)
    if (!guestCheck.allowed) {
      return NextResponse.json(
        {
          error: "Guest email limit reached. Please sign up to create more emails.",
          code: "GUEST_LIMIT",
        },
        { status: 429 }
      )
    }

    // 4. Validate domain (guest users restricted to FREE_DOMAINS)
    const domainString = await env.SITE_CONFIG.get("EMAIL_DOMAINS")
    const allDomains = getConfiguredDomains(domainString)
    const freeDomains = allDomains.filter(d => FREE_DOMAINS.includes(d))
    const domains = freeDomains.length > 0 ? freeDomains : allDomains
    const domain = body.domain && domains.includes(body.domain) ? body.domain : domains[0]

    // 5. Generate email address
    const name = body.name?.trim() || nanoid(8)
    if (!/^[a-zA-Z0-9._-]+$/.test(name) || name.length > 30) {
      return NextResponse.json(
        { error: "Invalid email name" },
        { status: 400 }
      )
    }

    const RESERVED_NAMES = ["admin", "administrator", "noreply", "no-reply", "support", "help", "info", "contact", "abuse", "security", "webmaster", "postmaster", "hostmaster", "mailer-daemon", "root", "notification", "notifications", "newsletter"]
    if (body.name?.trim() && RESERVED_NAMES.includes(name.toLowerCase())) {
      return NextResponse.json(
        { error: "This email name is reserved and cannot be used" },
        { status: 400 }
      )
    }

    const address = `${name}@${domain}`

    // 6. Check uniqueness
    const existing = await db.query.emails.findFirst({
      where: eq(sql`LOWER(${emails.address})`, address.toLowerCase()),
    })
    if (existing) {
      return NextResponse.json(
        { error: "This email address is already taken" },
        { status: 409 }
      )
    }

    // 7. Create email (3 day expiry, no userId)
    const now = new Date()
    const expiresAt = new Date(now.getTime() + GUEST_EMAIL_EXPIRY_MS)

    const result = await db
      .insert(emails)
      .values({
        address,
        userId: null,
        createdAt: now,
        expiresAt,
      })
      .returning({ id: emails.id, address: emails.address })

    const emailId = result[0].id

    // 8. Create guest session
    const guestSessionId = await createGuestSession(ipHash, emailId, fingerprintHash)

    // 9. Update email with guest session ID
    await db
      .update(emails)
      .set({ guestSessionId })
      .where(eq(emails.id, emailId))

    // 10. Create credential
    const credential = await createEmailCredential(emailId)

    return NextResponse.json({
      id: emailId,
      email: result[0].address,
      credential,
      expiresAt: expiresAt.toISOString(),
      guestSessionId,
    })
  } catch (error) {
    console.error("Failed to generate guest email:", error)
    return NextResponse.json(
      { error: "Failed to create email" },
      { status: 500 }
    )
  }
}

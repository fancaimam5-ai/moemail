import { createDb } from "./db"
import { guestSessions } from "./schema"
import { eq, and, gt } from "drizzle-orm"

const GUEST_EMAIL_EXPIRY_MS = 3 * 24 * 60 * 60 * 1000 // 3 days

export async function hashForStorage(value: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = process.env.AUTH_SECRET || "guest-salt"
  const data = encoder.encode(value + salt)
  const hash = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Real-IP") ||
    "unknown"
  )
}

interface GuestCheckResult {
  allowed: boolean
  reason?: "ip_limit" | "fingerprint_limit"
  existingSessionId?: string
}

export async function checkGuestLimit(
  ipHash: string,
  fingerprintHash?: string
): Promise<GuestCheckResult> {
  const db = createDb()
  const now = new Date()

  // Check by IP hash — any non-expired guest session
  const ipSession = await db.query.guestSessions.findFirst({
    where: and(
      eq(guestSessions.ipHash, ipHash),
      gt(guestSessions.expiresAt, now)
    ),
  })

  if (ipSession) {
    return { allowed: false, reason: "ip_limit", existingSessionId: ipSession.id }
  }

  // Check by fingerprint hash if provided
  if (fingerprintHash) {
    const fpSession = await db.query.guestSessions.findFirst({
      where: and(
        eq(guestSessions.fingerprintHash, fingerprintHash),
        gt(guestSessions.expiresAt, now)
      ),
    })

    if (fpSession) {
      return { allowed: false, reason: "fingerprint_limit", existingSessionId: fpSession.id }
    }
  }

  return { allowed: true }
}

export async function createGuestSession(
  ipHash: string,
  emailId: string,
  fingerprintHash?: string
): Promise<string> {
  const db = createDb()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + GUEST_EMAIL_EXPIRY_MS)

  const result = await db
    .insert(guestSessions)
    .values({
      ipHash,
      fingerprintHash: fingerprintHash || null,
      emailId,
      createdAt: now,
      expiresAt,
    })
    .returning({ id: guestSessions.id })

  return result[0].id
}

export { GUEST_EMAIL_EXPIRY_MS }

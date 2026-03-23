import { createDb } from "@/lib/db"
import { emailShares, emails } from "@/lib/schema"
import { eq, and, sql } from "drizzle-orm"
import { NextResponse } from "next/server"
import { getUserId } from "@/lib/apiKey"
import { nanoid } from "nanoid"

const MAX_SHARES_PER_EMAIL = 20
const MAX_EXPIRES_IN_MS = 90 * 24 * 60 * 60 * 1000 // 90 days

// Get all share links for an email
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: emailId } = await params
  const db = createDb()

  try {
    const email = await db.query.emails.findFirst({
      where: and(eq(emails.id, emailId), eq(emails.userId, userId))
    })

    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 })
    }

    const shares = await db.query.emailShares.findMany({
      where: eq(emailShares.emailId, emailId),
      orderBy: (emailShares, { desc }) => [desc(emailShares.createdAt)]
    })

    return NextResponse.json({ shares, total: shares.length })
  } catch (error) {
    console.error("Failed to fetch email shares:", error)
    return NextResponse.json(
      { error: "Failed to fetch shares" },
      { status: 500 }
    )
  }
}

// Create a new share link
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: emailId } = await params
  const db = createDb()

  try {
    const email = await db.query.emails.findFirst({
      where: and(eq(emails.id, emailId), eq(emails.userId, userId))
    })

    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 })
    }

    // Enforce per-email share cap
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailShares)
      .where(eq(emailShares.emailId, emailId))
    if (Number(count) >= MAX_SHARES_PER_EMAIL) {
      return NextResponse.json(
        { error: `Maximum ${MAX_SHARES_PER_EMAIL} share links per email` },
        { status: 400 }
      )
    }

    const body = await request.json() as { expiresIn: number }
    const { expiresIn } = body // ms; 0 = permanent

    if (expiresIn && (expiresIn < 0 || expiresIn > MAX_EXPIRES_IN_MS)) {
      return NextResponse.json(
        { error: "Maximum expiry is 90 days" },
        { status: 400 }
      )
    }

    const token = nanoid(16)
    const expiresAt = expiresIn && expiresIn > 0 ? new Date(Date.now() + expiresIn) : null

    const [share] = await db.insert(emailShares).values({
      emailId,
      token,
      expiresAt
    }).returning()

    return NextResponse.json(share, { status: 201 })
  } catch (error) {
    console.error("Failed to create email share:", error)
    return NextResponse.json(
      { error: "Failed to create share" },
      { status: 500 }
    )
  }
}



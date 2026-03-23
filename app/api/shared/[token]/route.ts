import { createDb } from "@/lib/db"
import { emailShares } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"

// Get email info via share token
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 })
  }
  const db = createDb()

  try {
    // Find share record
    const share = await db.query.emailShares.findFirst({
      where: eq(emailShares.token, token),
      with: {
        email: true
      }
    })

    if (!share) {
      return NextResponse.json(
        { error: "Share link not found or expired" },
        { status: 404 }
      )
    }

    // Check if share link has expired
    if (share.expiresAt && share.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Share link has expired" },
        { status: 410 }
      )
    }

    // Check if email has expired
    if (share.email.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Email has expired" },
        { status: 410 }
      )
    }

    return NextResponse.json({
      email: {
        id: share.email.id,
        address: share.email.address,
        createdAt: share.email.createdAt,
        expiresAt: share.email.expiresAt
      }
    })
  } catch (error) {
    console.error("Failed to fetch shared email:", error)
    return NextResponse.json(
      { error: "Failed to fetch shared email" },
      { status: 500 }
    )
  }
}


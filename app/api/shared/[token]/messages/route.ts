import { createDb } from "@/lib/db"
import { emailShares, messages } from "@/lib/schema"
import { eq, and, lt, or, sql, ne, isNull } from "drizzle-orm"
import { NextResponse } from "next/server"
import { encodeCursor, decodeCursor } from "@/lib/cursor"

const PAGE_SIZE = 20

// Get message list for shared email via token
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const db = createDb()
  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get('cursor')

  try {
    // Validate share token
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

    const emailId = share.email.id

    // Only show received messages, exclude sent messages
    const baseConditions = and(
      eq(messages.emailId, emailId),
      or(
        ne(messages.type, "sent"),
        isNull(messages.type)
      )
    )

    // Get total message count (received only)
    const totalResult = await db.select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(baseConditions)
    const totalCount = Number(totalResult[0].count)

    const conditions = [baseConditions]

    if (cursor) {
      const { timestamp, id } = decodeCursor(cursor)
      const cursorCondition = or(
        lt(messages.receivedAt, new Date(timestamp)),
        and(
          eq(messages.receivedAt, new Date(timestamp)),
          lt(messages.id, id)
        )
      )
      if (cursorCondition) {
        conditions.push(cursorCondition)
      }
    }

    const results = await db.query.messages.findMany({
      where: and(...conditions),
      orderBy: (messages, { desc }) => [
        desc(messages.receivedAt),
        desc(messages.id)
      ],
      limit: PAGE_SIZE + 1
    })

    const hasMore = results.length > PAGE_SIZE
    const nextCursor = hasMore
      ? encodeCursor(
          results[PAGE_SIZE - 1].receivedAt.getTime(),
          results[PAGE_SIZE - 1].id
        )
      : null
    const messageList = hasMore ? results.slice(0, PAGE_SIZE) : results

    return NextResponse.json({
      messages: messageList.map(msg => ({
        id: msg.id,
        from_address: msg.fromAddress,
        to_address: msg.toAddress,
        subject: msg.subject,
        received_at: msg.receivedAt,
        sent_at: msg.sentAt
      })),
      nextCursor,
      total: totalCount
    })
  } catch (error) {
    console.error("Failed to fetch shared messages:", error)
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    )
  }
}


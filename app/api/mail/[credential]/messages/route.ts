import { createDb } from "@/lib/db"
import { messages, emails } from "@/lib/schema"
import { eq, and, lt, or, sql, ne, isNull } from "drizzle-orm"
import { NextResponse } from "next/server"
import { verifyCredential } from "@/lib/credential"
import { encodeCursor, decodeCursor } from "@/lib/cursor"

const PAGE_SIZE = 20

export async function GET(
  request: Request,
  { params }: { params: Promise<{ credential: string }> }
) {
  const { credential } = await params
  const db = createDb()
  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get("cursor")

  const emailId = await verifyCredential(credential)
  if (!emailId) {
    return NextResponse.json({ error: "Invalid credential" }, { status: 404 })
  }

  const email = await db.query.emails.findFirst({
    where: eq(emails.id, emailId),
  })

  if (!email || email.expiresAt < new Date()) {
    return NextResponse.json({ error: "Email expired" }, { status: 410 })
  }

  try {
    const baseConditions = and(
      eq(messages.emailId, emailId),
      or(ne(messages.type, "sent"), isNull(messages.type))
    )

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
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
        desc(messages.id),
      ],
      limit: PAGE_SIZE + 1,
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
      messages: messageList.map((msg) => ({
        id: msg.id,
        from_address: msg.fromAddress,
        to_address: msg.toAddress,
        subject: msg.subject,
        received_at: msg.receivedAt,
        sent_at: msg.sentAt,
      })),
      nextCursor,
      total: totalCount,
    })
  } catch (error) {
    console.error("Failed to fetch credential messages:", error)
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    )
  }
}

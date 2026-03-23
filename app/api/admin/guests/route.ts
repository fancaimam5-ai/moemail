import { createDb } from "@/lib/db"
import { guestSessions, emails, messages } from "@/lib/schema"
import { requireAdmin, logAdminAction } from "@/lib/admin"
import { eq, desc, sql, count } from "drizzle-orm"

export async function GET(request: Request) {
  const { error, status } = await requireAdmin()
  if (error) return Response.json({ error }, { status })

  const url = new URL(request.url)
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"))
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20")))
  const offset = (page - 1) * limit

  const db = createDb()

  const [totalResult] = await db.select({ count: count() }).from(guestSessions)

  const sessions = await db
    .select({
      id: guestSessions.id,
      ipHash: guestSessions.ipHash,
      emailId: guestSessions.emailId,
      createdAt: guestSessions.createdAt,
      expiresAt: guestSessions.expiresAt,
      emailAddress: sql<string | null>`(SELECT address FROM email WHERE id = ${guestSessions.emailId})`,
      emailCount: sql<number>`(SELECT COUNT(*) FROM email WHERE guest_session_id = ${guestSessions.id})`,
    })
    .from(guestSessions)
    .orderBy(desc(guestSessions.createdAt))
    .limit(limit)
    .offset(offset)

  return Response.json({
    sessions,
    total: totalResult.count,
    page,
    limit,
    totalPages: Math.ceil(totalResult.count / limit),
  })
}

export async function DELETE(request: Request) {
  const { error, status, userId: adminId } = await requireAdmin()
  if (error) return Response.json({ error }, { status })

  const url = new URL(request.url)
  const sessionId = url.searchParams.get("id")
  if (!sessionId) return Response.json({ error: "Missing session id" }, { status: 400 })

  const db = createDb()

  const session = await db.query.guestSessions.findFirst({
    where: eq(guestSessions.id, sessionId),
  })
  if (!session) return Response.json({ error: "Session not found" }, { status: 404 })

  // Delete associated emails and messages
  const guestEmails = await db.select({ id: emails.id }).from(emails).where(eq(emails.guestSessionId, sessionId))
  for (const email of guestEmails) {
    await db.delete(messages).where(eq(messages.emailId, email.id))
    await db.delete(emails).where(eq(emails.id, email.id))
  }

  await db.delete(guestSessions).where(eq(guestSessions.id, sessionId))

  await logAdminAction(adminId!, "delete_guest_session", "guest_session", sessionId, {
    emailCount: String(guestEmails.length),
  })

  return Response.json({ success: true })
}

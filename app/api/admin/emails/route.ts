import { createDb } from "@/lib/db"
import { emails, messages } from "@/lib/schema"
import { requireAdmin, logAdminAction } from "@/lib/admin"
import { eq, desc, like, sql, count, and, lt, gt, or } from "drizzle-orm"

export async function GET(request: Request) {
  const { error, status } = await requireAdmin()
  if (error) return Response.json({ error }, { status })

  const url = new URL(request.url)
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"))
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20")))
  const search = url.searchParams.get("search") || ""
  const filterDomain = url.searchParams.get("domain") || ""
  const filterStatus = url.searchParams.get("status") || ""
  const offset = (page - 1) * limit

  const db = createDb()

  const parts: ReturnType<typeof like>[] = []
  if (search) parts.push(like(emails.address, `%${search}%`))
  if (filterDomain) parts.push(like(emails.address, `%@${filterDomain}`))
  if (filterStatus === "expired") parts.push(lt(emails.expiresAt, new Date()))
  if (filterStatus === "active") parts.push(or(gt(emails.expiresAt, new Date())) as ReturnType<typeof gt>)
  const conditions = parts.length > 0 ? and(...parts) : undefined

  const [totalResult] = await db.select({ count: count() }).from(emails).where(conditions)

  const emailList = await db
    .select({
      id: emails.id,
      address: emails.address,
      userId: emails.userId,
      guestSessionId: emails.guestSessionId,
      createdAt: emails.createdAt,
      expiresAt: emails.expiresAt,
      messageCount: sql<number>`(SELECT COUNT(*) FROM message WHERE "emailId" = ${emails.id})`,
    })
    .from(emails)
    .where(conditions)
    .orderBy(desc(emails.createdAt))
    .limit(limit)
    .offset(offset)

  return Response.json({
    emails: emailList,
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
  const emailId = url.searchParams.get("id")
  if (!emailId) {
    return Response.json({ error: "Missing email id" }, { status: 400 })
  }

  const db = createDb()

  const email = await db.query.emails.findFirst({
    where: eq(emails.id, emailId),
  })
  if (!email) {
    return Response.json({ error: "Email not found" }, { status: 404 })
  }

  // Delete messages first, then email
  await db.delete(messages).where(eq(messages.emailId, emailId))
  await db.delete(emails).where(eq(emails.id, emailId))

  await logAdminAction(adminId!, "delete_email", "email", emailId, { address: email.address })

  return Response.json({ success: true })
}

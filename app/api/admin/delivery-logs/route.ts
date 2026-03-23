import { createDb } from "@/lib/db"
import { emailDeliveryLogs } from "@/lib/schema"
import { requireAdmin } from "@/lib/admin"
import { desc, eq, like, and, count } from "drizzle-orm"

export async function GET(request: Request) {
  const { error, status } = await requireAdmin()
  if (error) return Response.json({ error }, { status })

  const url = new URL(request.url)
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"))
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20")))
  const filterType = url.searchParams.get("type") || ""
  const filterStatus = url.searchParams.get("status") || ""
  const search = url.searchParams.get("search") || ""
  const offset = (page - 1) * limit

  const db = createDb()

  const conditions = []
  if (filterType) conditions.push(eq(emailDeliveryLogs.emailType, filterType))
  if (filterStatus) conditions.push(eq(emailDeliveryLogs.status, filterStatus))
  if (search) conditions.push(like(emailDeliveryLogs.toAddress, `%${search}%`))

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [totalResult] = await db.select({ count: count() }).from(emailDeliveryLogs).where(where)

  const logs = await db
    .select()
    .from(emailDeliveryLogs)
    .where(where)
    .orderBy(desc(emailDeliveryLogs.createdAt))
    .limit(limit)
    .offset(offset)

  return Response.json({
    logs,
    total: totalResult.count,
    page,
    limit,
    totalPages: Math.ceil(totalResult.count / limit),
  })
}

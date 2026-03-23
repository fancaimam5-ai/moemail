import { createDb } from "@/lib/db"
import { adminActivityLog } from "@/lib/schema"
import { requireAdmin } from "@/lib/admin"
import { desc, sql, count, eq } from "drizzle-orm"

export async function GET(request: Request) {
  const { error, status } = await requireAdmin()
  if (error) return Response.json({ error }, { status })

  const url = new URL(request.url)
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"))
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50")))
  const filterAction = url.searchParams.get("action") || ""
  const offset = (page - 1) * limit

  const db = createDb()

  const conditions = filterAction ? eq(adminActivityLog.action, filterAction) : undefined

  const [totalResult] = await db.select({ count: count() }).from(adminActivityLog).where(conditions)

  const activities = await db
    .select({
      id: adminActivityLog.id,
      adminId: adminActivityLog.adminId,
      action: adminActivityLog.action,
      targetType: adminActivityLog.targetType,
      targetId: adminActivityLog.targetId,
      detail: adminActivityLog.detail,
      createdAt: adminActivityLog.createdAt,
      adminName: sql<string>`(SELECT username FROM user WHERE id = ${adminActivityLog.adminId})`,
    })
    .from(adminActivityLog)
    .where(conditions)
    .orderBy(desc(adminActivityLog.createdAt))
    .limit(limit)
    .offset(offset)

  return Response.json({
    activities: activities.map(a => ({
      ...a,
      detail: a.detail ? JSON.parse(a.detail) : null,
    })),
    total: totalResult.count,
    page,
    limit,
    totalPages: Math.ceil(totalResult.count / limit),
  })
}

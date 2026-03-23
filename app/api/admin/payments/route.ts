import { requireAdmin } from "@/lib/admin"
import { createDb } from "@/lib/db"
import { payments, users } from "@/lib/schema"
import { desc, and, eq, like, or, count } from "drizzle-orm"

export async function GET(request: Request) {
  const { error, status } = await requireAdmin()
  if (error) return Response.json({ error }, { status })

  const url = new URL(request.url)
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"))
  const limit = 20
  const filterStatus = url.searchParams.get("status") || ""
  const search = url.searchParams.get("search") || ""
  const offset = (page - 1) * limit

  const db = createDb()

  const conditions = []
  if (filterStatus) conditions.push(eq(payments.status, filterStatus))
  if (search) {
    // Search by invoice number or user email
    const matchingUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(or(
        like(users.email, `%${search}%`),
        like(users.username, `%${search}%`),
      ))
    if (matchingUsers.length > 0) {
      const { inArray } = await import("drizzle-orm")
      conditions.push(or(
        like(payments.invoiceNumber, `%${search}%`),
        inArray(payments.userId, matchingUsers.map(u => u.id)),
      ))
    } else {
      conditions.push(like(payments.invoiceNumber, `%${search}%`))
    }
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [totalResult] = await db.select({ count: count() }).from(payments).where(where)

  const results = await db.query.payments.findMany({
    where,
    with: { plan: true, user: true },
    orderBy: [desc(payments.createdAt)],
    limit,
    offset,
  })

  return Response.json({
    payments: results.map(p => ({
      id: p.id,
      invoiceNumber: p.invoiceNumber,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      paymentMethod: p.paymentMethod,
      planName: p.plan?.name || "-",
      userId: p.userId,
      userName: p.user?.name || p.user?.username || "-",
      userEmail: p.user?.email || "-",
      createdAt: p.createdAt,
      paidAt: p.paidAt,
    })),
    total: totalResult.count,
    page,
    totalPages: Math.ceil(totalResult.count / limit),
  })
}

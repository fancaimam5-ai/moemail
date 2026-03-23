import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createDb } from "@/lib/db"
import { payments } from "@/lib/schema"
import { eq, desc, count } from "drizzle-orm"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(request.url)
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"))
  const limit = 10
  const offset = (page - 1) * limit

  const db = createDb()

  const [totalResult] = await db
    .select({ count: count() })
    .from(payments)
    .where(eq(payments.userId, session.user.id))

  const userPayments = await db.query.payments.findMany({
    where: eq(payments.userId, session.user.id),
    with: { plan: true },
    orderBy: [desc(payments.createdAt)],
    limit,
    offset,
  })

  return NextResponse.json({
    payments: userPayments.map(p => ({
      id: p.id,
      invoiceNumber: p.invoiceNumber,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      paymentMethod: p.paymentMethod,
      planName: p.plan?.name || "-",
      createdAt: p.createdAt,
      paidAt: p.paidAt,
    })),
    total: totalResult.count,
    page,
    totalPages: Math.ceil(totalResult.count / limit),
  })
}

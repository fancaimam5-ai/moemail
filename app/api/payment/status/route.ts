import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createDb } from "@/lib/db"
import { payments } from "@/lib/schema"
import { eq, and } from "drizzle-orm"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(request.url)
  const invoiceNumber = url.searchParams.get("invoice")

  if (!invoiceNumber) {
    return NextResponse.json({ error: "Missing invoice" }, { status: 400 })
  }

  const db = createDb()
  const payment = await db.query.payments.findFirst({
    where: and(
      eq(payments.invoiceNumber, invoiceNumber),
      eq(payments.userId, session.user.id),
    ),
    with: { plan: true },
  })

  if (!payment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({
    id: payment.id,
    invoiceNumber: payment.invoiceNumber,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    paymentMethod: payment.paymentMethod,
    paymentUrl: payment.paymentUrl,
    planName: payment.plan?.name,
    createdAt: payment.createdAt,
    paidAt: payment.paidAt,
    expiresAt: payment.expiresAt,
  })
}

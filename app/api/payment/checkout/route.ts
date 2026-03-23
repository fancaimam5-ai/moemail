import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createDb } from "@/lib/db"
import { plans, payments, users, userPlans } from "@/lib/schema"
import { eq, and } from "drizzle-orm"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { createDokuCheckout } from "@/lib/doku"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const env = getCloudflareContext().env
  const dokuClientId = await env.SITE_CONFIG.get("DOKU_CLIENT_ID")
  const dokuSecretKey = await env.SITE_CONFIG.get("DOKU_SECRET_KEY")
  const siteUrl = await env.SITE_CONFIG.get("SITE_URL") || ""

  if (!dokuClientId || !dokuSecretKey) {
    return NextResponse.json(
      { error: "Payment gateway not configured" },
      { status: 503 },
    )
  }

  try {
    const { planId } = (await request.json()) as { planId: string }
    if (!planId) {
      return NextResponse.json({ error: "Missing planId" }, { status: 400 })
    }

    const db = createDb()

    // Get plan details
    const plan = await db.query.plans.findFirst({
      where: eq(plans.id, planId),
    })
    if (!plan || !plan.priceCents || plan.priceCents <= 0) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    // Check if user already has active premium
    const existingPlan = await db.query.userPlans.findFirst({
      where: eq(userPlans.userId, session.user.id),
      with: { plan: true },
    })
    if (existingPlan?.plan && (existingPlan.plan.priceCents ?? 0) > 0) {
      // Check if plan is still active
      if (!existingPlan.expiresAt || existingPlan.expiresAt > new Date()) {
        return NextResponse.json(
          { error: "You already have an active Premium plan" },
          { status: 409 },
        )
      }
    }

    // Check for pending payments
    const pendingPayment = await db.query.payments.findFirst({
      where: and(
        eq(payments.userId, session.user.id),
        eq(payments.status, "PENDING"),
      ),
    })
    if (pendingPayment && pendingPayment.expiresAt && pendingPayment.expiresAt > new Date()) {
      return NextResponse.json({
        paymentId: pendingPayment.id,
        invoiceNumber: pendingPayment.invoiceNumber,
        paymentUrl: pendingPayment.paymentUrl,
        expiresAt: pendingPayment.expiresAt.toISOString(),
        existing: true,
      })
    }

    // Get user info
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`

    // Determine currency and amount
    const isIDR = plan.name.includes("_idr")
    const currency = isIDR ? "IDR" : "USD"
    // For IDR priceCents is already in Rupiah, for USD it's in cents
    const amount = isIDR ? plan.priceCents : plan.priceCents

    // Create DOKU checkout
    const planLabel = plan.name.includes("knight") ? "Premium" : plan.name
    const dokuResponse = await createDokuCheckout(dokuClientId, dokuSecretKey, {
      orderId: invoiceNumber,
      amount,
      currency,
      customerName: user.name || user.username || "User",
      customerEmail: user.email || "",
      itemName: `IfMail ${planLabel} Plan`,
      expiryMinutes: 60,
    }, siteUrl ? `${siteUrl}/checkout?invoice=${invoiceNumber}` : undefined)

    // Save payment record
    const [payment] = await db
      .insert(payments)
      .values({
        userId: session.user.id,
        planId,
        invoiceNumber,
        amount,
        currency,
        status: "PENDING",
        paymentUrl: dokuResponse.response.payment.url,
        dokuRequestId: dokuResponse.response.uuid,
        expiresAt: new Date(dokuResponse.response.payment.expired_date),
      })
      .returning()

    return NextResponse.json({
      paymentId: payment.id,
      invoiceNumber,
      paymentUrl: dokuResponse.response.payment.url,
      expiresAt: dokuResponse.response.payment.expired_date,
    })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 },
    )
  }
}

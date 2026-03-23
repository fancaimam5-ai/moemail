import { NextResponse } from "next/server"
import { createDb } from "@/lib/db"
import { payments, plans, userPlans } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { verifyDokuSignature } from "@/lib/doku"
import { sendPremiumNotification } from "@/lib/email/notifications"

interface DokuNotification {
  order: {
    invoice_number: string
    amount: number
  }
  transaction: {
    status: string // SUCCESS, FAILED, EXPIRED
    type: string
    date: string
  }
  channel?: {
    id: string
  }
}

export async function POST(request: Request) {
  const env = getCloudflareContext().env
  const dokuClientId = await env.SITE_CONFIG.get("DOKU_CLIENT_ID")
  const dokuSecretKey = await env.SITE_CONFIG.get("DOKU_SECRET_KEY")

  if (!dokuClientId || !dokuSecretKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 })
  }

  const body = await request.text()

  // Verify DOKU signature
  const clientId = request.headers.get("Client-Id") || ""
  const requestId = request.headers.get("Request-Id") || ""
  const requestTimestamp = request.headers.get("Request-Timestamp") || ""
  const signature = request.headers.get("Signature") || ""

  const isValid = await verifyDokuSignature(
    dokuClientId,
    dokuSecretKey,
    requestId,
    requestTimestamp,
    "/api/payment/webhook",
    body,
    signature,
  )

  if (!isValid) {
    console.error("Invalid DOKU webhook signature", { clientId, requestId })
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 })
  }

  try {
    const notification = JSON.parse(body) as DokuNotification
    const invoiceNumber = notification.order.invoice_number
    const txStatus = notification.transaction.status

    const db = createDb()

    // Find payment record
    const payment = await db.query.payments.findFirst({
      where: eq(payments.invoiceNumber, invoiceNumber),
    })

    if (!payment) {
      console.error("Payment not found for invoice:", invoiceNumber)
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Map DOKU status to our status
    let newStatus: string
    if (txStatus === "SUCCESS") {
      newStatus = "PAID"
    } else if (txStatus === "EXPIRED") {
      newStatus = "EXPIRED"
    } else {
      newStatus = "FAILED"
    }

    // Update payment record
    await db
      .update(payments)
      .set({
        status: newStatus,
        paymentMethod: notification.channel?.id || notification.transaction.type,
        webhookData: body,
        paidAt: newStatus === "PAID" ? new Date() : null,
      })
      .where(eq(payments.id, payment.id))

    // If payment success, activate user plan
    if (newStatus === "PAID") {
      const plan = await db.query.plans.findFirst({
        where: eq(plans.id, payment.planId),
      })

      if (plan) {
        const durationMs = (plan.durationDays ?? 30) * 24 * 60 * 60 * 1000
        // Calculate expiry from now
        const expiresAt = new Date(Date.now() + durationMs)

        // Check existing user plan
        const existingPlan = await db.query.userPlans.findFirst({
          where: eq(userPlans.userId, payment.userId),
        })

        if (existingPlan) {
          // Extend from current expiry if still active
          const baseDate =
            existingPlan.expiresAt && existingPlan.expiresAt > new Date()
              ? existingPlan.expiresAt
              : new Date()
          const newExpiry = new Date(baseDate.getTime() + durationMs)

          await db
            .update(userPlans)
            .set({ planId: payment.planId, expiresAt: newExpiry })
            .where(eq(userPlans.userId, payment.userId))
        } else {
          await db.insert(userPlans).values({
            userId: payment.userId,
            planId: payment.planId,
            expiresAt,
          })
        }
      }

      // Send premium activation notification (fire-and-forget)
      sendPremiumNotification(payment.userId).catch(e =>
        console.error("Payment notification error:", e)
      )
    }

    return NextResponse.json({ message: "OK" })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json({ error: "Processing error" }, { status: 500 })
  }
}

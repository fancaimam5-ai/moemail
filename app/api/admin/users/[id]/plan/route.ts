import { createDb } from "@/lib/db"
import { plans, userPlans } from "@/lib/schema"
import { requireAdmin, logAdminAction } from "@/lib/admin"
import { eq } from "drizzle-orm"
import { sendPremiumNotification } from "@/lib/email/notifications"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, status } = await requireAdmin()
  if (error) return Response.json({ error }, { status })

  const { id: userId } = await params
  const db = createDb()

  const userPlan = await db.query.userPlans.findFirst({
    where: eq(userPlans.userId, userId),
    with: { plan: true },
  })

  return Response.json({
    plan: userPlan?.plan || null,
    expiresAt: userPlan?.expiresAt || null,
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, status, userId: adminId } = await requireAdmin()
  if (error) return Response.json({ error }, { status })

  const { id: userId } = await params
  const body = await request.json()
  const { planId, expiresAt } = body as {
    planId: string
    expiresAt?: string | null
  }

  if (!planId) {
    return Response.json({ error: "Missing planId" }, { status: 400 })
  }

  const db = createDb()

  // Verify plan exists
  const plan = await db.query.plans.findFirst({
    where: eq(plans.id, planId),
  })
  if (!plan) {
    return Response.json({ error: "Plan not found" }, { status: 404 })
  }

  // Check if user already has a plan
  const existing = await db.query.userPlans.findFirst({
    where: eq(userPlans.userId, userId),
  })

  const expiresDate = expiresAt ? new Date(expiresAt) : null

  if (existing) {
    await db
      .update(userPlans)
      .set({ planId, expiresAt: expiresDate })
      .where(eq(userPlans.userId, userId))
  } else {
    await db.insert(userPlans).values({
      userId,
      planId,
      expiresAt: expiresDate,
    })
  }

  await logAdminAction(adminId!, "assign_plan", "user", userId, {
    planName: plan.name,
    planId,
    expiresAt: expiresAt || "never",
  })

  // Send premium notification if it's a paid plan (non-blocking)
  if ((plan.priceCents ?? 0) > 0) {
    sendPremiumNotification(userId).catch(e =>
      console.error('Premium notification error:', e)
    )
  }

  return Response.json({ success: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, status, userId: adminId } = await requireAdmin()
  if (error) return Response.json({ error }, { status })

  const { id: userId } = await params
  const db = createDb()

  // Get current plan for logging
  const existing = await db.query.userPlans.findFirst({
    where: eq(userPlans.userId, userId),
    with: { plan: true },
  })

  if (!existing) {
    return Response.json({ error: "User has no plan" }, { status: 404 })
  }

  // Instead of deleting, assign Free plan
  let freePlan = await db.query.plans.findFirst({
    where: eq(plans.name, "Free"),
  })

  if (!freePlan) {
    const [created] = await db.insert(plans).values({
      name: "Free",
      maxEmails: 3,
      maxExpiryHours: 72,
      priceCents: 0,
    }).returning()
    freePlan = created
  }

  await db
    .update(userPlans)
    .set({ planId: freePlan.id, expiresAt: null })
    .where(eq(userPlans.userId, userId))

  await logAdminAction(adminId!, "remove_plan", "user", userId, {
    previousPlan: existing.plan?.name,
  })

  return Response.json({ success: true })
}

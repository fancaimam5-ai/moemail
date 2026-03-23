import { createDb } from "@/lib/db"
import { plans, userPlans } from "@/lib/schema"
import { requireAdmin, logAdminAction } from "@/lib/admin"
import { eq, desc, count, sql } from "drizzle-orm"

export async function GET() {
  const { error, status } = await requireAdmin()
  if (error) return Response.json({ error }, { status })

  const db = createDb()

  const planList = await db
    .select({
      id: plans.id,
      name: plans.name,
      maxEmails: plans.maxEmails,
      maxExpiryHours: plans.maxExpiryHours,
      priceCents: plans.priceCents,
      durationDays: plans.durationDays,
      createdAt: plans.createdAt,
      userCount: sql<number>`(SELECT COUNT(*) FROM user_plan WHERE plan_id = ${plans.id})`,
    })
    .from(plans)
    .orderBy(desc(plans.createdAt))

  return Response.json({ plans: planList })
}

export async function POST(request: Request) {
  const { error, status, userId: adminId } = await requireAdmin()
  if (error) return Response.json({ error }, { status })

  const body = await request.json()
  const { name, maxEmails, maxExpiryHours, priceCents, durationDays } = body as {
    name: string
    maxEmails: number
    maxExpiryHours: number | null
    priceCents: number
    durationDays?: number
  }

  if (!name || maxEmails == null) {
    return Response.json({ error: "Missing required fields" }, { status: 400 })
  }

  const db = createDb()

  const existing = await db.query.plans.findFirst({
    where: eq(plans.name, name),
  })
  if (existing) {
    return Response.json({ error: "Plan name already exists" }, { status: 409 })
  }

  const [newPlan] = await db.insert(plans).values({
    name,
    maxEmails,
    maxExpiryHours,
    priceCents: priceCents || 0,
    durationDays: durationDays ?? 30,
  }).returning()

  await logAdminAction(adminId!, "create_plan", "plan", newPlan.id, { name, maxEmails })

  return Response.json({ plan: newPlan })
}

export async function PATCH(request: Request) {
  const { error, status, userId: adminId } = await requireAdmin()
  if (error) return Response.json({ error }, { status })

  const body = await request.json()
  const { id, name, maxEmails, maxExpiryHours, priceCents, durationDays } = body as {
    id: string
    name?: string
    maxEmails?: number
    maxExpiryHours?: number | null
    priceCents?: number
    durationDays?: number
  }

  if (!id) {
    return Response.json({ error: "Missing plan id" }, { status: 400 })
  }

  const db = createDb()
  const existing = await db.query.plans.findFirst({ where: eq(plans.id, id) })
  if (!existing) {
    return Response.json({ error: "Plan not found" }, { status: 404 })
  }

  const updates: Record<string, unknown> = {}
  if (name !== undefined) updates.name = name
  if (maxEmails !== undefined) updates.maxEmails = maxEmails
  if (maxExpiryHours !== undefined) updates.maxExpiryHours = maxExpiryHours
  if (priceCents !== undefined) updates.priceCents = priceCents
  if (durationDays !== undefined) updates.durationDays = durationDays

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 })
  }

  await db.update(plans).set(updates).where(eq(plans.id, id))
  await logAdminAction(adminId!, "update_plan", "plan", id, updates)

  return Response.json({ success: true })
}

export async function DELETE(request: Request) {
  const { error, status, userId: adminId } = await requireAdmin()
  if (error) return Response.json({ error }, { status })

  const url = new URL(request.url)
  const planId = url.searchParams.get("id")
  if (!planId) {
    return Response.json({ error: "Missing plan id" }, { status: 400 })
  }

  const db = createDb()

  // Check if plan has users
  const [usage] = await db.select({ count: count() }).from(userPlans).where(eq(userPlans.planId, planId))
  if (usage.count > 0) {
    return Response.json({ error: "Cannot delete plan with active users" }, { status: 409 })
  }

  await db.delete(plans).where(eq(plans.id, planId))
  await logAdminAction(adminId!, "delete_plan", "plan", planId)

  return Response.json({ success: true })
}

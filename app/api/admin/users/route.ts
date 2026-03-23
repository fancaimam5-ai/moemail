import { createDb } from "@/lib/db"
import { users, userRoles, emails, userSuspensions, userPlans } from "@/lib/schema"
import { requireAdmin, logAdminAction } from "@/lib/admin"
import { eq, like, desc, sql, count, and, isNull, or, gt } from "drizzle-orm"
import { ROLES } from "@/lib/permissions"
import { assignRoleToUser } from "@/lib/auth"
import { roles } from "@/lib/schema"

export async function GET(request: Request) {
  const { error, status } = await requireAdmin()
  if (error) return Response.json({ error }, { status })

  const url = new URL(request.url)
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"))
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20")))
  const search = url.searchParams.get("search") || ""
  const filterRole = url.searchParams.get("role") || ""
  const filterStatus = url.searchParams.get("status") || ""
  const filterPlan = url.searchParams.get("plan") || ""
  const offset = (page - 1) * limit

  const db = createDb()

  const searchCondition = search
    ? or(
        like(users.username, `%${search}%`),
        like(users.email, `%${search}%`),
        like(users.name, `%${search}%`)
      )
    : undefined

  const conditions = searchCondition

  const [totalResult] = await db.select({ count: count() }).from(users).where(conditions)

  const userList = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      username: users.username,
      image: users.image,
      createdAt: sql<number>`COALESCE((SELECT MIN(created_at) FROM user_role WHERE user_id = ${users.id}), 0)`,
    })
    .from(users)
    .where(conditions)
    .orderBy(desc(sql`COALESCE((SELECT MIN(created_at) FROM user_role WHERE user_id = ${users.id}), 0)`))
    .limit(limit)
    .offset(offset)

  // Get roles and suspension status for each user, then apply role/status filters
  const enriched = (await Promise.all(
    userList.map(async (user) => {
      const userRole = await db.query.userRoles.findFirst({
        where: eq(userRoles.userId, user.id),
        with: { role: true },
      })
      const [emailCount] = await db.select({ count: count() }).from(emails).where(eq(emails.userId, user.id))
      const userRecord = await db.query.users.findFirst({
        where: eq(users.id, user.id),
        columns: { totalEmailsCreated: true },
      })
      const userPlan = await db.query.userPlans.findFirst({
        where: eq(userPlans.userId, user.id),
        with: { plan: true },
      })
      const suspension = await db.query.userSuspensions.findFirst({
        where: and(
          eq(userSuspensions.userId, user.id),
          isNull(userSuspensions.liftedAt),
          or(isNull(userSuspensions.expiresAt), gt(userSuspensions.expiresAt, new Date()))
        ),
      })

      return {
        ...user,
        role: userRole?.role.name || "unknown",
        emailCount: emailCount.count,
        totalEmailsCreated: userRecord?.totalEmailsCreated || 0,
        planName: userPlan?.plan?.name || null,
        planId: userPlan?.plan?.id || null,
        planExpiresAt: userPlan?.expiresAt || null,
        suspended: !!suspension,
        suspensionReason: suspension?.reason || null,
      }
    })
  )).filter((u) => {
    if (filterRole && u.role !== filterRole) return false
    if (filterStatus === "active" && u.suspended) return false
    if (filterStatus === "suspended" && !u.suspended) return false
    if (filterPlan === "free" && u.planName !== "Free") return false
    if (filterPlan === "premium" && u.planName === "Free") return false
    if (filterPlan === "none" && u.planName !== null) return false
    return true
  })

  return Response.json({
    users: enriched,
    total: totalResult.count,
    page,
    limit,
    totalPages: Math.ceil(totalResult.count / limit),
  })
}

export async function PATCH(request: Request) {
  const { error, status, userId: adminId } = await requireAdmin()
  if (error) return Response.json({ error }, { status })

  const body = await request.json()
  const { userId, action, data } = body as {
    userId: string
    action: "change_role" | "suspend" | "unsuspend" | "reset_credits"
    data?: Record<string, string>
  }

  if (!userId || !action) {
    return Response.json({ error: "Missing required fields" }, { status: 400 })
  }

  const db = createDb()

  // Prevent modifying yourself
  if (userId === adminId) {
    return Response.json({ error: "Cannot modify your own account" }, { status: 400 })
  }

  // Prevent modifying other emperors
  const targetRole = await db.query.userRoles.findFirst({
    where: eq(userRoles.userId, userId),
    with: { role: true },
  })
  if (targetRole?.role.name === ROLES.EMPEROR) {
    return Response.json({ error: "Cannot modify emperor accounts" }, { status: 400 })
  }

  if (action === "change_role") {
    const roleName = data?.role
    if (!roleName || ![ROLES.DUKE, ROLES.KNIGHT, ROLES.CIVILIAN].includes(roleName as any)) {
      return Response.json({ error: "Invalid role" }, { status: 400 })
    }

    let targetRoleRecord = await db.query.roles.findFirst({
      where: eq(roles.name, roleName),
    })
    if (!targetRoleRecord) {
      const [newRole] = await db.insert(roles).values({ name: roleName }).returning()
      targetRoleRecord = newRole
    }

    await assignRoleToUser(db, userId, targetRoleRecord.id)
    await logAdminAction(adminId!, "change_role", "user", userId, { newRole: roleName })

    return Response.json({ success: true })
  }

  if (action === "suspend") {
    const reason = data?.reason || "No reason provided"
    const duration = data?.duration // "permanent" | hours as string
    const durationHours = duration && duration !== "permanent" ? parseInt(duration) : NaN

    const expiresAt = !isNaN(durationHours)
      ? new Date(Date.now() + durationHours * 60 * 60 * 1000)
      : null

    await db.insert(userSuspensions).values({
      userId,
      reason,
      suspendedBy: adminId!,
      expiresAt,
    })

    await logAdminAction(adminId!, "suspend_user", "user", userId, { reason, duration })
    return Response.json({ success: true })
  }

  if (action === "unsuspend") {
    await db
      .update(userSuspensions)
      .set({ liftedAt: new Date(), liftedBy: adminId! })
      .where(
        and(
          eq(userSuspensions.userId, userId),
          isNull(userSuspensions.liftedAt)
        )
      )

    await logAdminAction(adminId!, "unsuspend_user", "user", userId)
    return Response.json({ success: true })
  }

  if (action === "reset_credits") {
    await db
      .update(users)
      .set({ totalEmailsCreated: 0 })
      .where(eq(users.id, userId))

    await logAdminAction(adminId!, "reset_credits", "user", userId)
    return Response.json({ success: true })
  }

  return Response.json({ error: "Unknown action" }, { status: 400 })
}

import { auth } from "@/lib/auth"
import { createDb } from "@/lib/db"
import { userRoles, adminActivityLog, userSuspensions } from "@/lib/schema"
import { eq, and, isNull, or, gt } from "drizzle-orm"
import { ROLES } from "@/lib/permissions"

export async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized", status: 401, userId: null }
  }

  const db = createDb()
  const userRoleRecords = await db.query.userRoles.findMany({
    where: eq(userRoles.userId, session.user.id),
    with: { role: true },
  })

  const isEmperor = userRoleRecords.some(ur => ur.role.name === ROLES.EMPEROR)
  if (!isEmperor) {
    return { error: "Forbidden", status: 403, userId: null }
  }

  const suspended = await isUserSuspended(session.user.id)
  if (suspended) {
    return { error: "Account suspended", status: 403, userId: null }
  }

  return { error: null, status: 200, userId: session.user.id }
}

export async function logAdminAction(
  adminId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  detail?: Record<string, unknown>
) {
  const db = createDb()
  await db.insert(adminActivityLog).values({
    adminId,
    action,
    targetType: targetType ?? null,
    targetId: targetId ?? null,
    detail: detail ? JSON.stringify(detail) : null,
  })
}

export async function isUserSuspended(userId: string): Promise<boolean> {
  const db = createDb()
  const now = new Date()
  const suspension = await db.query.userSuspensions.findFirst({
    where: and(
      eq(userSuspensions.userId, userId),
      isNull(userSuspensions.liftedAt),
      or(
        isNull(userSuspensions.expiresAt),
        gt(userSuspensions.expiresAt, now)
      )
    ),
  })
  return !!suspension
}

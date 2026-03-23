import { createDb } from "@/lib/db"
import { users, emails, messages, userRoles, guestSessions, userSuspensions, adminActivityLog, userPlans } from "@/lib/schema"
import { requireAdmin } from "@/lib/admin"
import { count, sql, desc } from "drizzle-orm"

export async function GET() {
  const { error, status } = await requireAdmin()
  if (error) return Response.json({ error }, { status })

  const db = createDb()

  const [
    [userCount],
    [emailCount],
    [messageCount],
    [guestCount],
    [suspendedCount],
    recentActivity,
  ] = await Promise.all([
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(emails),
    db.select({ count: count() }).from(messages),
    db.select({ count: count() }).from(guestSessions),
    db.select({ count: count() }).from(userSuspensions).where(
      sql`${userSuspensions.liftedAt} IS NULL AND (${userSuspensions.expiresAt} IS NULL OR ${userSuspensions.expiresAt} > ${Date.now()})`
    ),
    db.select().from(adminActivityLog).orderBy(desc(adminActivityLog.createdAt)).limit(10),
  ])

  // Role distribution
  const roleDistribution = await db
    .select({
      role: sql<string>`r.name`,
      count: count(),
    })
    .from(userRoles)
    .innerJoin(sql`role r`, sql`r.id = ${userRoles.roleId}`)
    .groupBy(sql`r.name`)

  // Emails created in last 24h
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
  const [recentEmails] = await db
    .select({ count: count() })
    .from(emails)
    .where(sql`${emails.createdAt} > ${oneDayAgo}`)

  // Email trend (last 7 days)
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const trendData = await db
    .select({
      date: sql<string>`DATE(${emails.createdAt} / 1000, 'unixepoch')`,
      count: count(),
    })
    .from(emails)
    .where(sql`${emails.createdAt} > ${sevenDaysAgo}`)
    .groupBy(sql`DATE(${emails.createdAt} / 1000, 'unixepoch')`)
    .orderBy(sql`DATE(${emails.createdAt} / 1000, 'unixepoch')`)

  // Domain stats
  const domainStats = await db
    .select({
      domain: sql<string>`SUBSTR(${emails.address}, INSTR(${emails.address}, '@') + 1)`,
      count: count(),
    })
    .from(emails)
    .groupBy(sql`SUBSTR(${emails.address}, INSTR(${emails.address}, '@') + 1)`)
    .orderBy(desc(count()))

  // Plan distribution
  const planDistribution = await db
    .select({
      planName: sql<string>`p.name`,
      count: count(),
    })
    .from(userPlans)
    .innerJoin(sql`plan p`, sql`p.id = ${userPlans.planId}`)
    .groupBy(sql`p.name`)

  // Users at limit (totalEmailsCreated >= plan maxEmails, excluding unlimited/premium)
  const [usersAtLimit] = await db
    .select({ count: count() })
    .from(users)
    .innerJoin(userPlans, sql`${userPlans.userId} = ${users.id}`)
    .innerJoin(sql`plan p`, sql`p.id = ${userPlans.planId}`)
    .where(sql`${users.totalEmailsCreated} >= p.max_emails AND p.max_emails < 999999`)

  return Response.json({
    users: userCount.count,
    emails: emailCount.count,
    messages: messageCount.count,
    guestSessions: guestCount.count,
    suspendedUsers: suspendedCount.count,
    usersAtLimit: usersAtLimit.count,
    emailsLast24h: recentEmails.count,
    roleDistribution: roleDistribution.reduce((acc, r) => {
      acc[r.role] = r.count
      return acc
    }, {} as Record<string, number>),
    recentActivity: recentActivity.map(a => ({
      ...a,
      detail: a.detail ? JSON.parse(a.detail) : null,
    })),
    emailTrend: trendData,
    domainStats,
    planDistribution: planDistribution.reduce((acc, p) => {
      acc[p.planName] = p.count
      return acc
    }, {} as Record<string, number>),
  })
}

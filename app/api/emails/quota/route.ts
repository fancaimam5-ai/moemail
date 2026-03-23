import { NextResponse } from "next/server"
import { createDb } from "@/lib/db"
import { users, userPlans } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { getUserId } from "@/lib/apiKey"
import { getUserRole } from "@/lib/auth"
import { ROLES } from "@/lib/permissions"

const DEFAULT_FREE_LIMIT = 3

function parseLimitValue(value: string | null): number | null {
  if (!value) return null
  const normalized = value.trim()
  if (!normalized || normalized === "undefined" || normalized === "null") {
    return null
  }
  const parsed = Number(normalized)
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return parsed
}

export async function GET() {
  const userId = await getUserId()
  const userRole = await getUserRole(userId!)
  const db = createDb()
  const env = getCloudflareContext().env

  let maxEmails = DEFAULT_FREE_LIMIT
  let planName = "Free"
  let planId: string | null = null
  let isPremium = false

  if (userRole === ROLES.EMPEROR) {
    maxEmails = -1 // unlimited
    planName = "Emperor"
    isPremium = true
  } else if (userRole === ROLES.KNIGHT) {
    maxEmails = -1 // unlimited (Premium)
    planName = "Premium"
    isPremium = true
  } else {
    const userPlan = await db.query.userPlans.findFirst({
      where: eq(userPlans.userId, userId!),
      with: { plan: true },
    })

    if (userPlan?.plan && (!userPlan.expiresAt || userPlan.expiresAt > new Date())) {
      maxEmails = userPlan.plan.maxEmails
      planName = userPlan.plan.name
      planId = userPlan.plan.id
      isPremium = (userPlan.plan.priceCents ?? 0) > 0
    }

    const kvLimit = parseLimitValue(await env.SITE_CONFIG.get("MAX_EMAILS"))
    if (kvLimit !== null) {
      maxEmails = Math.min(maxEmails, kvLimit)
    }
  }

  // Get total lifetime email created count
  const userRecord = await db.query.users.findFirst({
    where: eq(users.id, userId!),
    columns: { totalEmailsCreated: true },
  })

  const totalCreated = userRecord?.totalEmailsCreated ?? 0

  return NextResponse.json({
    totalCreated,
    max: maxEmails,
    remaining: maxEmails === -1 ? -1 : Math.max(0, maxEmails - totalCreated),
    planName,
    planId,
    isPremium,
  })
}

import { NextResponse } from "next/server"
import { createDb } from "@/lib/db"
import { userPlans } from "@/lib/schema"
import { and, gte, lte } from "drizzle-orm"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { sendPremiumExpiringNotification } from "@/lib/email/notifications"

export async function POST(request: Request) {
  const env = getCloudflareContext().env
  const cronSecret = await env.SITE_CONFIG.get("CRON_SECRET")

  if (cronSecret) {
    const receivedSecret = request.headers.get("X-Cron-Secret")
    if (receivedSecret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const now = Date.now()
  // 7-day window: 6 to 8 days from now
  const day7From = new Date(now + 6 * 24 * 60 * 60 * 1000)
  const day7To = new Date(now + 8 * 24 * 60 * 60 * 1000)
  // 1-day window: now to 2 days from now
  const day1From = new Date(now)
  const day1To = new Date(now + 2 * 24 * 60 * 60 * 1000)

  const db = createDb()

  const [expiring7Day, expiring1Day] = await Promise.all([
    db.query.userPlans.findMany({
      where: and(gte(userPlans.expiresAt, day7From), lte(userPlans.expiresAt, day7To)),
    }),
    db.query.userPlans.findMany({
      where: and(gte(userPlans.expiresAt, day1From), lte(userPlans.expiresAt, day1To)),
    }),
  ])

  // Deduplicate by userId (prefer 1-day over 7-day if overlap)
  const seen = new Set<string>()
  const toNotify = [...expiring1Day, ...expiring7Day].filter(p => {
    if (seen.has(p.userId)) return false
    seen.add(p.userId)
    return !!p.expiresAt
  })

  let notified = 0
  for (const plan of toNotify) {
    try {
      await sendPremiumExpiringNotification(plan.userId, plan.expiresAt!)
      notified++
    } catch (e) {
      console.error(`Expiry notification failed for user ${plan.userId}:`, e)
    }
  }

  return NextResponse.json({ notified })
}

import { createDb } from "@/lib/db"
import { plans } from "@/lib/schema"

export async function GET() {
  try {
    const db = createDb()
    const allPlans = await db.select().from(plans)

    const findPlan = (role: string, currency: string) =>
      allPlans.find(p => p.name === `${role}_${currency}`) ?? null

    return Response.json({
      free: {
        idr: findPlan("civilian", "idr"),
        usd: findPlan("civilian", "usd"),
      },
      premium: {
        idr: findPlan("knight", "idr"),
        usd: findPlan("knight", "usd"),
      },
    }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    })
  } catch {
    return Response.json({ free: { idr: null, usd: null }, premium: { idr: null, usd: null } })
  }
}

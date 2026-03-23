import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { createDb } from "@/lib/db"
import { plans } from "@/lib/schema"
import { getTranslations } from "next-intl/server"
import type { Locale } from "@/i18n/config"
import { CheckoutContent } from "./checkout-content"

interface PlanOption {
  id: string
  name: string
  priceCents: number
  currency: string
  label: string
}

function formatPrice(priceCents: number, currency: string): string {
  if (priceCents === 0) return currency === "idr" ? "Gratis" : "Free"
  if (currency === "idr") return `Rp ${priceCents.toLocaleString("id-ID")}`
  return `$${(priceCents / 100).toFixed(2)}`
}

async function getPremiumPlans(): Promise<PlanOption[]> {
  try {
    const db = createDb()
    const allPlans = await db.select().from(plans)

    return allPlans
      .filter((p) => p.name.includes("knight") && (p.priceCents ?? 0) > 0)
      .map((p) => {
        const currency = p.name.endsWith("_idr") ? "idr" : "usd"
        return {
          id: p.id,
          name: p.name,
          priceCents: p.priceCents ?? 0,
          currency,
          label: formatPrice(p.priceCents ?? 0, currency),
        }
      })
  } catch {
    return []
  }
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: localeFromParams } = await params
  const locale = localeFromParams as Locale
  const session = await auth()

  if (!session?.user) {
    redirect(`/${locale}/login`)
  }

  const premiumPlans = await getPremiumPlans()
  const t = await getTranslations({ locale, namespace: "checkout" })

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="container mx-auto px-4 lg:px-8 max-w-[1600px]">
        <Header />
        <main className="pt-24 pb-16">
          <div className="max-w-lg mx-auto">
            <h1 className="text-2xl font-bold text-center mb-2">
              {t("title")}
            </h1>
            <p className="text-center text-muted-foreground mb-8">
              {t("subtitle")}
            </p>
            <CheckoutContent plans={premiumPlans} />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  )
}

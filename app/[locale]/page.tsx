import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { auth, getUserRole } from "@/lib/auth"
import { ROLES } from "@/lib/permissions"
import { Shield, Share2, Clock, Code2 } from "lucide-react"
import { ActionButton } from "@/components/home/action-button"
import { FeatureCard } from "@/components/home/feature-card"
import { EmailCreationCard } from "@/components/home/email-creation-card"
import { HowItWorks } from "@/components/home/how-it-works"
import { PlanComparison } from "@/components/home/plan-comparison"
import { HeroAnimation, StaggerChild } from "@/components/ui/stagger-animation"
import { getTranslations } from "next-intl/server"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { getTurnstileConfig } from "@/lib/turnstile"
import { FREE_DOMAINS } from "@/config"
import { createDb } from "@/lib/db"
import { plans } from "@/lib/schema"
import type { Locale } from "@/i18n/config"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://if-mail.tech"
  const isId = locale === "id"

  return {
    title: isId
      ? "Email Sementara Gratis — IfMail | Kotak Masuk Sekali Pakai dalam Hitungan Detik"
      : "Free Temporary Email — IfMail | Disposable Inbox in Seconds",
    description: isId
      ? "Buat email sekali pakai sekarang — tanpa daftar, tanpa nomor HP. 3 kotak masuk gratis, kedaluwarsa otomatis, dan akses API penuh. Didukung Cloudflare."
      : "Create a disposable email instantly — no signup, no phone. 3 free mailboxes, auto-expiry, and full API access. Powered by Cloudflare.",
    alternates: {
      canonical: `${baseUrl}/en`,
      languages: {
        en: `${baseUrl}/en`,
        id: `${baseUrl}/id`,
        "x-default": `${baseUrl}/en`,
      },
    },
  }
}

function formatPrice(priceCents: number, currency: string): string {
  if (priceCents === 0) return currency === "idr" ? "Gratis" : "Free"
  if (currency === "idr") return `Rp ${priceCents.toLocaleString("id-ID")}`
  return `$${(priceCents / 100).toFixed(2)}`
}

async function getPlanPrices(): Promise<{ freePrice: string | null; premiumPrice: string | null; premiumPeriod: string | null }> {
  try {
    const db = createDb()
    const allPlans = await db.select().from(plans)

    const findPlan = (role: string, currency: string) =>
      allPlans.find(p => p.name === `${role}_${currency}`) ?? null

    const freePlan = findPlan("civilian", "idr") ?? findPlan("civilian", "usd")
    const premiumPlan = findPlan("knight", "idr") ?? findPlan("knight", "usd")

    const freePrice = freePlan
      ? formatPrice(freePlan.priceCents ?? 0, freePlan.name.endsWith("_idr") ? "idr" : "usd")
      : null

    const premiumPrice = premiumPlan
      ? formatPrice(premiumPlan.priceCents ?? 0, premiumPlan.name.endsWith("_idr") ? "idr" : "usd")
      : null

    const premiumPeriod = premiumPlan
      ? (premiumPlan.name.endsWith("_idr") ? "/bln" : "/mo")
      : null

    return { freePrice, premiumPrice, premiumPeriod }
  } catch {
    return { freePrice: null, premiumPrice: null, premiumPeriod: null }
  }
}

function getConfiguredDomains(domainString: string | null): string[] {
  if (!domainString) return ["ifmail.email"]
  const normalized = domainString.trim()
  if (!normalized || normalized === "undefined" || normalized === "null") {
    return ["ifmail.email"]
  }
  const domains = normalized.split(",").map(d => d.trim()).filter(Boolean)
  return domains.length > 0 ? domains : ["ifmail.email"]
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: localeFromParams } = await params
  const locale = localeFromParams as Locale
  const session = await auth()
  const t = await getTranslations({ locale, namespace: "home" })

  // Fetch email domains and turnstile config server-side
  const env = getCloudflareContext().env
  const [domainString, turnstileConfig, planPrices] = await Promise.all([
    env.SITE_CONFIG.get("EMAIL_DOMAINS"),
    getTurnstileConfig(),
    getPlanPrices(),
  ])
  const allDomains = getConfiguredDomains(domainString)
  // Get user role to determine domain access
  const userRole = session?.user?.id ? await getUserRole(session.user.id) : null
  const isPremiumUser = userRole === ROLES.KNIGHT || userRole === ROLES.DUKE || userRole === ROLES.EMPEROR
  // Premium users see all domains; free users and guests see only FREE_DOMAINS
  const freeDomains = allDomains.filter(d => FREE_DOMAINS.includes(d))
  const domains = isPremiumUser ? allDomains : (freeDomains.length > 0 ? freeDomains : allDomains.slice(0, 3))

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="container mx-auto px-4 lg:px-8 max-w-[1600px]">
        <Header />
        <main className="pt-16">
          <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center px-2 relative py-12">
            <div className="absolute inset-0 -z-10 bg-grid-primary/5" />

            <div className="w-full max-w-3xl mx-auto space-y-6 sm:space-y-8 py-4">
              <HeroAnimation>
                <div className="space-y-2 sm:space-y-3">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-wider">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                      {t("title")}
                    </span>
                  </h1>
                  <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 tracking-wide">
                    {t("subtitle")}
                  </p>
                </div>
              </HeroAnimation>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 px-2 sm:px-0">
                <StaggerChild index={0}>
                  <FeatureCard
                    icon={<Shield className="w-5 h-5" />}
                    title={t("features.privacy.title")}
                    description={t("features.privacy.description")}
                  />
                </StaggerChild>
                <StaggerChild index={1}>
                  <FeatureCard
                    icon={<Share2 className="w-5 h-5" />}
                    title={t("features.instant.title")}
                    description={t("features.instant.description")}
                  />
                </StaggerChild>
                <StaggerChild index={2}>
                  <FeatureCard
                    icon={<Clock className="w-5 h-5" />}
                    title={t("features.expiry.title")}
                    description={t("features.expiry.description")}
                  />
                </StaggerChild>
                <StaggerChild index={3}>
                  <FeatureCard
                    icon={<Code2 className="w-5 h-5" />}
                    title={t("features.openapi.title")}
                    description={t("features.openapi.description")}
                  />
                </StaggerChild>
              </div>

              <StaggerChild index={4}>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-2 sm:px-0">
                  <ActionButton isLoggedIn={!!session} />
                </div>
              </StaggerChild>

              <StaggerChild index={5}>
                <EmailCreationCard
                  isLoggedIn={!!session}
                  domains={domains}
                  turnstileSiteKey={turnstileConfig.siteKey}
                  turnstileEnabled={turnstileConfig.enabled}
                />
              </StaggerChild>
            </div>
          </div>

          {/* Definition Block — optimized for AI citation and featured snippets */}
          <section className="max-w-3xl mx-auto px-4 py-10 text-center">
            <h2 className="text-2xl font-bold mb-3">{t("definition.title")}</h2>
            <p className="text-muted-foreground leading-relaxed text-base">{t("definition.body")}</p>
          </section>

          {/* How It Works */}
          <HowItWorks />

          {/* Plan Comparison */}
          <PlanComparison
            premiumPrice={planPrices.premiumPrice}
            premiumPeriod={planPrices.premiumPeriod}
            isPremiumUser={isPremiumUser}
            isLoggedIn={!!session}
          />

        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}


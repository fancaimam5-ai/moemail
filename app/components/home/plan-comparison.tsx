"use client"

import { useTranslations, useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import { Check, X, Sparkles, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollReveal } from "@/components/ui/scroll-reveal"

interface PlanComparisonProps {
  premiumPrice: string | null
  premiumPeriod: string | null
  isPremiumUser: boolean
  isLoggedIn: boolean
}

export function PlanComparison({ premiumPrice, premiumPeriod, isPremiumUser, isLoggedIn }: PlanComparisonProps) {
  const t = useTranslations("home.plans")
  const locale = useLocale()
  const router = useRouter()

  const freeFeatures = [
    { key: "emailCredits", included: true },
    { key: "readInbox", included: true },
    { key: "expiry3d", included: true },
    { key: "credential", included: true },
    { key: "basicShare", included: true },
    { key: "limitedDomains", included: true },
    { key: "sendEmail", included: true },
    { key: "permanent", included: false },
    { key: "apiKey", included: false },
    { key: "webhook", included: false },
  ]

  const premiumFeatures = [
    { key: "unlimitedCreate", included: true },
    { key: "readInbox", included: true },
    { key: "unlimitedExpiry", included: true },
    { key: "credential", included: true },
    { key: "allShare", included: true },
    { key: "allDomains", included: true },
    { key: "sendEmailPremium", included: true },
    { key: "permanent", included: true },
    { key: "apiKey", included: true },
    { key: "webhook", included: true },
  ]

  // Use dynamic price from DB, fallback to translation
  const displayPrice = premiumPrice && premiumPrice !== "Free" && premiumPrice !== "Gratis"
    ? premiumPrice
    : t("premium.price")

  const displayPeriod = premiumPeriod || t("premium.period")

  const showPeriod = premiumPrice && premiumPrice !== "Free" && premiumPrice !== "Gratis"

  return (
    <div className="w-full max-w-3xl mx-auto py-8">
      <ScrollReveal>
        <h2 className="text-2xl font-bold text-center mb-2">{t("title")}</h2>
        <p className="text-center text-sm text-muted-foreground mb-6">{t("subtitle")}</p>
      </ScrollReveal>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ScrollReveal delay={0}>
          {/* Free */}
          <div className="rounded-xl border-2 border-primary/20 p-6 relative">
          <h3 className="text-lg font-bold mb-1">{t("free.name")}</h3>
          <p className="text-2xl font-bold mb-4">{t("free.price")}</p>
          <ul className="space-y-2">
            {freeFeatures.map((f) => (
              <li key={f.key} className="flex items-center gap-2 text-sm">
                {f.included ? (
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                ) : (
                  <X className="w-4 h-4 text-gray-300 shrink-0" />
                )}
                <span className={f.included ? "" : "text-muted-foreground"}>{t(`features.${f.key}`)}</span>
              </li>
            ))}
          </ul>
          <Button
            variant="outline"
            className={`w-full mt-6 ${isLoggedIn && !isPremiumUser ? "border-green-500 text-green-600 dark:text-green-400" : ""}`}
            onClick={() => router.push(`/${locale}/${isLoggedIn ? "moe" : "login"}`)}
          >
            {isLoggedIn && !isPremiumUser ? (
              <><CheckCircle2 className="w-4 h-4 mr-1.5" />{t("free.currentPlan")}</>
            ) : isLoggedIn ? (
              t("free.cta")
            ) : (
              t("free.cta")
            )}
          </Button>
        </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
        {/* Premium */}
        <div className="rounded-xl border-2 border-amber-400 dark:border-amber-500 p-6 relative bg-amber-50/50 dark:bg-amber-900/10">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {t("premium.badge")}
          </div>
          <h3 className="text-lg font-bold mb-1">{t("premium.name")}</h3>
          <div className="flex items-end gap-1 mb-4">
            <span className="text-2xl font-bold">{displayPrice}</span>
            {showPeriod && (
              <span className="text-sm text-muted-foreground mb-0.5">{displayPeriod}</span>
            )}
          </div>
          <ul className="space-y-2">
            {premiumFeatures.map((f) => (
              <li key={f.key} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500 shrink-0" />
                <span>{t(`features.${f.key}`)}</span>
              </li>
            ))}
          </ul>
          <Button
            className={`w-full mt-6 ${isPremiumUser ? "bg-green-600 hover:bg-green-700 text-white" : "bg-amber-500 hover:bg-amber-600 text-white"}`}
            onClick={() => router.push(`/${locale}/${isPremiumUser ? "moe" : "pricing"}`)}
            disabled={false}
          >
            {isPremiumUser ? (
              <><CheckCircle2 className="w-4 h-4 mr-1.5" />{t("premium.currentPlan")}</>
            ) : (
              t("premium.cta")
            )}
          </Button>
        </div>
        </ScrollReveal>
      </div>
    </div>
  )
}

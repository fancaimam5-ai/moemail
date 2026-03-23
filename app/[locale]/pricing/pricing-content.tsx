"use client"

import { useTranslations, useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import { Check, X, Sparkles, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface PlanPrice {
  label: string
  period: string
}

interface PricingContentProps {
  freePrice: PlanPrice | null
  premiumPrice: PlanPrice | null
  isPremiumUser: boolean
  isLoggedIn: boolean
}

export function PricingContent({ freePrice, premiumPrice, isPremiumUser, isLoggedIn }: PricingContentProps) {
  const t = useTranslations("pricing")
  const locale = useLocale()
  const router = useRouter()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const comparisonRows = [
    { key: "createEmails", free: "3", premium: t("unlimited") },
    { key: "readInbox", free: true, premium: true },
    { key: "maxExpiry", free: "72h", premium: t("unlimited") },
    { key: "permanentEmail", free: false, premium: true },
    { key: "emailSharing", free: true, premium: true },
    { key: "permanentShare", free: false, premium: true },
    { key: "credential", free: true, premium: true },
    { key: "apiKey", free: false, premium: true },
    { key: "webhook", free: false, premium: true },
    { key: "allDomains", free: t("freeDomains"), premium: t("allDomainsCount") },
    { key: "sendEmail", free: "2/day", premium: "5/day" },
  ]

  const faqs = ["whatIsIfMail", "creditRefund", "premiumExpire", "guestLimit", "howUpgrade", "cancelPremium", "isItSafe", "apiAccess"]

  const showFreePrice = freePrice && freePrice.label !== "Free" && freePrice.label !== "Gratis"
  const showPremiumPrice = premiumPrice && premiumPrice.label !== "Free" && premiumPrice.label !== "Gratis"

  return (
    <div className="space-y-12">
      {/* Plan Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Free Plan */}
        <div className="rounded-2xl border-2 border-primary/20 p-8">
          <h2 className="text-xl font-bold">{t("free.name")}</h2>
          <div className="mt-2 flex items-end gap-1">
            <span className="text-4xl font-bold">
              {freePrice ? freePrice.label : "$0"}
            </span>
            {showFreePrice && (
              <span className="text-sm text-muted-foreground mb-1">{freePrice!.period}</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-2">{t("free.description")}</p>
          <Button
            variant="outline"
            className={`w-full mt-6 ${isLoggedIn && !isPremiumUser ? "border-green-500 text-green-600 dark:text-green-400" : ""}`}
            onClick={() => router.push(`/${locale}/${isLoggedIn ? "moe" : "login"}`)}
          >
            {isLoggedIn && !isPremiumUser ? (
              <><CheckCircle2 className="w-4 h-4 mr-1.5" />{t("free.currentPlan")}</>
            ) : (
              t("free.cta")
            )}
          </Button>
        </div>

        {/* Premium Plan */}
        <div className="rounded-2xl border-2 border-amber-400 dark:border-amber-500 p-8 relative bg-amber-50/30 dark:bg-amber-900/10">
          <div className="absolute -top-3 right-6 bg-amber-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {t("premium.badge")}
          </div>
          <h2 className="text-xl font-bold">{t("premium.name")}</h2>
          <div className="mt-2 flex items-end gap-1">
            <span className="text-4xl font-bold">
              {premiumPrice ? premiumPrice.label : t("premium.price")}
            </span>
            {showPremiumPrice && (
              <span className="text-sm text-muted-foreground mb-1">{premiumPrice!.period}</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-2">{t("premium.description")}</p>
          <Button
            className={`w-full mt-6 gap-2 ${isPremiumUser ? "bg-green-600 hover:bg-green-700 text-white" : "bg-amber-500 hover:bg-amber-600 text-white"}`}
            onClick={() => router.push(`/${locale}/${isPremiumUser ? "moe" : "checkout"}`)}
          >
            {isPremiumUser ? (
              <><CheckCircle2 className="w-4 h-4" />{t("premium.currentPlan")}</>
            ) : (
              <><Sparkles className="w-4 h-4" />{t("premium.cta")}</>
            )}
          </Button>
        </div>
      </div>

      {/* Comparison Table */}
      <div>
        <h2 className="text-xl font-bold text-center mb-6">{t("comparison.title")}</h2>
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-semibold">{t("comparison.feature")}</th>
                <th className="text-center p-3 font-semibold">{t("free.name")}</th>
                <th className="text-center p-3 font-semibold">
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    {t("premium.name")}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.key} className="border-b last:border-0">
                  <td className="p-3">{t(`comparison.rows.${row.key}` as any)}</td>
                  <td className="p-3 text-center">
                    {typeof row.free === "boolean" ? (
                      row.free ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-gray-300 mx-auto" />
                    ) : (
                      <span className="text-muted-foreground">{row.free}</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {typeof row.premium === "boolean" ? (
                      row.premium ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-gray-300 mx-auto" />
                    ) : (
                      <span className="font-medium">{row.premium}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-xl font-bold text-center mb-6">{t("faq.title")}</h2>
        <div className="space-y-2 max-w-2xl mx-auto">
          {faqs.map((faq, i) => (
            <div key={faq} className="rounded-lg border">
              <button
                className="w-full flex items-center justify-between p-4 text-left text-sm font-medium"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                {t(`faq.items.${faq}.q` as any)}
                {openFaq === i ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 text-sm text-muted-foreground">
                  {t(`faq.items.${faq}.a` as any)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

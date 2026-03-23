"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

const STORAGE_KEY = "ifmail_onboarded"

export function OnboardingBanner() {
  const t = useTranslations("emails.onboarding")
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setShow(true)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1")
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="mx-2 mt-2 p-4 rounded-lg bg-primary/5 border border-primary/20 relative animate-fade-up">
      <button
        onClick={dismiss}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="space-y-2 pr-6">
        <h3 className="text-sm font-semibold">{t("welcome")}</h3>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>{t("step1")}</p>
          <p>{t("step2")}</p>
          <p>{t("step3")}</p>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <div className="text-xs px-2 py-1 rounded-full bg-muted">
            {t("freeCredits")}
          </div>
          <Button variant="link" size="sm" className="h-auto p-0 text-xs text-amber-600" onClick={dismiss}>
            <Sparkles className="w-3 h-3 mr-1" />
            {t("seePremium")}
          </Button>
        </div>
      </div>
    </div>
  )
}

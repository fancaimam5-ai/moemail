"use client"

import { useTranslations, useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles, Check, ArrowRight } from "lucide-react"

interface UpgradeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UpgradeDialog({ open, onOpenChange }: UpgradeDialogProps) {
  const t = useTranslations("emails.upgrade")
  const locale = useLocale()
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-3">
            {["unlimited", "permanent", "api", "webhook", "allDomains"].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-500 shrink-0" />
                <span className="text-sm">{t(`features.${feature}`)}</span>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {t("existingNote")}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => { onOpenChange(false); router.push(`/${locale}/checkout`); }}
            className="gap-2 bg-amber-500 hover:bg-amber-600 text-white"
          >
            <ArrowRight className="w-4 h-4" />
            {t("viewPlans")}
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("maybeLater")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

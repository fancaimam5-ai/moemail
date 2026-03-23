import { useTranslations } from "next-intl"
import { ScrollReveal } from "@/components/ui/scroll-reveal"

export function HowItWorks() {
  const t = useTranslations("home.howItWorks")

  const steps = [
    { num: "1", key: "step1" },
    { num: "2", key: "step2" },
    { num: "3", key: "step3" },
  ]

  return (
    <div className="w-full max-w-3xl mx-auto py-8">
      <ScrollReveal>
        <h2 className="text-2xl font-bold text-center mb-6">{t("title")}</h2>
      </ScrollReveal>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {steps.map((step, i) => (
          <ScrollReveal key={step.key} delay={i * 100}>
            <div className="text-center p-4 rounded-lg bg-white/5 border border-primary/10">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center mx-auto mb-3">
                {step.num}
              </div>
              <h3 className="font-semibold text-sm mb-1">{t(`${step.key}.title`)}</h3>
              <p className="text-xs text-muted-foreground">{t(`${step.key}.description`)}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  )
}

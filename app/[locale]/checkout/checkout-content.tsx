"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  Sparkles,
  Check,
  Loader2,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react"

interface PlanOption {
  id: string
  name: string
  priceCents: number
  currency: string
  label: string
}

interface CheckoutContentProps {
  plans: PlanOption[]
}

type PaymentStatus = "idle" | "creating" | "pending" | "PAID" | "EXPIRED" | "FAILED"

export function CheckoutContent({ plans }: CheckoutContentProps) {
  const t = useTranslations("checkout")
  const [selectedPlan, setSelectedPlan] = useState<string>(plans[0]?.id || "")
  const [status, setStatus] = useState<PaymentStatus>("idle")
  const [paymentUrl, setPaymentUrl] = useState("")
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [error, setError] = useState("")
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const premiumFeatures = [
    "unlimitedEmails",
    "permanentAddress",
    "allDomains",
    "apiAccess",
    "webhook",
    "sendLimit",
  ]

  // Poll payment status
  useEffect(() => {
    if (status === "pending" && invoiceNumber) {
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(
            `/api/payment/status?invoice=${encodeURIComponent(invoiceNumber)}`,
          )
          if (res.ok) {
            const data = (await res.json()) as { status: string }
            if (data.status === "PAID") {
              setStatus("PAID")
              if (pollRef.current) clearInterval(pollRef.current)
            } else if (data.status === "EXPIRED" || data.status === "FAILED") {
              setStatus(data.status as PaymentStatus)
              if (pollRef.current) clearInterval(pollRef.current)
            }
          }
        } catch {
          // ignore poll errors
        }
      }, 5000)
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [status, invoiceNumber])

  const handleCheckout = async () => {
    if (!selectedPlan) return
    setError("")
    setStatus("creating")

    try {
      const res = await fetch("/api/payment/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlan }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error: string }
        setError(data.error || "Failed to create payment")
        setStatus("idle")
        return
      }

      const data = (await res.json()) as {
        paymentUrl: string
        invoiceNumber: string
      }
      setPaymentUrl(data.paymentUrl)
      setInvoiceNumber(data.invoiceNumber)
      setStatus("pending")

      // Open DOKU payment page
      window.open(data.paymentUrl, "_blank")
    } catch {
      setError("Something went wrong")
      setStatus("idle")
    }
  }

  // Payment success
  if (status === "PAID") {
    return (
      <div className="rounded-2xl border-2 border-green-400 p-8 text-center space-y-4 bg-green-50/50 dark:bg-green-900/10">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
        <h2 className="text-xl font-bold">{t("success.title")}</h2>
        <p className="text-muted-foreground">{t("success.description")}</p>
        <Button
          onClick={() => (window.location.href = "/moe")}
          className="gap-2"
        >
          {t("success.goToDashboard")}
        </Button>
      </div>
    )
  }

  // Payment expired/failed
  if (status === "EXPIRED" || status === "FAILED") {
    return (
      <div className="rounded-2xl border-2 border-red-300 p-8 text-center space-y-4 bg-red-50/50 dark:bg-red-900/10">
        <XCircle className="w-16 h-16 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold">
          {status === "EXPIRED" ? t("expired.title") : t("failed.title")}
        </h2>
        <p className="text-muted-foreground">
          {status === "EXPIRED"
            ? t("expired.description")
            : t("failed.description")}
        </p>
        <Button
          onClick={() => {
            setStatus("idle")
            setPaymentUrl("")
            setInvoiceNumber("")
          }}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {t("tryAgain")}
        </Button>
      </div>
    )
  }

  // Waiting for payment
  if (status === "pending") {
    return (
      <div className="rounded-2xl border-2 border-amber-400 p-8 text-center space-y-4 bg-amber-50/30 dark:bg-amber-900/10">
        <Clock className="w-16 h-16 text-amber-500 mx-auto animate-pulse" />
        <h2 className="text-xl font-bold">{t("pending.title")}</h2>
        <p className="text-muted-foreground text-sm">
          {t("pending.description")}
        </p>
        <p className="font-mono text-xs text-muted-foreground">
          {invoiceNumber}
        </p>
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => window.open(paymentUrl, "_blank")}
            className="gap-2 bg-amber-500 hover:bg-amber-600 text-white"
          >
            <ExternalLink className="w-4 h-4" />
            {t("pending.openPayment")}
          </Button>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            {t("pending.waiting")}
          </div>
        </div>
      </div>
    )
  }

  // Plan selection + checkout
  return (
    <div className="space-y-6">
      {/* Plan selector */}
      <div className="rounded-2xl border-2 border-amber-400 dark:border-amber-500 p-6 bg-amber-50/30 dark:bg-amber-900/10 relative">
        <div className="absolute -top-3 right-6 bg-amber-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Premium
        </div>

        <h2 className="text-lg font-bold mb-4">{t("selectPlan")}</h2>

        {plans.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("noPlans")}</p>
        ) : (
          <div className="space-y-2">
            {plans.map((plan) => (
              <label
                key={plan.id}
                className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedPlan === plan.id
                    ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-amber-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="plan"
                    value={plan.id}
                    checked={selectedPlan === plan.id}
                    onChange={() => setSelectedPlan(plan.id)}
                    className="accent-amber-500"
                  />
                  <div>
                    <span className="font-semibold">Premium</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({plan.currency.toUpperCase()})
                    </span>
                  </div>
                </div>
                <span className="text-lg font-bold">
                  {plan.label}
                  <span className="text-xs font-normal text-muted-foreground">
                    /{plan.currency === "idr" ? "bln" : "mo"}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}

        {/* Features */}
        <div className="mt-6 space-y-2">
          {premiumFeatures.map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500 shrink-0" />
              <span>{t(`features.${feature}`)}</span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      {/* Checkout button */}
      <Button
        onClick={handleCheckout}
        disabled={!selectedPlan || status === "creating" || plans.length === 0}
        className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white h-12 text-base"
        size="lg"
      >
        {status === "creating" ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Sparkles className="w-5 h-5" />
        )}
        {status === "creating" ? t("processing") : t("payNow")}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        {t("securedBy")}
      </p>
    </div>
  )
}

"use client"

import { useEffect, useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import { Pencil, CreditCard, Check, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"

interface Plan {
  id: string
  name: string
  maxEmails: number
  maxExpiryHours: number | null
  priceCents: number | null
  durationDays: number
  createdAt: string
  userCount: number
}

const ROLE_PLANS = [
  {
    role: "civilian",
    label: "Free",
    sublabel: "Civilian",
    badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    borderClass: "border-blue-200 dark:border-blue-800",
    features: [
      { key: "email", label: "3 Emails max", available: true },
      { key: "expiry", label: "Max 72h expiry", available: true },
      { key: "send", label: "Send Email (2/day)", available: true },
      { key: "webhook", label: "Webhook", available: false },
      { key: "apikey", label: "API Key", available: false },
    ],
  },
  {
    role: "knight",
    label: "Premium",
    sublabel: "Knight",
    badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    borderClass: "border-amber-400 dark:border-amber-500",
    features: [
      { key: "email", label: "Unlimited Emails", available: true },
      { key: "expiry", label: "Permanent Email", available: true },
      { key: "send", label: "Send Email (5/day)", available: true },
      { key: "webhook", label: "Webhook", available: true },
      { key: "apikey", label: "API Key", available: true },
    ],
  },
]

function formatPrice(price: number, currency: string) {
  if (currency === "idr") {
    return `Rp ${price.toLocaleString("id-ID")}`
  }
  return `$${(price / 100).toFixed(2)}`
}

function parsePlanName(name: string): { role: string; currency: string } | null {
  const match = name.match(/^(civilian|knight|duke)_(idr|usd)$/)
  return match ? { role: match[1], currency: match[2] } : null
}

export function PlansContent() {
  const t = useTranslations("admin.plans")
  const tc = useTranslations("admin.common")
  const { toast } = useToast()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editRole, setEditRole] = useState<string | null>(null)
  const [editPlan, setEditPlan] = useState<Plan | null>(null)
  const [formPrice, setFormPrice] = useState(0)
  const [formCurrency, setFormCurrency] = useState("idr")
  const [formDurationDays, setFormDurationDays] = useState(30)
  const [saving, setSaving] = useState(false)

  const fetchPlans = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/plans")
      const json = (await res.json()) as { plans: Plan[] }
      setPlans(json.plans || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPlans() }, [fetchPlans])

  const getPlanForRole = (role: string): Plan | null => {
    return plans.find(p => parsePlanName(p.name)?.role === role) ?? null
  }

  const openEdit = (role: string) => {
    const plan = getPlanForRole(role)
    setEditRole(role)
    setEditPlan(plan)
    if (plan) {
      const parsed = parsePlanName(plan.name)
      setFormCurrency(parsed?.currency ?? "idr")
      setFormPrice(plan.priceCents ?? 0)
      setFormDurationDays(plan.durationDays ?? 30)
    } else {
      setFormCurrency("idr")
      setFormPrice(0)
      setFormDurationDays(30)
    }
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!editRole) return
    setSaving(true)
    const newName = `${editRole}_${formCurrency}`
    try {
      if (editPlan) {
        const res = await fetch("/api/admin/plans", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editPlan.id, name: newName, priceCents: formPrice, durationDays: formDurationDays }),
        })
        if (!res.ok) {
          const err = (await res.json()) as { error: string }
          toast({ title: t("saveFailed"), description: err.error, variant: "destructive" })
          return
        }
      } else {
        const res = await fetch("/api/admin/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName, maxEmails: 999, maxExpiryHours: null, priceCents: formPrice, durationDays: formDurationDays }),
        })
        if (!res.ok) {
          const err = (await res.json()) as { error: string }
          toast({ title: t("saveFailed"), description: err.error, variant: "destructive" })
          return
        }
      }
      toast({ title: t("saveSuccess") })
      setShowModal(false)
      await fetchPlans()
    } catch (e) {
      console.error(e)
      toast({ title: t("saveFailed"), variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">{t("title")}</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ROLE_PLANS.map((rolePlan) => {
            const plan = getPlanForRole(rolePlan.role)
            const parsed = plan ? parsePlanName(plan.name) : null
            const currency = parsed?.currency ?? "idr"
            const price = plan?.priceCents ?? null

            return (
              <div
                key={rolePlan.role}
                className={`rounded-xl border-2 ${rolePlan.borderClass} bg-card p-5 shadow-sm space-y-4`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${rolePlan.badgeClass}`}>
                      {rolePlan.label}
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">Role: {rolePlan.sublabel}</p>
                    {plan && (
                      <p className="text-xs text-muted-foreground">{plan.userCount} users</p>
                    )}
                  </div>
                  <button
                    onClick={() => openEdit(rolePlan.role)}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors"
                    title="Edit pricing"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  {rolePlan.features.map((f) => (
                    <div key={f.key} className="flex items-center gap-2 text-sm">
                      {f.available ? (
                        <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className={f.available ? "" : "text-muted-foreground/50 line-through"}>
                        {f.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="bg-muted/50 rounded-lg px-3 py-2">
                  <p className="text-xs text-muted-foreground mb-0.5">Price</p>
                  {price !== null ? (
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-base">
                        {price === 0 ? "Free" : formatPrice(price, currency)}
                      </p>
                      <span className="text-xs bg-background border rounded px-1.5 py-0.5 uppercase font-medium">
                        {currency}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Not configured</p>
                  )}
                </div>
                {plan && (
                  <div className="bg-muted/30 rounded-lg px-3 py-2">
                    <p className="text-xs text-muted-foreground mb-0.5">Duration</p>
                    <p className="font-medium text-sm">{plan.durationDays ?? 30} days / renewal</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Set Price — {editRole ? ROLE_PLANS.find(r => r.role === editRole)?.label : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1">Currency</label>
              <div className="flex gap-2">
                {["idr", "usd"].map((cur) => (
                  <button
                    key={cur}
                    onClick={() => setFormCurrency(cur)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      formCurrency === cur
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    {cur.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">
                Price {formCurrency === "idr" ? "(Rupiah, e.g. 50000)" : "(USD cents, e.g. 999 = $9.99)"}
              </label>
              <input
                type="number"
                value={formPrice}
                onChange={(e) => setFormPrice(parseInt(e.target.value) || 0)}
                className="w-full p-2 rounded-lg border bg-background text-sm"
                min={0}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formPrice === 0 ? "Free (0 = free)" : `Preview: ${formatPrice(formPrice, formCurrency)}`}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">
                Duration (days per billing cycle)
              </label>
              <input
                type="number"
                value={formDurationDays}
                onChange={(e) => setFormDurationDays(parseInt(e.target.value) || 30)}
                className="w-full p-2 rounded-lg border bg-background text-sm"
                min={1}
              />
              <p className="text-xs text-muted-foreground mt-1">
                How many days until the plan expires/renews (default: 30)
              </p>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-sm rounded-lg border hover:bg-muted"
            >
              {tc("cancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? t("saving") : tc("save")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

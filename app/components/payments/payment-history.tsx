"use client"

import { useEffect, useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import { Receipt, ChevronLeft, ChevronRight } from "lucide-react"

interface Payment {
  id: string
  invoiceNumber: string
  amount: number
  currency: string
  status: string
  paymentMethod: string | null
  planName: string
  createdAt: string
  paidAt: string | null
}

interface PaymentsResponse {
  payments: Payment[]
  total: number
  page: number
  totalPages: number
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  PAID: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  EXPIRED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  FAILED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
}

function formatAmount(amount: number, currency: string): string {
  if (currency === "IDR") return `Rp ${amount.toLocaleString("id-ID")}`
  return `$${(amount / 100).toFixed(2)}`
}

export function PaymentHistory() {
  const t = useTranslations("checkout.history")
  const [data, setData] = useState<PaymentsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/payment/history?page=${page}`)
      if (res.ok) {
        const json = await res.json() as PaymentsResponse
        setData(json)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  const STATUS_LABELS: Record<string, string> = {
    PENDING: t("statusPending"),
    PAID: t("statusPaid"),
    EXPIRED: t("statusExpired"),
    FAILED: t("statusFailed"),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Receipt className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">{t("title")}</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : !data || data.payments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{t("noPayments")}</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium">{t("invoice")}</th>
                    <th className="text-left px-4 py-3 font-medium">{t("plan")}</th>
                    <th className="text-left px-4 py-3 font-medium">{t("amount")}</th>
                    <th className="text-left px-4 py-3 font-medium">{t("method")}</th>
                    <th className="text-left px-4 py-3 font-medium">{t("status")}</th>
                    <th className="text-left px-4 py-3 font-medium">{t("date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.map((p) => (
                    <tr key={p.id} className="border-b last:border-b-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs">{p.invoiceNumber}</td>
                      <td className="px-4 py-3 capitalize">{p.planName.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3 font-medium">{formatAmount(p.amount, p.currency)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.paymentMethod || "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status] || ""}`}>
                          {STATUS_LABELS[p.status] || p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile card view */}
          <div className="md:hidden space-y-3">
            {data.payments.map((p) => (
              <div key={p.id} className="border rounded-lg p-4 bg-card space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status] || ""}`}>
                    {STATUS_LABELS[p.status] || p.status}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="font-mono text-xs">{p.invoiceNumber}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize text-muted-foreground">{p.planName.replace(/_/g, " ")}</span>
                  <span className="font-medium">{formatAmount(p.amount, p.currency)}</span>
                </div>
                {p.paymentMethod && <p className="text-xs text-muted-foreground">{p.paymentMethod}</p>}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-muted-foreground">
            {t("page", { page, totalPages: data.totalPages })}
          </span>
          <button
            onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
            disabled={page >= data.totalPages}
            className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

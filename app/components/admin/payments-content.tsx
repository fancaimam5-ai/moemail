"use client"

import { useEffect, useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import { Receipt, Search, ChevronLeft, ChevronRight } from "lucide-react"

interface AdminPayment {
  id: string
  invoiceNumber: string
  amount: number
  currency: string
  status: string
  paymentMethod: string | null
  planName: string
  userId: string
  userName: string
  userEmail: string
  createdAt: string
  paidAt: string | null
}

interface PaymentsResponse {
  payments: AdminPayment[]
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

export function PaymentsContent() {
  const t = useTranslations("admin.payments")
  const tc = useTranslations("admin.common")
  const [payments, setPayments] = useState<AdminPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("")

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" })
      if (search) params.set("search", search)
      if (filterStatus) params.set("status", filterStatus)

      const res = await fetch(`/api/admin/payments?${params}`)
      const json = (await res.json()) as PaymentsResponse
      setPayments(json.payments || [])
      setTotalPages(json.totalPages || 1)
      setTotal(json.total || 0)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [page, search, filterStatus])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Receipt className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <span className="text-sm text-muted-foreground ml-2">({total})</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full pl-9 pr-3 py-2 border rounded-lg bg-background text-sm"
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select
          className="px-3 py-2 border rounded-lg bg-background text-sm"
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
        >
          <option value="">{t("filterStatus")}</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="EXPIRED">Expired</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {loading ? (
        <div className="text-muted-foreground text-sm">{tc("loading")}</div>
      ) : payments.length === 0 ? (
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
                    <th className="text-left px-4 py-3 font-medium">{t("user")}</th>
                    <th className="text-left px-4 py-3 font-medium">{t("plan")}</th>
                    <th className="text-left px-4 py-3 font-medium">{t("amount")}</th>
                    <th className="text-left px-4 py-3 font-medium">{t("method")}</th>
                    <th className="text-left px-4 py-3 font-medium">{t("status")}</th>
                    <th className="text-left px-4 py-3 font-medium">{t("date")}</th>
                    <th className="text-left px-4 py-3 font-medium">{t("paidAt")}</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b last:border-b-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs">{p.invoiceNumber}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm">{p.userName}</div>
                        <div className="text-xs text-muted-foreground">{p.userEmail}</div>
                      </td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">{p.planName.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3 font-medium">{formatAmount(p.amount, p.currency)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.paymentMethod || "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status] || ""}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                        {new Date(p.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {p.paidAt ? new Date(p.paidAt).toLocaleString() : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {payments.map((p) => (
              <div key={p.id} className="border rounded-lg p-4 bg-card space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status] || ""}`}>
                    {p.status}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="font-mono text-xs">{p.invoiceNumber}</p>
                <p className="text-sm">{p.userName} <span className="text-xs text-muted-foreground">({p.userEmail})</span></p>
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize text-muted-foreground">{p.planName.replace(/_/g, " ")}</span>
                  <span className="font-medium">{formatAmount(p.amount, p.currency)}</span>
                </div>
                {p.paymentMethod && <p className="text-xs text-muted-foreground">{p.paymentMethod}</p>}
                {p.paidAt && (
                  <p className="text-xs text-muted-foreground">{t("paidAt")}: {new Date(p.paidAt).toLocaleString()}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-muted-foreground">
            {t("page", { page, totalPages, total })}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

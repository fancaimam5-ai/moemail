"use client"

import { useEffect, useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import { FileText, Search, ChevronLeft, ChevronRight } from "lucide-react"

interface DeliveryLog {
  id: string
  providerId: string | null
  providerLabel: string | null
  emailType: string
  toAddress: string
  subject: string | null
  status: string
  statusCode: number | null
  providerMessageId: string | null
  errorMessage: string | null
  attemptNumber: number
  createdAt: string
}

interface LogsResponse {
  logs: DeliveryLog[]
  total: number
  page: number
  limit: number
  totalPages: number
}

const STATUS_COLORS: Record<string, string> = {
  sent: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  bounced: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
}

const TYPE_LABELS: Record<string, string> = {
  verify: "Verify",
  reset: "Reset",
  magic_link: "Magic Link",
  notif_quota: "Quota",
  notif_security: "Security",
  notif_premium: "Premium",
  test: "Test",
}

export function DeliveryLogsContent() {
  const t = useTranslations("admin.deliveryLogs")
  const tc = useTranslations("admin.common")
  const [logs, setLogs] = useState<DeliveryLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("")
  const [filterStatus, setFilterStatus] = useState("")

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" })
      if (search) params.set("search", search)
      if (filterType) params.set("type", filterType)
      if (filterStatus) params.set("status", filterStatus)

      const res = await fetch(`/api/admin/delivery-logs?${params}`)
      const json = (await res.json()) as LogsResponse
      setLogs(json.logs || [])
      setTotalPages(json.totalPages || 1)
      setTotal(json.total || 0)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [page, search, filterType, filterStatus])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="w-6 h-6 text-primary" />
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
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1) }}
        >
          <option value="">{t("allTypes")}</option>
          <option value="verify">Verify</option>
          <option value="reset">Reset</option>
          <option value="magic_link">Magic Link</option>
          <option value="notif_quota">Quota</option>
          <option value="notif_security">Security</option>
          <option value="notif_premium">Premium</option>
          <option value="test">Test</option>
        </select>
        <select
          className="px-3 py-2 border rounded-lg bg-background text-sm"
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
        >
          <option value="">{t("allStatuses")}</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
          <option value="bounced">Bounced</option>
        </select>
      </div>

      {loading ? (
        <div className="text-muted-foreground text-sm">{tc("loading")}</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{t("noLogs")}</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium">{t("time")}</th>
                    <th className="text-left px-4 py-3 font-medium">{t("type")}</th>
                    <th className="text-left px-4 py-3 font-medium">{t("to")}</th>
                    <th className="text-left px-4 py-3 font-medium">{t("provider")}</th>
                    <th className="text-left px-4 py-3 font-medium">{t("status")}</th>
                    <th className="text-left px-4 py-3 font-medium">{t("detail")}</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b last:border-b-0 hover:bg-muted/30">
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-muted px-2 py-0.5 rounded text-xs font-medium">
                          {TYPE_LABELS[log.emailType] || log.emailType}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs max-w-[200px] truncate">
                        {log.toAddress}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {log.providerLabel || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[log.status] || ""}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                        {log.errorMessage || log.providerMessageId || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile card view */}
          <div className="md:hidden space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="border rounded-lg p-4 bg-card space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-muted px-2 py-0.5 rounded text-xs font-medium">
                      {TYPE_LABELS[log.emailType] || log.emailType}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[log.status] || ""}`}>
                      {log.status}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="font-mono text-xs text-foreground truncate">{log.toAddress}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{log.providerLabel || "-"}</span>
                  {(log.errorMessage || log.providerMessageId) && (
                    <span className={`truncate ${log.errorMessage ? "text-red-500" : ""}`}>
                      · {log.errorMessage || log.providerMessageId}
                    </span>
                  )}
                </div>
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
            {page} / {totalPages}
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

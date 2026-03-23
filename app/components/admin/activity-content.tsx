"use client"

import { useEffect, useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import { ChevronLeft, ChevronRight, Activity } from "lucide-react"

interface ActivityItem {
  id: string
  adminId: string
  adminName: string | null
  action: string
  targetType: string | null
  targetId: string | null
  detail: Record<string, unknown> | null
  createdAt: string
}

interface ActivityResponse {
  activities: ActivityItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

const ACTION_COLORS: Record<string, string> = {
  suspend_user: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  unsuspend_user: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  change_role: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  delete_email: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  create_plan: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  update_plan: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  delete_plan: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

const ACTION_TYPES = [
  "suspend_user", "unsuspend_user", "change_role",
  "delete_email", "create_plan", "update_plan", "delete_plan",
]

export function ActivityContent() {
  const t = useTranslations("admin.activity")
  const tc = useTranslations("admin.common")
  const [data, setData] = useState<ActivityResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [filterAction, setFilterAction] = useState("")

  const fetchActivity = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "30" })
      if (filterAction) params.set("action", filterAction)
      const res = await fetch(`/api/admin/activity?${params}`)
      setData((await res.json()) as ActivityResponse)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [page, filterAction])

  useEffect(() => { fetchActivity() }, [fetchActivity])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <select
          value={filterAction}
          onChange={(e) => { setFilterAction(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-lg border bg-background text-sm w-full sm:w-auto"
        >
          <option value="">{t("filterAction")}</option>
          {ACTION_TYPES.map(a => <option key={a} value={a}>{a.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">{tc("loading")}</div>
        ) : data?.activities.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            {t("noActivity")}
          </div>
        ) : (
          <div className="divide-y">
            {data?.activities.map((item) => (
              <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      ACTION_COLORS[item.action] || "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                    }`}>
                      {item.action.replace(/_/g, " ")}
                    </span>
                    {item.targetType && (
                      <span className="text-xs text-muted-foreground">
                        {tc("on")} {item.targetType} {item.targetId ? `#${item.targetId.slice(0, 8)}` : ""}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {item.adminName || item.adminId.slice(0, 8)}
                  </p>
                  {item.detail && (
                    <p className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 inline-block">
                      {Object.entries(item.detail).map(([k, v]) => `${k}: ${v}`).join(", ")}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(item.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {t("page", { page: data.page, totalPages: data.totalPages })}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border hover:bg-muted disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages}
              className="px-3 py-1.5 rounded-lg border hover:bg-muted disabled:opacity-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

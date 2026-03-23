"use client"

import { useEffect, useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import { Search, ChevronLeft, ChevronRight, Trash2, Mail } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { StatusBadge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface EmailItem {
  id: string
  address: string
  userId: string | null
  guestSessionId: string | null
  createdAt: string
  expiresAt: string
  messageCount: number
}

interface EmailsResponse {
  emails: EmailItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export function EmailsContent() {
  const t = useTranslations("admin.emails")
  const tc = useTranslations("admin.common")
  const { toast } = useToast()
  const [data, setData] = useState<EmailsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [filterDomain, setFilterDomain] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EmailItem | null>(null)

  const fetchEmails = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" })
      if (search) params.set("search", search)
      if (filterDomain) params.set("domain", filterDomain)
      if (filterStatus) params.set("status", filterStatus)
      const res = await fetch(`/api/admin/emails?${params}`)
      setData((await res.json()) as EmailsResponse)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [page, search, filterDomain, filterStatus])

  useEffect(() => { fetchEmails() }, [fetchEmails])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(deleteTarget.id)
    try {
      const res = await fetch(`/api/admin/emails?id=${deleteTarget.id}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: t("deleteSuccess") })
        await fetchEmails()
      } else {
        toast({ title: t("deleteFailed"), variant: "destructive" })
      }
    } catch (e) {
      console.error(e)
      toast({ title: t("deleteFailed"), variant: "destructive" })
    } finally {
      setDeleting(null)
      setDeleteTarget(null)
    }
  }

  const isExpired = (expiresAt: string) => new Date(expiresAt).getTime() < Date.now()

  // Extract unique domains from loaded data
  const domains = data ? [...new Set(data.emails.map(e => e.address.split("@")[1]).filter(Boolean))] : []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        {domains.length > 0 && (
          <select
            value={filterDomain}
            onChange={(e) => { setFilterDomain(e.target.value); setPage(1) }}
            className="px-3 py-2 rounded-lg border bg-background text-sm"
          >
            <option value="">{t("filterDomain")}</option>
            {domains.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        )}
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-lg border bg-background text-sm"
        >
          <option value="">{t("filterStatus")}</option>
          <option value="active">{t("statusActive")}</option>
          <option value="expired">{t("statusExpired")}</option>
        </select>
      </div>

      {/* Desktop Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-x-auto hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">{t("address")}</th>
              <th className="text-left p-3 font-medium">{t("owner")}</th>
              <th className="text-left p-3 font-medium">{t("status")}</th>
              <th className="text-left p-3 font-medium">{t("created")}</th>
              <th className="text-left p-3 font-medium">{t("expires")}</th>
              <th className="text-right p-3 font-medium">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{tc("loading")}</td></tr>
            ) : data?.emails.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{t("noEmails")}</td></tr>
            ) : (
              data?.emails.map((email) => (
                <tr key={email.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-mono text-xs truncate max-w-[200px]">{email.address}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      email.userId
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                    }`}>
                      {email.userId ? "User" : t("guest")}
                    </span>
                  </td>
                  <td className="p-3">
                    <StatusBadge
                      status={isExpired(email.expiresAt) ? "expired" : "active"}
                      label={isExpired(email.expiresAt) ? t("expired") : t("active")}
                    />
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {new Date(email.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {email.expiresAt ? new Date(email.expiresAt).toLocaleDateString() : t("permanent")}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setDeleteTarget(email)}
                      disabled={deleting === email.id}
                      className="px-2 py-1 text-xs rounded-md border text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3 inline mr-1" />{tc("delete")}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">{tc("loading")}</div>
        ) : data?.emails.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">{t("noEmails")}</div>
        ) : (
          data?.emails.map((email) => (
            <div key={email.id} className="rounded-xl border bg-card p-4 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="font-mono text-xs truncate">{email.address}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  email.userId ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                }`}>{email.userId ? "User" : t("guest")}</span>
                <StatusBadge
                  status={isExpired(email.expiresAt) ? "expired" : "active"}
                  label={isExpired(email.expiresAt) ? t("expired") : t("active")}
                />
                <span className="text-xs text-muted-foreground">{email.messageCount} msg</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{new Date(email.createdAt).toLocaleDateString()}</span>
                <button
                  onClick={() => setDeleteTarget(email)}
                  className="px-2 py-1 text-xs rounded-md border text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-3 h-3 inline mr-1" />{tc("delete")}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {t("page", { page: data.page, totalPages: data.totalPages, total: data.total })}
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

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={t("deleteConfirm")}
        description={t("deleteDescription", { email: deleteTarget?.address ?? "" })}
        confirmLabel={tc("delete")}
        cancelLabel={tc("cancel")}
        onConfirm={handleDelete}
        variant="destructive"
        loading={!!deleting}
      />
    </div>
  )
}

"use client"

import { useEffect, useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import { ChevronLeft, ChevronRight, Trash2, Users } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface GuestSession {
  id: string
  ipHash: string
  emailId: string | null
  createdAt: string
  expiresAt: string
  emailAddress: string | null
  emailCount: number
}

interface GuestsResponse {
  sessions: GuestSession[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export function GuestsContent() {
  const t = useTranslations("admin.guests")
  const tc = useTranslations("admin.common")
  const { toast } = useToast()
  const [data, setData] = useState<GuestsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<GuestSession | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/guests?page=${page}&limit=20`)
      setData((await res.json()) as GuestsResponse)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/guests?id=${deleteTarget.id}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: t("deleteSuccess") })
        await fetchSessions()
      } else {
        toast({ title: t("deleteFailed"), variant: "destructive" })
      }
    } catch {
      toast({ title: t("deleteFailed"), variant: "destructive" })
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("description")}</p>
      </div>

      {/* Desktop Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-x-auto hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">{t("sessionId")}</th>
              <th className="text-left p-3 font-medium">{t("emails")}</th>
              <th className="text-left p-3 font-medium">{t("created")}</th>
              <th className="text-right p-3 font-medium">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">{tc("loading")}</td></tr>
            ) : data?.sessions.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">
                <Users className="w-6 h-6 mx-auto mb-2 opacity-50" />
                {t("noSessions")}
              </td></tr>
            ) : (
              data?.sessions.map((session) => (
                <tr key={session.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <div>
                      <p className="font-mono text-xs">{session.id.slice(0, 12)}...</p>
                      {session.emailAddress && (
                        <p className="text-xs text-muted-foreground mt-0.5">{session.emailAddress}</p>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{session.emailCount}</td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {new Date(session.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setDeleteTarget(session)}
                      className="px-2 py-1 text-xs rounded-md border text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
        ) : data?.sessions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Users className="w-6 h-6 mx-auto mb-2 opacity-50" />
            {t("noSessions")}
          </div>
        ) : (
          data?.sessions.map((session) => (
            <div key={session.id} className="rounded-xl border bg-card p-4 shadow-sm space-y-2">
              <p className="font-mono text-xs">{session.id.slice(0, 20)}...</p>
              {session.emailAddress && (
                <p className="text-xs text-muted-foreground">{session.emailAddress}</p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{session.emailCount} emails &middot; {new Date(session.createdAt).toLocaleDateString()}</span>
                <button
                  onClick={() => setDeleteTarget(session)}
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

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={t("deleteConfirm")}
        description={t("deleteDescription")}
        confirmLabel={tc("delete")}
        cancelLabel={tc("cancel")}
        onConfirm={handleDelete}
        variant="destructive"
        loading={deleting}
      />
    </div>
  )
}

"use client"

import { useEffect, useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import { Plus, Trash2, Globe } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"

interface DomainItem {
  domain: string
  emailCount: number
}

export function DomainsContent() {
  const t = useTranslations("admin.domains")
  const tc = useTranslations("admin.common")
  const { toast } = useToast()
  const [domains, setDomains] = useState<DomainItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newDomain, setNewDomain] = useState("")
  const [adding, setAdding] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchDomains = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/domains")
      const json = (await res.json()) as { domains: DomainItem[] }
      setDomains(json.domains || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDomains() }, [fetchDomains])

  const handleAdd = async () => {
    if (!newDomain.trim()) return
    setAdding(true)
    try {
      const res = await fetch("/api/admin/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: newDomain.trim() }),
      })
      if (res.ok) {
        toast({ title: t("addSuccess") })
        setShowAdd(false)
        setNewDomain("")
        await fetchDomains()
      } else {
        const err = (await res.json()) as { error: string }
        toast({ title: t("addFailed"), description: err.error, variant: "destructive" })
      }
    } catch {
      toast({ title: t("addFailed"), variant: "destructive" })
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/domains?domain=${encodeURIComponent(deleteTarget)}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: t("deleteSuccess") })
        await fetchDomains()
      } else {
        const err = (await res.json()) as { error: string }
        toast({ title: t("deleteFailed"), description: err.error, variant: "destructive" })
      }
    } catch {
      toast({ title: t("deleteFailed"), variant: "destructive" })
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("description")}</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setNewDomain("") }}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> {t("addDomain")}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : domains.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-muted-foreground">{t("noDomains")}</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">{t("domain")}</th>
                <th className="text-left p-3 font-medium">{t("emailCount")}</th>
                <th className="text-left p-3 font-medium">{t("status")}</th>
                <th className="text-right p-3 font-medium">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {domains.map((item) => (
                <tr key={item.domain} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-mono text-sm">{item.domain}</td>
                  <td className="p-3 text-muted-foreground">{item.emailCount}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      {t("active")}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setDeleteTarget(item.domain)}
                      disabled={domains.length <= 1}
                      className="px-2 py-1 text-xs rounded-md border text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3 inline mr-1" />{tc("delete")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Domain Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("addTitle")}</DialogTitle>
          </DialogHeader>
          <input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder={t("domainPlaceholder")}
            className="w-full p-2 rounded-lg border bg-background text-sm font-mono"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <DialogFooter>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-muted">{tc("cancel")}</button>
            <button
              onClick={handleAdd}
              disabled={adding || !newDomain.trim()}
              className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {adding ? t("adding") : t("add")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={t("deleteConfirm")}
        description={t("deleteDescription", { domain: deleteTarget ?? "" })}
        confirmLabel={tc("delete")}
        cancelLabel={tc("cancel")}
        onConfirm={handleDelete}
        variant="destructive"
        loading={deleting}
      />
    </div>
  )
}

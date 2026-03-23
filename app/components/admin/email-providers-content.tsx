"use client"

import { useEffect, useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import { Plus, Pencil, Trash2, Send, Play, Pause, TestTube, Star } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"

interface Provider {
  id: string
  label: string
  providerType: string
  fromEmail: string
  fromName: string
  replyTo: string | null
  priority: number
  status: string
  isDefault: boolean
  lastTestedAt: string | null
  lastTestResult: string | null
  totalSent: number
  totalFailed: number
  relayEndpoint: string | null
  createdAt: string
  updatedAt: string
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  tested: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  active: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  disabled: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
}

export function EmailProvidersContent() {
  const t = useTranslations("admin.emailProviders")
  const tc = useTranslations("admin.common")
  const { toast } = useToast()
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editProvider, setEditProvider] = useState<Provider | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Provider | null>(null)
  const [testing, setTesting] = useState<string | null>(null)

  // Form state
  const [formLabel, setFormLabel] = useState("")
  const [formType, setFormType] = useState("sendgrid")
  const [formApiKey, setFormApiKey] = useState("")
  const [formFromEmail, setFormFromEmail] = useState("")
  const [formFromName, setFormFromName] = useState("IfMail")
  const [formReplyTo, setFormReplyTo] = useState("")
  const [formPriority, setFormPriority] = useState(0)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchProviders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/email-providers")
      const json = (await res.json()) as { providers: Provider[] }
      setProviders(json.providers || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProviders() }, [fetchProviders])

  const openCreate = () => {
    setEditProvider(null)
    setFormLabel("")
    setFormType("sendgrid")
    setFormApiKey("")
    setFormFromEmail("")
    setFormFromName("IfMail")
    setFormReplyTo("")
    setFormPriority(0)
    setShowModal(true)
  }

  const openEdit = (p: Provider) => {
    setEditProvider(p)
    setFormLabel(p.label)
    setFormType(p.providerType)
    setFormApiKey("") // Don't show existing key
    setFormFromEmail(p.fromEmail)
    setFormFromName(p.fromName)
    setFormReplyTo(p.replyTo || "")
    setFormPriority(p.priority)
    setShowModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        label: formLabel,
        providerType: formType,
        fromEmail: formFromEmail,
        fromName: formFromName,
        replyTo: formReplyTo || undefined,
        priority: formPriority,
      }
      if (formApiKey) body.apiKey = formApiKey

      const res = editProvider
        ? await fetch("/api/admin/email-providers", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: editProvider.id, ...body }),
          })
        : await fetch("/api/admin/email-providers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })

      if (!res.ok) {
        const err = (await res.json()) as { error: string }
        toast({ title: t("saveFailed"), description: err.error, variant: "destructive" })
        return
      }
      toast({ title: t("saveSuccess") })
      setShowModal(false)
      await fetchProviders()
    } catch (e) {
      console.error(e)
      toast({ title: t("saveFailed"), variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/email-providers?id=${deleteTarget.id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = (await res.json()) as { error: string }
        toast({ title: tc("deleteFailed"), description: err.error, variant: "destructive" })
        return
      }
      toast({ title: tc("deleteSuccess") })
      setDeleteTarget(null)
      await fetchProviders()
    } catch {
      toast({ title: tc("deleteFailed"), variant: "destructive" })
    } finally {
      setDeleting(false)
    }
  }

  const handleAction = async (id: string, action: "test" | "activate" | "disable" | "set_default") => {
    if (action === "test") setTesting(id)
    try {
      const res = await fetch("/api/admin/email-providers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      })
      const json = (await res.json()) as { result?: { success: boolean; error?: string }; error?: string }

      if (action === "test") {
        if (json.result?.success) {
          toast({ title: t("testSuccess") })
        } else {
          toast({ title: t("testFailed"), description: json.result?.error || json.error, variant: "destructive" })
        }
      } else {
        if (res.ok) {
          toast({ title: t("actionSuccess") })
        } else {
          toast({ title: t("actionFailed"), description: json.error, variant: "destructive" })
        }
      }
      await fetchProviders()
    } catch {
      toast({ title: t("actionFailed"), variant: "destructive" })
    } finally {
      if (action === "test") setTesting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Send className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">{t("title")}</h1>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          {t("addProvider")}
        </button>
      </div>

      {loading ? (
        <div className="text-muted-foreground text-sm">{tc("loading")}</div>
      ) : providers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Send className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{t("noProviders")}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {providers.map((p) => (
            <div key={p.id} className="border rounded-lg p-4 bg-card">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{p.label}</h3>
                    {p.isDefault && (
                      <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        <Star className="w-3 h-3" />
                        {t("default")}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status] || STATUS_COLORS.draft}`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {p.providerType} &middot; {p.fromEmail} &middot; {t("priority")}: {p.priority}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("sent")}: {p.totalSent} &middot; {t("failed")}: {p.totalFailed}
                    {p.lastTestedAt && ` · ${t("lastTest")}: ${new Date(p.lastTestedAt).toLocaleString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleAction(p.id, "test")}
                    disabled={testing === p.id}
                    className="p-2 rounded-lg hover:bg-muted transition-colors text-blue-600 dark:text-blue-400"
                    title={t("test")}
                  >
                    <TestTube className={`w-4 h-4 ${testing === p.id ? "animate-pulse" : ""}`} />
                  </button>
                  {(p.status === "tested" || p.status === "disabled") && (
                    <button
                      onClick={() => handleAction(p.id, "activate")}
                      className="p-2 rounded-lg hover:bg-muted transition-colors text-green-600 dark:text-green-400"
                      title={t("activate")}
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  {p.status === "active" && (
                    <button
                      onClick={() => handleAction(p.id, "disable")}
                      className="p-2 rounded-lg hover:bg-muted transition-colors text-yellow-600 dark:text-yellow-400"
                      title={t("disable")}
                    >
                      <Pause className="w-4 h-4" />
                    </button>
                  )}
                  {!p.isDefault && p.status === "active" && (
                    <button
                      onClick={() => handleAction(p.id, "set_default")}
                      className="p-2 rounded-lg hover:bg-muted transition-colors text-primary"
                      title={t("setDefault")}
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(p)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    title={tc("edit")}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(p)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors text-destructive"
                    title={tc("delete")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editProvider ? t("editProvider") : t("addProvider")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">{t("label")}</label>
              <input
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background text-sm"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder="e.g. SendGrid Production"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t("providerType")}</label>
              <select
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background text-sm"
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
              >
                <option value="sendgrid">SendGrid</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">{t("apiKey")}</label>
              <input
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background text-sm font-mono"
                type="password"
                value={formApiKey}
                onChange={(e) => setFormApiKey(e.target.value)}
                placeholder={editProvider ? t("apiKeyPlaceholderEdit") : t("apiKeyPlaceholder")}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">{t("fromEmail")}</label>
                <input
                  className="w-full mt-1 px-3 py-2 border rounded-lg bg-background text-sm"
                  value={formFromEmail}
                  onChange={(e) => setFormFromEmail(e.target.value)}
                  placeholder="noreply@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t("fromName")}</label>
                <input
                  className="w-full mt-1 px-3 py-2 border rounded-lg bg-background text-sm"
                  value={formFromName}
                  onChange={(e) => setFormFromName(e.target.value)}
                  placeholder="IfMail"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">{t("replyTo")}</label>
                <input
                  className="w-full mt-1 px-3 py-2 border rounded-lg bg-background text-sm"
                  value={formReplyTo}
                  onChange={(e) => setFormReplyTo(e.target.value)}
                  placeholder={t("replyToPlaceholder")}
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t("priority")}</label>
                <input
                  className="w-full mt-1 px-3 py-2 border rounded-lg bg-background text-sm"
                  type="number"
                  min={0}
                  value={formPriority}
                  onChange={(e) => setFormPriority(parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground mt-1">{t("priorityHint")}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-muted transition-colors"
            >
              {tc("cancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !formLabel || !formFromEmail}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? tc("saving") : tc("save")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={tc("confirmDelete")}
        description={`${t("deleteConfirm")} "${deleteTarget?.label}"?`}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}

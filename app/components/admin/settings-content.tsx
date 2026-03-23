"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { useToast } from "@/components/ui/use-toast"
import { Settings } from "lucide-react"

interface SettingsData {
  defaultRole: string
  emailDomains: string
  adminContact: string
  maxEmails: string
  turnstile: { enabled: boolean; siteKey: string; hasSecretKey: boolean }
  allowedEmailDomains: string
  siteUrl: string
  hasEncryptionKey: boolean
  doku: { clientId: string; hasSecretKey: boolean }
  freeDomains: string
  hasCronSecret: boolean
}

export function SettingsContent() {
  const t = useTranslations("admin.settings")
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<SettingsData>({
    defaultRole: "civilian",
    emailDomains: "ifmail.email",
    adminContact: "",
    maxEmails: "30",
    turnstile: { enabled: false, siteKey: "", hasSecretKey: false },
    allowedEmailDomains: "",
    siteUrl: "",
    hasEncryptionKey: false,
    doku: { clientId: "", hasSecretKey: false },
    freeDomains: "",
    hasCronSecret: false,
  })
  const [newEncryptionKey, setNewEncryptionKey] = useState("")
  const [newDokuSecretKey, setNewDokuSecretKey] = useState("")
  const [newTurnstileSecretKey, setNewTurnstileSecretKey] = useState("")
  const [newCronSecret, setNewCronSecret] = useState("")

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(r => r.json() as Promise<SettingsData>)
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          emailEncryptionKey: newEncryptionKey || undefined,
          turnstile: {
            enabled: data.turnstile.enabled,
            siteKey: data.turnstile.siteKey,
            secretKey: newTurnstileSecretKey || undefined,
          },
          doku: {
            clientId: data.doku.clientId,
            secretKey: newDokuSecretKey || undefined,
          },
          cronSecret: newCronSecret || undefined,
        }),
      })
      if (res.ok) {
        toast({ title: t("saveSuccess") })
      } else {
        const err = (await res.json()) as { error: string }
        toast({ title: t("saveFailed"), description: err.error, variant: "destructive" })
      }
    } catch {
      toast({ title: t("saveFailed"), variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("description")}</p>
      </div>

      <div className="space-y-6">
        {/* Email Domains */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
          <div>
            <label className="text-sm font-medium">{t("emailDomains")}</label>
            <p className="text-xs text-muted-foreground">{t("emailDomainsDescription")}</p>
          </div>
          <input
            type="text"
            value={data.emailDomains}
            onChange={(e) => setData({ ...data, emailDomains: e.target.value })}
            className="w-full p-2 rounded-lg border bg-background text-sm font-mono"
          />
        </div>

        {/* Default Role */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
          <div>
            <label className="text-sm font-medium">{t("defaultRole")}</label>
            <p className="text-xs text-muted-foreground">{t("defaultRoleDescription")}</p>
          </div>
          <select
            value={data.defaultRole}
            onChange={(e) => setData({ ...data, defaultRole: e.target.value })}
            className="w-full p-2 rounded-lg border bg-background text-sm"
          >
            <option value="duke">Duke</option>
            <option value="knight">Knight</option>
            <option value="civilian">Civilian</option>
          </select>
        </div>

        {/* Max Emails */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
          <div>
            <label className="text-sm font-medium">{t("maxEmails")}</label>
            <p className="text-xs text-muted-foreground">{t("maxEmailsDescription")}</p>
          </div>
          <input
            type="number"
            value={data.maxEmails}
            onChange={(e) => setData({ ...data, maxEmails: e.target.value })}
            className="w-full p-2 rounded-lg border bg-background text-sm"
            min={1}
          />
        </div>

        {/* Free Domains */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
          <div>
            <label className="text-sm font-medium">{t("freeDomains")}</label>
            <p className="text-xs text-muted-foreground">{t("freeDomainsDescription")}</p>
          </div>
          <input
            type="text"
            value={data.freeDomains}
            onChange={(e) => setData({ ...data, freeDomains: e.target.value })}
            className="w-full p-2 rounded-lg border bg-background text-sm font-mono"
            placeholder="ifshop.my.id, panelbotif.my.id"
          />
        </div>

        {/* Admin Contact */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
          <div>
            <label className="text-sm font-medium">{t("adminContact")}</label>
            <p className="text-xs text-muted-foreground">{t("adminContactDescription")}</p>
          </div>
          <input
            type="text"
            value={data.adminContact}
            onChange={(e) => setData({ ...data, adminContact: e.target.value })}
            className="w-full p-2 rounded-lg border bg-background text-sm"
          />
        </div>

        {/* Email Outbound Settings */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
          <div>
            <label className="text-sm font-medium">{t("siteUrl")}</label>
            <p className="text-xs text-muted-foreground">{t("siteUrlDescription")}</p>
          </div>
          <input
            type="text"
            value={data.siteUrl}
            onChange={(e) => setData({ ...data, siteUrl: e.target.value })}
            className="w-full p-2 rounded-lg border bg-background text-sm font-mono"
            placeholder="https://your-domain.com"
          />
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
          <div>
            <label className="text-sm font-medium">{t("encryptionKey")}</label>
            <p className="text-xs text-muted-foreground">
              {t("encryptionKeyDescription")}
              {data.hasEncryptionKey && (
                <span className="ml-2 text-green-600 dark:text-green-400 font-medium">✓ Configured</span>
              )}
            </p>
          </div>
          <input
            type="password"
            value={newEncryptionKey}
            onChange={(e) => setNewEncryptionKey(e.target.value)}
            className="w-full p-2 rounded-lg border bg-background text-sm font-mono"
            placeholder={data.hasEncryptionKey ? "Leave blank to keep current key" : "64 hex characters"}
          />
          <button
            type="button"
            onClick={() => {
              const bytes = new Uint8Array(32)
              crypto.getRandomValues(bytes)
              setNewEncryptionKey(Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join(""))
            }}
            className="text-xs text-primary hover:underline"
          >
            {t("generateKey")}
          </button>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
          <div>
            <label className="text-sm font-medium">{t("allowedEmailDomains")}</label>
            <p className="text-xs text-muted-foreground">{t("allowedEmailDomainsDescription")}</p>
          </div>
          <textarea
            value={data.allowedEmailDomains}
            onChange={(e) => setData({ ...data, allowedEmailDomains: e.target.value })}
            className="w-full p-2 rounded-lg border bg-background text-sm font-mono h-24"
            placeholder='["gmail.com", "outlook.com", "yahoo.com"]'
          />
        </div>

        {/* DOKU Payment Gateway */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
          <div>
            <label className="text-sm font-medium">{t("doku")}</label>
            <p className="text-xs text-muted-foreground">{t("dokuDescription")}</p>
          </div>
          <div className="space-y-2">
            <div>
              <label className="text-xs font-medium block mb-1">{t("dokuClientId")}</label>
              <input
                type="text"
                value={data.doku.clientId}
                onChange={(e) => setData({ ...data, doku: { ...data.doku, clientId: e.target.value } })}
                className="w-full p-2 rounded-lg border bg-background text-sm font-mono"
                placeholder="MCH-xxxx-xxxxxxxxxx"
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">
                {t("dokuSecretKey")}
                {data.doku.hasSecretKey && (
                  <span className="ml-2 text-green-600 dark:text-green-400 font-medium">✓ Configured</span>
                )}
              </label>
              <input
                type="password"
                value={newDokuSecretKey}
                onChange={(e) => setNewDokuSecretKey(e.target.value)}
                className="w-full p-2 rounded-lg border bg-background text-sm font-mono"
                placeholder={data.doku.hasSecretKey ? "Leave blank to keep current key" : "SK-xxxx"}
              />
            </div>
          </div>
        </div>

        {/* Cron Secret */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
          <div>
            <label className="text-sm font-medium">
              {t("cronSecret")}
              {data.hasCronSecret && (
                <span className="ml-2 text-green-600 dark:text-green-400 font-medium">✓ Configured</span>
              )}
            </label>
            <p className="text-xs text-muted-foreground">{t("cronSecretDescription")}</p>
          </div>
          <input
            type="password"
            value={newCronSecret}
            onChange={(e) => setNewCronSecret(e.target.value)}
            className="w-full p-2 rounded-lg border bg-background text-sm font-mono"
            placeholder={data.hasCronSecret ? "Leave blank to keep current secret" : "Enter cron secret"}
          />
        </div>

        {/* Turnstile */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">          <div>
            <label className="text-sm font-medium">{t("turnstile")}</label>
            <p className="text-xs text-muted-foreground">{t("turnstileDescription")}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setData({ ...data, turnstile: { ...data.turnstile, enabled: !data.turnstile.enabled } })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                data.turnstile.enabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                data.turnstile.enabled ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
            <span className="text-sm">{data.turnstile.enabled ? t("turnstileEnabled") : t("turnstileDisabled")}</span>
          </div>
          {data.turnstile.enabled && (
            <div className="space-y-2 pt-2">
              <div>
                <label className="text-xs font-medium block mb-1">{t("siteKey")}</label>
                <input
                  type="text"
                  value={data.turnstile.siteKey}
                  onChange={(e) => setData({ ...data, turnstile: { ...data.turnstile, siteKey: e.target.value } })}
                  className="w-full p-2 rounded-lg border bg-background text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">
                  {t("secretKey")}
                  {data.turnstile.hasSecretKey && (
                    <span className="ml-2 text-green-600 dark:text-green-400 font-medium">✓ Configured</span>
                  )}
                </label>
                <input
                  type="password"
                  value={newTurnstileSecretKey}
                  onChange={(e) => setNewTurnstileSecretKey(e.target.value)}
                  className="w-full p-2 rounded-lg border bg-background text-sm font-mono"
                  placeholder={data.turnstile.hasSecretKey ? "Leave blank to keep current key" : "Turnstile Secret Key"}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Settings className="w-4 h-4" />
          {saving ? t("saving") : t("save")}
        </button>
      </div>
    </div>
  )
}

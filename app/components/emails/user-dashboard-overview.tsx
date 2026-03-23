"use client"

import { useEffect, useMemo, useState } from "react"
import { Shield, Crown, Mail, Send, Sparkles, Key, Webhook, Lock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { ROLES, PERMISSIONS, ROLE_PERMISSIONS, type Role } from "@/lib/permissions"
import { useUserRole } from "@/hooks/use-user-role"
import { useSendPermission } from "@/hooks/use-send-permission"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

interface QuotaResponse {
  totalCreated: number
  max: number
  remaining: number
  planName: string
  isPremium: boolean
}

const ROLE_BADGE_CLASS: Record<Role, string> = {
  [ROLES.EMPEROR]: "bg-amber-500/20 text-amber-700 border-amber-400/40 dark:text-amber-400",
  [ROLES.DUKE]: "bg-blue-500/20 text-blue-700 border-blue-400/40 dark:text-blue-400",
  [ROLES.KNIGHT]: "bg-amber-500/20 text-amber-700 border-amber-400/40 dark:text-amber-400",
  [ROLES.CIVILIAN]: "bg-slate-500/20 text-slate-700 border-slate-400/40 dark:text-slate-400",
}

export function UserDashboardOverview() {
  const t = useTranslations("emails.dashboard")
  const { role } = useUserRole()
  const { canSend, loading: sendLoading, remainingEmails } = useSendPermission()
  const [quota, setQuota] = useState<QuotaResponse | null>(null)
  const [quotaLoading, setQuotaLoading] = useState(true)

  const FEATURE_ITEMS = useMemo(() => [
    { key: "manage_email", icon: Mail, label: t("featureEmail"), permission: PERMISSIONS.MANAGE_EMAIL },
    { key: "manage_webhook", icon: Webhook, label: t("featureWebhook"), permission: PERMISSIONS.MANAGE_WEBHOOK },
    { key: "manage_api_key", icon: Key, label: t("featureApiKeys"), permission: PERMISSIONS.MANAGE_API_KEY },
    { key: "send_email", icon: Send, label: t("featureSend"), permission: PERMISSIONS.MANAGE_EMAIL },
  ], [t])

  useEffect(() => {
    let mounted = true
    const loadQuota = async () => {
      setQuotaLoading(true)
      try {
        const res = await fetch("/api/emails/quota")
        if (!res.ok) return
        const data = (await res.json()) as QuotaResponse
        if (mounted) setQuota(data)
      } finally {
        if (mounted) setQuotaLoading(false)
      }
    }
    loadQuota()
    return () => { mounted = false }
  }, [])

  const roleKey = (role ?? ROLES.CIVILIAN).toLowerCase() as "emperor" | "duke" | "knight" | "civilian"
  const roleLabel = t(`roleMeta.${roleKey}.label`)
  const roleTip = t(`roleMeta.${roleKey}.tip`)
  const roleBadgeClass = ROLE_BADGE_CLASS[role ?? ROLES.CIVILIAN]

  const rolePermissions = useMemo(() => {
    if (!role) return []
    return ROLE_PERMISSIONS[role] ?? []
  }, [role])

  const hasPermission = (permission: string) =>
    rolePermissions.includes(permission as any)

  // Show send card only for roles with meaningful send access
  const showSendCard = role === ROLES.EMPEROR || role === ROLES.DUKE || role === ROLES.KNIGHT
  const showApiKeyHint = role === ROLES.EMPEROR || role === ROLES.DUKE || role === ROLES.KNIGHT
  const showWebhookHint = role === ROLES.EMPEROR || role === ROLES.DUKE || role === ROLES.KNIGHT

  const quotaLabel = useMemo(() => {
    if (!quota) return "-"
    if (quota.max === -1) return t("unlimited")
    return `${quota.totalCreated} / ${quota.max}`
  }, [quota, t])

  const remainingLabel = useMemo(() => {
    if (!quota) return "-"
    if (quota.remaining === -1) return t("unlimited")
    return String(quota.remaining)
  }, [quota, t])

  const gridClass = cn(
    "grid gap-3 shrink-0",
    "grid-cols-2 xl:grid-cols-4"
  )

  return (
    <div className={gridClass}>
      {/* Role Card */}
      <Card className="border-primary/20">
        <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Shield className="w-4 h-4 text-primary shrink-0" />
              {t("role")}
            </div>
            <span className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
              roleBadgeClass
            )}>
              {roleLabel}
            </span>
          </div>

          {/* Feature access badges */}
          <div className="flex flex-wrap gap-1">
            {FEATURE_ITEMS.map(({ key, icon: Icon, label, permission }) => {
              const allowed = hasPermission(permission)
              return (
                <span
                  key={key}
                  className={cn(
                    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border",
                    allowed
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-muted text-muted-foreground border-muted-foreground/20 opacity-50"
                  )}
                >
                  {allowed ? <Icon className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                  {label}
                </span>
              )
            })}
          </div>

          {quota?.isPremium && (
            <div className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
              <Crown className="w-3 h-3" />
              {t("premiumActive")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Quota */}
      <Card className="border-primary/20">
        <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Mail className="w-4 h-4 text-primary shrink-0" />
            {t("emailQuota")}
          </div>
          <div className="space-y-1">
            <p className="text-xl font-bold">{quotaLoading ? "..." : quotaLabel}</p>
            <p className="text-xs text-muted-foreground">
              {t("planLabel")} <span className="font-medium">{quota?.planName || "-"}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {t("remaining")} <span className="font-medium">{quotaLoading ? "..." : remainingLabel}</span>
            </p>
          </div>
          {role === ROLES.CIVILIAN && (
            <p className="text-[10px] text-amber-600 dark:text-amber-400">
              {t("upgradeHint")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Send Status — KNIGHT, DUKE and EMPEROR only */}
      {showSendCard && (
        <Card className="border-primary/20">
          <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Send className="w-4 h-4 text-primary shrink-0" />
              {t("sendStatus")}
            </div>
            <div className="space-y-1">
              <p className={cn(
                "text-xl font-bold",
                !sendLoading && canSend
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-destructive"
              )}>
                {sendLoading ? "..." : canSend ? t("enabled") : t("blocked")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("dailyRemaining")}{" "}
                <span className="font-medium">
                  {remainingEmails === undefined
                    ? "-"
                    : remainingEmails === -1
                    ? t("unlimited")
                    : remainingEmails}
                </span>
              </p>
            </div>
            {showApiKeyHint && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Key className="w-3 h-3" />
                {t("apiKeyHint")}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tip */}
      <Card className="border-primary/20">
        <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            {t("tip")}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{roleTip}</p>
          {showWebhookHint && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Webhook className="w-3 h-3" />
              {t("webhookHint")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

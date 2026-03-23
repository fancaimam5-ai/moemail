"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Users, Mail, MessageSquare, UserX, Clock, Shield, AlertTriangle } from "lucide-react"

interface Stats {
  users: number
  emails: number
  messages: number
  guestSessions: number
  suspendedUsers: number
  usersAtLimit?: number
  emailsLast24h: number
  roleDistribution: Record<string, number>
  planDistribution?: Record<string, number>
  recentActivity: Array<{
    id: string
    action: string
    targetType: string | null
    targetId: string | null
    detail: Record<string, unknown> | null
    createdAt: string
  }>
  emailTrend?: Array<{ date: string; count: number }>
  domainStats?: Array<{ domain: string; count: number }>
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number | string
  color: string
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  )
}

export function DashboardContent() {
  const t = useTranslations("admin.dashboard")
  const tc = useTranslations("admin.common")
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(r => r.json() as Promise<Stats>)
      .then(data => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!stats) {
    return <p className="text-muted-foreground">{tc("noData")}</p>
  }

  const maxTrend = Math.max(...(stats.emailTrend?.map(d => d.count) || [1]), 1)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Users} label={t("totalUsers")} value={stats.users} color="bg-blue-500" />
        <StatCard icon={Mail} label={t("totalEmails")} value={stats.emails} color="bg-green-500" />
        <StatCard icon={MessageSquare} label={t("totalMessages")} value={stats.messages} color="bg-purple-500" />
        <StatCard icon={Clock} label={t("emailsToday")} value={stats.emailsLast24h} color="bg-orange-500" />
        <StatCard icon={UserX} label={t("suspendedUsers")} value={stats.suspendedUsers} color="bg-red-500" />
        <StatCard icon={AlertTriangle} label={t("usersAtLimit")} value={stats.usersAtLimit ?? 0} color="bg-amber-500" />
        <StatCard icon={Shield} label={t("guestSessions")} value={stats.guestSessions} color="bg-cyan-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Trend */}
        {stats.emailTrend && stats.emailTrend.length > 0 && (
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">{t("emailTrend")}</h2>
            <div className="flex items-end gap-1 h-32">
              {stats.emailTrend.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">{d.count}</span>
                  <div
                    className="w-full bg-primary/80 rounded-t min-h-[2px]"
                    style={{ height: `${(d.count / maxTrend) * 100}%` }}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Domain Stats */}
        {stats.domainStats && stats.domainStats.length > 0 && (
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">{t("domainStats")}</h2>
            <div className="space-y-2">
              {stats.domainStats.map((d) => (
                <div key={d.domain} className="flex items-center justify-between text-sm">
                  <span className="font-mono text-xs truncate">{d.domain}</span>
                  <span className="text-muted-foreground ml-2 shrink-0">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Role Distribution */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">{t("roleDistribution")}</h2>
        <div className="flex flex-wrap gap-4">
          {Object.entries(stats.roleDistribution).map(([role, count]) => (
            <div key={role} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm">
              <span className="font-medium capitalize">{role}</span>
              <span className="text-muted-foreground">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Plan Distribution */}
      {stats.planDistribution && Object.keys(stats.planDistribution).length > 0 && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">{t("planDistribution")}</h2>
          <div className="flex flex-wrap gap-4">
            {Object.entries(stats.planDistribution).map(([plan, count]) => (
              <div key={plan} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                plan !== "Free"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                  : "bg-muted"
              }`}>
                {plan !== "Free" && <span>✨</span>}
                <span className="font-medium">{plan}</span>
                <span className="text-muted-foreground">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">{t("recentActivity")}</h2>
        {stats.recentActivity.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("noActivity")}</p>
        ) : (
          <div className="space-y-3">
            {stats.recentActivity.map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-4 text-sm border-b border-border/50 pb-3 last:border-0">
                <div>
                  <span className="font-medium">{a.action.replace(/_/g, " ")}</span>
                  {a.targetType && (
                    <span className="text-muted-foreground"> {tc("on")} {a.targetType}</span>
                  )}
                  {a.detail && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {Object.entries(a.detail).map(([k, v]) => `${k}: ${v}`).join(", ")}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(a.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

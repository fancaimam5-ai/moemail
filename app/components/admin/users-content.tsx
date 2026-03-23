"use client"

import { useEffect, useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import { Search, ChevronLeft, ChevronRight, Shield, Package, RotateCcw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { RoleBadge, StatusBadge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"

interface Plan {
  id: string
  name: string
  maxEmails: number
  maxExpiryHours: number | null
  priceCents: number | null
}

interface User {
  id: string
  name: string | null
  email: string | null
  username: string | null
  image: string | null
  role: string
  emailCount: number
  totalEmailsCreated: number
  planName: string | null
  planId: string | null
  planExpiresAt: string | null
  suspended: boolean
  suspensionReason: string | null
}

interface UsersResponse {
  users: User[]
  total: number
  page: number
  limit: number
  totalPages: number
}

function PlanBadge({ planName }: { planName: string | null }) {
  if (!planName) return <span className="text-xs text-muted-foreground">—</span>
  const isPremium = planName !== "Free"
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
      isPremium
        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
    }`}>
      {isPremium && <span className="mr-1">✨</span>}
      {planName}
    </span>
  )
}

export function UsersContent() {
  const t = useTranslations("admin.users")
  const tc = useTranslations("admin.common")
  const { toast } = useToast()
  const [data, setData] = useState<UsersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [filterRole, setFilterRole] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterPlan, setFilterPlan] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Dialog states
  const [roleDialog, setRoleDialog] = useState<User | null>(null)
  const [suspendDialog, setSuspendDialog] = useState<User | null>(null)
  const [unsuspendDialog, setUnsuspendDialog] = useState<User | null>(null)
  const [planDialog, setPlanDialog] = useState<User | null>(null)
  const [removePlanDialog, setRemovePlanDialog] = useState<User | null>(null)
  const [resetCreditsDialog, setResetCreditsDialog] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState("knight")
  const [selectedPlanId, setSelectedPlanId] = useState("")
  const [selectedPlanExpiry, setSelectedPlanExpiry] = useState("")
  const [suspendReason, setSuspendReason] = useState("")
  const [suspendDuration, setSuspendDuration] = useState("permanent")
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" })
      if (search) params.set("search", search)
      if (filterRole) params.set("role", filterRole)
      if (filterStatus) params.set("status", filterStatus)
      if (filterPlan) params.set("plan", filterPlan)
      const res = await fetch(`/api/admin/users?${params}`)
      setData((await res.json()) as UsersResponse)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [page, search, filterRole, filterStatus, filterPlan])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  useEffect(() => {
    fetch("/api/admin/plans")
      .then(r => r.json() as Promise<{ plans: Plan[] }>)
      .then(d => setAvailablePlans(d.plans))
      .catch(console.error)
  }, [])

  const handleAction = async (userId: string, action: string, actionData?: Record<string, string>) => {
    setActionLoading(userId)
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, data: actionData }),
      })
      if (res.ok) {
        toast({ title: t("actionSuccess") })
        await fetchUsers()
      } else {
        const err = (await res.json()) as { error: string }
        toast({ title: t("actionFailed"), description: err.error, variant: "destructive" })
      }
    } catch (e) {
      console.error(e)
      toast({ title: t("actionFailed"), variant: "destructive" })
    } finally {
      setActionLoading(null)
      setRoleDialog(null)
      setSuspendDialog(null)
      setUnsuspendDialog(null)
      setPlanDialog(null)
      setRemovePlanDialog(null)
      setResetCreditsDialog(null)
    }
  }

  const handleAssignPlan = async (userId: string) => {
    if (!selectedPlanId) return
    setActionLoading(userId)
    try {
      let expiresAt: string | null = null
      if (selectedPlanExpiry) {
        const days = parseInt(selectedPlanExpiry)
        expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
      }
      const res = await fetch(`/api/admin/users/${userId}/plan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlanId, expiresAt }),
      })
      if (res.ok) {
        toast({ title: t("assignSuccess") })
        await fetchUsers()
      } else {
        const err = (await res.json()) as { error: string }
        toast({ title: t("assignFailed"), description: err.error, variant: "destructive" })
      }
    } catch {
      toast({ title: t("assignFailed"), variant: "destructive" })
    } finally {
      setActionLoading(null)
      setPlanDialog(null)
    }
  }

  const handleRemovePlan = async (userId: string) => {
    setActionLoading(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}/plan`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: t("actionSuccess") })
        await fetchUsers()
      } else {
        const err = (await res.json()) as { error: string }
        toast({ title: t("actionFailed"), description: err.error, variant: "destructive" })
      }
    } catch {
      toast({ title: t("actionFailed"), variant: "destructive" })
    } finally {
      setActionLoading(null)
      setRemovePlanDialog(null)
    }
  }

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
        <select
          value={filterRole}
          onChange={(e) => { setFilterRole(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-lg border bg-background text-sm"
        >
          <option value="">{t("filterRole")}</option>
          <option value="emperor">Emperor</option>
          <option value="duke">Duke</option>
          <option value="knight">Knight</option>
          <option value="civilian">Civilian</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-lg border bg-background text-sm"
        >
          <option value="">{t("filterStatus")}</option>
          <option value="active">{t("statusActive")}</option>
          <option value="suspended">{t("statusSuspended")}</option>
        </select>
        <select
          value={filterPlan}
          onChange={(e) => { setFilterPlan(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-lg border bg-background text-sm"
        >
          <option value="">{t("filterPlan")}</option>
          <option value="free">Free</option>
          <option value="premium">Premium</option>
          <option value="none">{t("noPlan")}</option>
        </select>
      </div>

      {/* Desktop Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-x-auto hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">{t("user")}</th>
              <th className="text-left p-3 font-medium">{t("role")}</th>
              <th className="text-left p-3 font-medium">{t("plan")}</th>
              <th className="text-left p-3 font-medium">{t("credits")}</th>
              <th className="text-left p-3 font-medium">{t("emails")}</th>
              <th className="text-left p-3 font-medium">{t("status")}</th>
              <th className="text-right p-3 font-medium">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">{tc("loading")}</td></tr>
            ) : data?.users.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">{t("noUsers")}</td></tr>
            ) : (
              data?.users.map((user) => (
                <tr key={user.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {user.image ? (
                        <img src={user.image} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {(user.username || user.name || "?")[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{user.username || user.name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{user.email || "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3"><RoleBadge role={user.role} /></td>
                  <td className="p-3"><PlanBadge planName={user.role === "emperor" ? null : user.planName} /></td>
                  <td className="p-3 text-muted-foreground">{user.totalEmailsCreated}</td>
                  <td className="p-3 text-muted-foreground">{user.emailCount}</td>
                  <td className="p-3">
                    <StatusBadge
                      status={user.suspended ? "suspended" : "active"}
                      label={user.suspended ? t("suspended") : t("active")}
                    />
                  </td>
                  <td className="p-3 text-right">
                    {user.role !== "emperor" && (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setRoleDialog(user); setSelectedRole(user.role) }}
                          disabled={actionLoading === user.id}
                          className="px-2 py-1 text-xs rounded-md border hover:bg-muted transition-colors disabled:opacity-50"
                        >
                          <Shield className="w-3 h-3 inline mr-1" />{t("changeRole")}
                        </button>
                        <button
                          onClick={() => { setPlanDialog(user); setSelectedPlanId(user.planId || ""); setSelectedPlanExpiry("") }}
                          disabled={actionLoading === user.id}
                          className="px-2 py-1 text-xs rounded-md border text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-50"
                        >
                          <Package className="w-3 h-3 inline mr-1" />{t("assignPlan")}
                        </button>
                        {user.totalEmailsCreated > 0 && (
                          <button
                            onClick={() => setResetCreditsDialog(user)}
                            disabled={actionLoading === user.id}
                            className="px-2 py-1 text-xs rounded-md border text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
                          >
                            <RotateCcw className="w-3 h-3 inline mr-1" />{t("resetCredits")}
                          </button>
                        )}
                        {user.suspended ? (
                          <button
                            onClick={() => setUnsuspendDialog(user)}
                            disabled={actionLoading === user.id}
                            className="px-2 py-1 text-xs rounded-md border text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50"
                          >
                            {t("unsuspend")}
                          </button>
                        ) : (
                          <button
                            onClick={() => { setSuspendDialog(user); setSuspendReason(""); setSuspendDuration("permanent") }}
                            disabled={actionLoading === user.id}
                            className="px-2 py-1 text-xs rounded-md border text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                          >
                            {t("suspend")}
                          </button>
                        )}
                      </div>
                    )}
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
        ) : data?.users.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">{t("noUsers")}</div>
        ) : (
          data?.users.map((user) => (
            <div key={user.id} className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                {user.image ? (
                  <img src={user.image} alt="" className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {(user.username || user.name || "?")[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user.username || user.name || "—"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <RoleBadge role={user.role} />
                <PlanBadge planName={user.role === "emperor" ? null : user.planName} />
                <StatusBadge
                  status={user.suspended ? "suspended" : "active"}
                  label={user.suspended ? t("suspended") : t("active")}
                />
                <span className="text-xs text-muted-foreground">{user.totalEmailsCreated} {t("credits").toLowerCase()}</span>
                <span className="text-xs text-muted-foreground">{user.emailCount} {t("emails").toLowerCase()}</span>
              </div>
              {user.role !== "emperor" && (
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => { setRoleDialog(user); setSelectedRole(user.role) }}
                    className="flex-1 px-2 py-1.5 text-xs rounded-md border hover:bg-muted transition-colors"
                  >
                    {t("changeRole")}
                  </button>
                  <button
                    onClick={() => { setPlanDialog(user); setSelectedPlanId(user.planId || ""); setSelectedPlanExpiry("") }}
                    className="flex-1 px-2 py-1.5 text-xs rounded-md border text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                  >
                    {t("assignPlan")}
                  </button>
                  {user.suspended ? (
                    <button
                      onClick={() => setUnsuspendDialog(user)}
                      className="flex-1 px-2 py-1.5 text-xs rounded-md border text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                    >
                      {t("unsuspend")}
                    </button>
                  ) : (
                    <button
                      onClick={() => { setSuspendDialog(user); setSuspendReason(""); setSuspendDuration("permanent") }}
                      className="flex-1 px-2 py-1.5 text-xs rounded-md border text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      {t("suspend")}
                    </button>
                  )}
                </div>
              )}
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

      {/* Role Change Dialog */}
      <Dialog open={!!roleDialog} onOpenChange={(o) => !o && setRoleDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("changeRoleTitle")}</DialogTitle>
            <DialogDescription>{t("changeRoleDescription", { username: roleDialog?.username || roleDialog?.name || "" })}</DialogDescription>
          </DialogHeader>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full p-2 rounded-lg border bg-background text-sm"
          >
            <option value="duke">Duke</option>
            <option value="knight">Knight</option>
            <option value="civilian">Civilian</option>
          </select>
          <DialogFooter>
            <button onClick={() => setRoleDialog(null)} className="px-4 py-2 text-sm rounded-lg border hover:bg-muted">{tc("cancel")}</button>
            <button
              onClick={() => roleDialog && handleAction(roleDialog.id, "change_role", { role: selectedRole })}
              disabled={!!actionLoading}
              className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {tc("save")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={!!suspendDialog} onOpenChange={(o) => !o && setSuspendDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("suspendTitle")}</DialogTitle>
            <DialogDescription>{t("suspendDescription", { username: suspendDialog?.username || suspendDialog?.name || "" })}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium block mb-1">{t("suspendReason")}</label>
              <input
                type="text"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder={t("suspendReasonPlaceholder")}
                className="w-full p-2 rounded-lg border bg-background text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">{t("suspendDuration")}</label>
              <select
                value={suspendDuration}
                onChange={(e) => setSuspendDuration(e.target.value)}
                className="w-full p-2 rounded-lg border bg-background text-sm"
              >
                <option value="24">{t("suspend1Day")}</option>
                <option value="168">{t("suspend7Days")}</option>
                <option value="720">{t("suspend30Days")}</option>
                <option value="permanent">{t("suspendPermanent")}</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setSuspendDialog(null)} className="px-4 py-2 text-sm rounded-lg border hover:bg-muted">{tc("cancel")}</button>
            <button
              onClick={() => suspendDialog && handleAction(suspendDialog.id, "suspend", { reason: suspendReason, duration: suspendDuration })}
              disabled={!!actionLoading}
              className="px-4 py-2 text-sm rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              {t("suspend")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsuspend Confirm */}
      <ConfirmDialog
        open={!!unsuspendDialog}
        onOpenChange={(o) => !o && setUnsuspendDialog(null)}
        title={t("unsuspendConfirm")}
        description={t("unsuspendDescription", { username: unsuspendDialog?.username || unsuspendDialog?.name || "" })}
        confirmLabel={t("unsuspend")}
        cancelLabel={tc("cancel")}
        onConfirm={() => unsuspendDialog && handleAction(unsuspendDialog.id, "unsuspend")}
        loading={!!actionLoading}
      />

      {/* Plan Assignment Dialog */}
      <Dialog open={!!planDialog} onOpenChange={(o) => !o && setPlanDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("assignPlanTitle")}</DialogTitle>
            <DialogDescription>{t("assignPlanDescription", { username: planDialog?.username || planDialog?.name || "" })}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium block mb-1">{t("selectPlan")}</label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full p-2 rounded-lg border bg-background text-sm"
              >
                <option value="">— {t("selectPlan")} —</option>
                {availablePlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} ({plan.maxEmails} emails{plan.priceCents ? ` · $${(plan.priceCents / 100).toFixed(2)}` : ""})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">{t("planExpiry")}</label>
              <select
                value={selectedPlanExpiry}
                onChange={(e) => setSelectedPlanExpiry(e.target.value)}
                className="w-full p-2 rounded-lg border bg-background text-sm"
              >
                <option value="">{t("planNoExpiry")}</option>
                <option value="30">{t("planMonthly")}</option>
                <option value="90">{t("planQuarterly")}</option>
                <option value="365">{t("planYearly")}</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">{t("planExpiryHint")}</p>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setPlanDialog(null)} className="px-4 py-2 text-sm rounded-lg border hover:bg-muted">{tc("cancel")}</button>
            <button
              onClick={() => planDialog && handleAssignPlan(planDialog.id)}
              disabled={!!actionLoading || !selectedPlanId}
              className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {tc("save")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Plan Confirm */}
      <ConfirmDialog
        open={!!removePlanDialog}
        onOpenChange={(o) => !o && setRemovePlanDialog(null)}
        title={t("removePlanConfirm")}
        description={t("removePlanDescription", { username: removePlanDialog?.username || removePlanDialog?.name || "" })}
        confirmLabel={t("removePlan")}
        cancelLabel={tc("cancel")}
        onConfirm={() => removePlanDialog && handleRemovePlan(removePlanDialog.id)}
        loading={!!actionLoading}
      />

      {/* Reset Credits Confirm */}
      <ConfirmDialog
        open={!!resetCreditsDialog}
        onOpenChange={(o) => !o && setResetCreditsDialog(null)}
        title={t("resetCreditsConfirm")}
        description={t("resetCreditsDescription", { username: resetCreditsDialog?.username || resetCreditsDialog?.name || "", credits: resetCreditsDialog?.totalEmailsCreated || 0 })}
        confirmLabel={t("resetCredits")}
        cancelLabel={tc("cancel")}
        onConfirm={() => resetCreditsDialog && handleAction(resetCreditsDialog.id, "reset_credits")}
        loading={!!actionLoading}
      />
    </div>
  )
}

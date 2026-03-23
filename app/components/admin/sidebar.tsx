"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Mail,
  Activity,
  CreditCard,
  ArrowLeft,
  Shield,
  Menu,
  X,
  Settings,
  Globe,
  UserCheck,
  Send,
  FileText,
  Receipt,
} from "lucide-react"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

interface AdminSidebarProps {
  locale: string
}

export function AdminSidebar({ locale }: AdminSidebarProps) {
  const t = useTranslations("admin.sidebar")
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const NAV_ITEMS = [
    { key: "dashboard", icon: LayoutDashboard, label: t("dashboard") },
    { key: "users", icon: Users, label: t("users") },
    { key: "emails", icon: Mail, label: t("emails") },
    { key: "activity", icon: Activity, label: t("activity") },
    { key: "plans", icon: CreditCard, label: t("plans") },
    { key: "payments", icon: Receipt, label: t("payments") },
    { key: "email-providers", icon: Send, label: t("emailProviders") },
    { key: "delivery-logs", icon: FileText, label: t("deliveryLogs") },
    { key: "settings", icon: Settings, label: t("settings") },
    { key: "domains", icon: Globe, label: t("domains") },
    { key: "guests", icon: UserCheck, label: t("guests") },
  ]

  const isActive = (key: string) => {
    const base = `/${locale}/admin`
    if (key === "dashboard") return pathname === base
    return pathname.startsWith(`${base}/${key}`)
  }

  const getHref = (key: string) => {
    if (key === "dashboard") return `/${locale}/admin`
    return `/${locale}/admin/${key}`
  }

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg">{t("title")}</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.key}
            href={getHref(item.key)}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive(item.key)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-border/50">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("backToSite")}
        </Link>
      </div>
    </>
  )

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-background border shadow-sm"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-background border-r flex flex-col transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}

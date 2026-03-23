"use client"

import { cn } from "@/lib/utils"

const roleColors: Record<string, string> = {
  emperor: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  duke: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  knight: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  civilian: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
}

export function RoleBadge({ role }: { role: string }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize",
      roleColors[role] || roleColors.civilian
    )}>
      {role}
    </span>
  )
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  expired: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
      statusColors[status] || statusColors.active
    )}>
      <span className={cn(
        "w-1.5 h-1.5 rounded-full",
        status === "active" ? "bg-green-500" :
        status === "suspended" ? "bg-red-500" : "bg-gray-500"
      )} />
      {label || status}
    </span>
  )
}

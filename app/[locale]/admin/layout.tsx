import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getUserRole } from "@/lib/auth"
import { ROLES } from "@/lib/permissions"
import type { Locale } from "@/i18n/config"
import { AdminSidebar } from "@/components/admin/sidebar"

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale: localeFromParams } = await params
  const locale = localeFromParams as Locale
  const session = await auth()

  if (!session?.user?.id) {
    redirect(`/${locale}`)
  }

  const role = await getUserRole(session.user.id)
  if (role !== ROLES.EMPEROR) {
    redirect(`/${locale}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="flex">
        <AdminSidebar locale={locale} />
        <main className="flex-1 ml-0 md:ml-64 min-h-screen">
          <div className="p-4 pt-16 md:pt-8 md:p-8 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

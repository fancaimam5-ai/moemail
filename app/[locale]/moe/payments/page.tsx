import { Header } from "@/components/layout/header"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import type { Locale } from "@/i18n/config"
import { PaymentHistory } from "@/components/payments/payment-history"

export default async function PaymentsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: localeFromParams } = await params
  const locale = localeFromParams as Locale
  const session = await auth()

  if (!session?.user) {
    redirect(`/${locale}`)
  }

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="container mx-auto px-4 lg:px-8 max-w-[1600px]">
        <Header />
        <main className="pt-24 pb-16">
          <div className="max-w-4xl mx-auto">
            <PaymentHistory />
          </div>
        </main>
      </div>
    </div>
  )
}

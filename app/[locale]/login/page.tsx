import { LoginForm } from "@/components/auth/login-form"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import type { Locale } from "@/i18n/config"
import { getTurnstileConfig } from "@/lib/turnstile"

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: localeFromParams } = await params
  const locale = localeFromParams as Locale
  const session = await auth()
  
  if (session?.user) {
    redirect(`/${locale}`)
  }

  const turnstile = await getTurnstileConfig()

  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <Header hideSignButton />

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-grid-primary/5" />

      {/* Decorative orbs */}
      <div
        className="login-orb absolute -top-24 -left-24 w-72 h-72 rounded-full bg-primary/10 blur-3xl"
        style={{ animation: "orb-drift-1 12s ease-in-out infinite" }}
      />
      <div
        className="login-orb absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl"
        style={{ animation: "orb-drift-2 15s ease-in-out infinite" }}
      />
      <div
        className="login-orb absolute top-1/4 right-1/4 w-48 h-48 rounded-full bg-primary/5 blur-2xl"
        style={{ animation: "orb-drift-1 10s ease-in-out infinite 2s" }}
      />

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 pt-24">
        <div
          className="login-card-reveal w-full flex justify-center"
          style={{ animation: "card-reveal 0.6s cubic-bezier(0.16,1,0.3,1) forwards", animationDelay: "150ms", opacity: 0 }}
        >
          <LoginForm turnstile={{ enabled: turnstile.enabled, siteKey: turnstile.siteKey }} />
        </div>
      </div>

      <Footer />
    </div>
  )
}

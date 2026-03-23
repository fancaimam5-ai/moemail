import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd"
import { getTranslations } from "next-intl/server"
import { Shield, Eye, Database, Lock, Users, MessageCircle } from "lucide-react"
import type { Locale } from "@/i18n/config"
import type { Metadata } from "next"

function PrivacyPageSchema({ locale }: { locale: string }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://if-mail.tech"
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: locale === "id" ? "Kebijakan Privasi" : "Privacy Policy",
    description: "How IfMail collects, uses, and automatically deletes your data.",
    url: `${baseUrl}/${locale}/privacy`,
    inLanguage: locale,
    isPartOf: { "@id": `${baseUrl}/#website` },
    publisher: { "@id": `${baseUrl}/#organization` },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://if-mail.tech"
  const isId = locale === "id"

  return {
    title: isId
      ? "Kebijakan Privasi — IfMail"
      : "Privacy Policy — IfMail",
    description: isId
      ? "Bagaimana IfMail mengumpulkan, menggunakan, dan menghapus data Anda secara otomatis. Email sementara dihapus setelah kedaluwarsa. Dibangun di infrastruktur Cloudflare."
      : "How IfMail collects, uses, and automatically deletes your data. Temporary emails are deleted after expiry. Built on Cloudflare infrastructure.",
    alternates: {
      canonical: `${baseUrl}/en/privacy`,
      languages: {
        en: `${baseUrl}/en/privacy`,
        id: `${baseUrl}/id/privacy`,
        "x-default": `${baseUrl}/en/privacy`,
      },
    },
  }
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: localeFromParams } = await params
  const locale = localeFromParams as Locale
  const t = await getTranslations({ locale, namespace: "pages.privacy" })

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="container mx-auto px-4 lg:px-8 max-w-[1600px]">
        <Header />
        <PrivacyPageSchema locale={locale} />
        <BreadcrumbJsonLd locale={locale} items={[{ name: "Home", path: "" }, { name: locale === "id" ? "Kebijakan Privasi" : "Privacy Policy", path: "/privacy" }]} />
        <main className="pt-24 pb-16 max-w-3xl mx-auto">
          <div className="space-y-2 mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
              {t("title")}
            </h1>
            <p className="text-sm text-muted-foreground">{t("lastUpdated")}</p>
          </div>

          <p className="text-muted-foreground leading-relaxed mb-8">
            {t("intro")}
          </p>

          <div className="space-y-8">
            {/* Information We Collect */}
            <section className="rounded-2xl border border-primary/10 bg-card/50 backdrop-blur-sm p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20 flex items-center justify-center">
                  <Database className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">{t("sections.collect.title")}</h2>
              </div>
              <ul className="space-y-2 ml-4">
                <li className="text-muted-foreground flex items-start gap-2"><span className="text-primary mt-1.5">•</span>{t("sections.collect.items.0")}</li>
                <li className="text-muted-foreground flex items-start gap-2"><span className="text-primary mt-1.5">•</span>{t("sections.collect.items.1")}</li>
                <li className="text-muted-foreground flex items-start gap-2"><span className="text-primary mt-1.5">•</span>{t("sections.collect.items.2")}</li>
                <li className="text-muted-foreground flex items-start gap-2"><span className="text-primary mt-1.5">•</span>{t("sections.collect.items.3")}</li>
              </ul>
            </section>

            {/* How We Use */}
            <section className="rounded-2xl border border-primary/10 bg-card/50 backdrop-blur-sm p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">{t("sections.use.title")}</h2>
              </div>
              <ul className="space-y-2 ml-4">
                <li className="text-muted-foreground flex items-start gap-2"><span className="text-primary mt-1.5">•</span>{t("sections.use.items.0")}</li>
                <li className="text-muted-foreground flex items-start gap-2"><span className="text-primary mt-1.5">•</span>{t("sections.use.items.1")}</li>
                <li className="text-muted-foreground flex items-start gap-2"><span className="text-primary mt-1.5">•</span>{t("sections.use.items.2")}</li>
                <li className="text-muted-foreground flex items-start gap-2"><span className="text-primary mt-1.5">•</span>{t("sections.use.items.3")}</li>
              </ul>
            </section>

            {/* Data Retention */}
            <section className="rounded-2xl border border-primary/10 bg-card/50 backdrop-blur-sm p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">{t("sections.retention.title")}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{t("sections.retention.description")}</p>
            </section>

            {/* Security */}
            <section className="rounded-2xl border border-primary/10 bg-card/50 backdrop-blur-sm p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">{t("sections.security.title")}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{t("sections.security.description")}</p>
            </section>

            {/* Third Party */}
            <section className="rounded-2xl border border-primary/10 bg-card/50 backdrop-blur-sm p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">{t("sections.thirdParty.title")}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{t("sections.thirdParty.description")}</p>
            </section>

            {/* Contact */}
            <section className="rounded-2xl border border-primary/10 bg-card/50 backdrop-blur-sm p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">{t("sections.contact.title")}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{t("sections.contact.description")}</p>
            </section>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}

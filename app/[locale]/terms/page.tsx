import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd"
import { getTranslations } from "next-intl/server"
import { FileText, CheckCircle, UserCog, AlertTriangle, XCircle, RefreshCw } from "lucide-react"
import type { Locale } from "@/i18n/config"
import type { Metadata } from "next"

function TermsPageSchema({ locale }: { locale: string }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://if-mail.tech"
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: locale === "id" ? "Syarat & Ketentuan" : "Terms of Service",
    description: "Terms of Service for IfMail disposable email service.",
    url: `${baseUrl}/${locale}/terms`,
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
      ? "Syarat & Ketentuan — IfMail"
      : "Terms of Service — IfMail",
    description: isId
      ? "Syarat & Ketentuan penggunaan layanan email sementara IfMail. Ketahui apa yang diperbolehkan dan tidak diperbolehkan saat menggunakan layanan kami."
      : "Terms of Service for IfMail disposable email service. Learn what is and isn't permitted when using our temporary email service.",
    alternates: {
      canonical: `${baseUrl}/en/terms`,
      languages: {
        en: `${baseUrl}/en/terms`,
        id: `${baseUrl}/id/terms`,
        "x-default": `${baseUrl}/en/terms`,
      },
    },
  }
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: localeFromParams } = await params
  const locale = localeFromParams as Locale
  const t = await getTranslations({ locale, namespace: "pages.terms" })

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="container mx-auto px-4 lg:px-8 max-w-[1600px]">
        <Header />
        <TermsPageSchema locale={locale} />
        <BreadcrumbJsonLd locale={locale} items={[{ name: "Home", path: "" }, { name: locale === "id" ? "Syarat & Ketentuan" : "Terms of Service", path: "/terms" }]} />
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
            {/* Service Description */}
            <section className="rounded-2xl border border-primary/10 bg-card/50 backdrop-blur-sm p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">{t("sections.service.title")}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{t("sections.service.description")}</p>
            </section>

            {/* Acceptable Use */}
            <section className="rounded-2xl border border-primary/10 bg-card/50 backdrop-blur-sm p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">{t("sections.acceptable.title")}</h2>
              </div>
              <ul className="space-y-2 ml-4">
                <li className="text-muted-foreground flex items-start gap-2"><span className="text-primary mt-1.5">•</span>{t("sections.acceptable.items.0")}</li>
                <li className="text-muted-foreground flex items-start gap-2"><span className="text-primary mt-1.5">•</span>{t("sections.acceptable.items.1")}</li>
                <li className="text-muted-foreground flex items-start gap-2"><span className="text-primary mt-1.5">•</span>{t("sections.acceptable.items.2")}</li>
                <li className="text-muted-foreground flex items-start gap-2"><span className="text-primary mt-1.5">•</span>{t("sections.acceptable.items.3")}</li>
              </ul>
            </section>

            {/* Accounts */}
            <section className="rounded-2xl border border-primary/10 bg-card/50 backdrop-blur-sm p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20 flex items-center justify-center">
                  <UserCog className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">{t("sections.accounts.title")}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{t("sections.accounts.description")}</p>
            </section>

            {/* Limitations */}
            <section className="rounded-2xl border border-primary/10 bg-card/50 backdrop-blur-sm p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">{t("sections.limitations.title")}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{t("sections.limitations.description")}</p>
            </section>

            {/* Termination */}
            <section className="rounded-2xl border border-primary/10 bg-card/50 backdrop-blur-sm p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">{t("sections.termination.title")}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{t("sections.termination.description")}</p>
            </section>

            {/* Changes */}
            <section className="rounded-2xl border border-primary/10 bg-card/50 backdrop-blur-sm p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">{t("sections.changes.title")}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{t("sections.changes.description")}</p>
            </section>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}

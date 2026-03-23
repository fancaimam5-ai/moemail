import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd"
import { getTranslations } from "next-intl/server"
import { Heart, Sparkles, Cpu, Github, Users } from "lucide-react"
import type { Locale } from "@/i18n/config"
import type { Metadata } from "next"

function AboutPageSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://if-mail.tech"
  const schema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About IfMail",
    description: "About IfMail and SoftMoe Studio — the team behind the free, open-source temporary email service.",
    url: `${baseUrl}/en/about`,
    inLanguage: ["en", "id"],
    isPartOf: { "@id": `${baseUrl}/#website` },
    mainEntity: { "@id": `${baseUrl}/#organization` },
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
      ? "Tentang IfMail — Email Sekali Pakai Open-Source oleh SoftMoe Studio"
      : "About IfMail — Open-Source Disposable Email by SoftMoe Studio",
    description: isId
      ? "IfMail adalah layanan email sementara gratis dan open-source yang dibangun di atas Cloudflare Workers dan Next.js. Mengutamakan privasi, tanpa perlu daftar."
      : "IfMail is a free, open-source temporary email service built on Cloudflare Workers and Next.js. Privacy-first, no signup required.",
    alternates: {
      canonical: `${baseUrl}/en/about`,
      languages: {
        en: `${baseUrl}/en/about`,
        id: `${baseUrl}/id/about`,
        "x-default": `${baseUrl}/en/about`,
      },
    },
  }
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: localeFromParams } = await params
  const locale = localeFromParams as Locale
  const t = await getTranslations({ locale, namespace: "pages.about" })

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="container mx-auto px-4 lg:px-8 max-w-[1600px]">
        <Header />
        <AboutPageSchema />
        <BreadcrumbJsonLd locale={locale} items={[{ name: "Home", path: "" }, { name: "About", path: "/about" }]} />
        <main className="pt-24 pb-16 max-w-3xl mx-auto">
          <div className="space-y-2 mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
              {t("title")}
            </h1>
          </div>

          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            {t("intro")}
          </p>

          <div className="space-y-8">
            {/* Mission */}
            <section className="rounded-2xl border border-primary/10 bg-card/50 backdrop-blur-sm p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">{t("sections.mission.title")}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{t("sections.mission.description")}</p>
            </section>

            {/* Features */}
            <section className="rounded-2xl border border-primary/10 bg-card/50 backdrop-blur-sm p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">{t("sections.features.title")}</h2>
              </div>
              <ul className="space-y-2 ml-4">
                <li className="text-muted-foreground flex items-start gap-2"><span className="text-primary mt-1.5">•</span>{t("sections.features.items.0")}</li>
                <li className="text-muted-foreground flex items-start gap-2"><span className="text-primary mt-1.5">•</span>{t("sections.features.items.1")}</li>
                <li className="text-muted-foreground flex items-start gap-2"><span className="text-primary mt-1.5">•</span>{t("sections.features.items.2")}</li>
                <li className="text-muted-foreground flex items-start gap-2"><span className="text-primary mt-1.5">•</span>{t("sections.features.items.3")}</li>
                <li className="text-muted-foreground flex items-start gap-2"><span className="text-primary mt-1.5">•</span>{t("sections.features.items.4")}</li>
                <li className="text-muted-foreground flex items-start gap-2"><span className="text-primary mt-1.5">•</span>{t("sections.features.items.5")}</li>
                <li className="text-muted-foreground flex items-start gap-2"><span className="text-primary mt-1.5">•</span>{t("sections.features.items.6")}</li>
              </ul>
            </section>

            {/* Technology */}
            <section className="rounded-2xl border border-primary/10 bg-card/50 backdrop-blur-sm p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">{t("sections.tech.title")}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{t("sections.tech.description")}</p>
            </section>

            {/* Open Source */}
            <section className="rounded-2xl border border-primary/10 bg-card/50 backdrop-blur-sm p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20 flex items-center justify-center">
                  <Github className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">{t("sections.openSource.title")}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{t("sections.openSource.description")}</p>
            </section>

            {/* Team */}
            <section className="rounded-2xl border border-primary/10 bg-card/50 backdrop-blur-sm p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">{t("sections.team.title")}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{t("sections.team.description")}</p>
            </section>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}

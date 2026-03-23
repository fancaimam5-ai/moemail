import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd"
import { ApiDocsContent } from "@/components/docs/api-docs-content"
import type { Metadata } from "next"

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
      ? "Dokumentasi API IfMail — REST API Email Sementara untuk Developer"
      : "IfMail API Documentation — Temporary Email REST API for Developers",
    description: isId
      ? "Dokumentasi lengkap REST API IfMail: buat kotak masuk sementara, baca pesan, dan kelola email secara programatik. Mendukung API key, webhook, dan integrasi CI/CD."
      : "Complete IfMail REST API documentation: create temporary inboxes, read messages, and manage emails programmatically. Supports API keys, webhooks, and CI/CD integration.",
    alternates: {
      canonical: `${baseUrl}/en/docs`,
      languages: {
        en: `${baseUrl}/en/docs`,
        id: `${baseUrl}/id/docs`,
        "x-default": `${baseUrl}/en/docs`,
      },
    },
  }
}

function DocsPageSchema({ locale }: { locale: string }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://if-mail.tech"
  const schema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: locale === "id" ? "Dokumentasi API IfMail" : "IfMail API Documentation",
    description: "Complete IfMail REST API documentation: create temporary inboxes, read messages, and manage emails programmatically.",
    url: `${baseUrl}/${locale}/docs`,
    inLanguage: locale,
    isPartOf: { "@id": `${baseUrl}/#website` },
    about: { "@id": `${baseUrl}/#application` },
    publisher: { "@id": `${baseUrl}/#organization` },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export default async function DocsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="container mx-auto px-4 lg:px-8 max-w-[1600px]">
        <Header />
        <DocsPageSchema locale={locale} />
        <BreadcrumbJsonLd locale={locale} items={[{ name: "Home", path: "" }, { name: "API Documentation", path: "/docs" }]} />
        <main className="pt-24 pb-16">
          <div className="max-w-4xl mx-auto">
            <ApiDocsContent />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  )
}

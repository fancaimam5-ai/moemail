import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd"
import { getTranslations } from "next-intl/server"
import type { Locale } from "@/i18n/config"
import { PricingContent } from "./pricing-content"
import { createDb } from "@/lib/db"
import { plans } from "@/lib/schema"
import { auth, getUserRole } from "@/lib/auth"
import { ROLES } from "@/lib/permissions"
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
      ? "Harga IfMail — Paket Email Sementara Gratis & Premium"
      : "IfMail Pricing — Free & Premium Temporary Email Plans",
    description: isId
      ? "Bandingkan Free vs Premium: kotak masuk tak terbatas, alamat permanen, API key, dan webhook. Premium mulai Rp 25.000/bulan."
      : "Compare Free vs Premium: unlimited mailboxes, permanent addresses, API keys, and webhooks. Premium from Rp 25,000/month (~$1.50 USD).",
    alternates: {
      canonical: `${baseUrl}/en/pricing`,
      languages: {
        en: `${baseUrl}/en/pricing`,
        id: `${baseUrl}/id/pricing`,
        "x-default": `${baseUrl}/en/pricing`,
      },
    },
  }
}

interface PlanPrice {
  label: string
  period: string
}

function formatPrice(priceCents: number, currency: string): string {
  if (priceCents === 0) return currency === "idr" ? "Gratis" : "Free"
  if (currency === "idr") return `Rp ${priceCents.toLocaleString("id-ID")}`
  return `$${(priceCents / 100).toFixed(2)}`
}

async function getPrices(): Promise<{ freePrice: PlanPrice | null; premiumPrice: PlanPrice | null }> {
  try {
    const db = createDb()
    const allPlans = await db.select().from(plans)

    const findPlan = (role: string, currency: string) =>
      allPlans.find(p => p.name === `${role}_${currency}`) ?? null

    const freePlan = findPlan("civilian", "idr") ?? findPlan("civilian", "usd")
    const premiumPlan = findPlan("knight", "idr") ?? findPlan("knight", "usd")

    const toPrice = (plan: typeof freePlan): PlanPrice | null => {
      if (!plan) return null
      const currency = plan.name.endsWith("_idr") ? "idr" : "usd"
      const price = plan.priceCents ?? 0
      return {
        label: formatPrice(price, currency),
        period: currency === "idr" ? "/bln" : "/mo",
      }
    }

    return {
      freePrice: toPrice(freePlan),
      premiumPrice: toPrice(premiumPlan),
    }
  } catch {
    return { freePrice: null, premiumPrice: null }
  }
}

function PricingFaqSchema({ locale }: { locale: string }) {
  const isId = locale === "id"
  const faqItems = isId ? [
    { q: "Apa itu IfMail dan bagaimana cara kerjanya?", a: "IfMail adalah layanan email sementara gratis yang membuat alamat email sekali pakai secara instan — tanpa akun atau nomor telepon. Anda cukup pilih nama pengguna dan domain, lalu kotak masuk sementara Anda siap menerima email dalam hitungan detik. Email dikirim secara real-time melalui jaringan edge global Cloudflare. Saat waktu kedaluwarsa yang Anda pilih tiba (dari 1 jam hingga 72 jam untuk Gratis, atau permanen untuk Premium), alamat dan semua pesan otomatis dihapus dari server kami. Pengguna gratis mendapat 3 alamat email, sedangkan pengguna Premium mendapat alamat tak terbatas dengan penyimpanan permanen, akses API, dan notifikasi webhook." },
    { q: "Apa yang terjadi jika saya menghapus kotak surat?", a: "Menghapus kotak surat TIDAK mengembalikan kredit pembuatan Anda. Setiap pembuatan email menggunakan satu kredit secara permanen, terlepas dari apakah kotak surat tersebut kemudian dihapus atau kedaluwarsa. Artinya jika Anda membuat 3 email di paket Gratis dan menghapus semuanya, kredit Anda tetap nol. Untuk mendapatkan lebih banyak alamat email, Anda bisa upgrade ke Premium untuk pembuatan email tanpa batas, atau buat akun baru." },
    { q: "Apa yang terjadi jika langganan Premium saya berakhir?", a: "Saat paket Premium berakhir, kotak surat dan alamat email permanen Anda yang sudah ada akan tetap berfungsi normal — Anda tidak akan kehilangan email yang sudah ada. Namun, Anda tidak dapat membuat alamat email baru jika sudah menggunakan 3 kredit gratis. API key dan webhook Anda juga akan berhenti berfungsi hingga Anda memperbarui. Email permanen yang dibuat saat masih Premium tetap aktif dan terus menerima pesan." },
    { q: "Bisakah saya menggunakan IfMail tanpa membuat akun?", a: "Ya! IfMail menyediakan akses tamu yang memungkinkan Anda membuat 1 alamat email sementara tanpa registrasi apa pun. Email tamu berlaku selama 3 hari lalu otomatis kedaluwarsa. Jika butuh fleksibilitas lebih, Anda bisa mendaftar akun gratis untuk mendapatkan 3 kredit pembuatan email dengan kedaluwarsa hingga 72 jam. Tidak perlu nomor telepon atau informasi pribadi untuk mendaftar — cukup pilih username dan password." },
    { q: "Bagaimana cara upgrade ke Premium?", a: "Klik tombol 'Upgrade Sekarang' dan selesaikan pembayaran melalui payment gateway DOKU yang aman. Paket Premium Anda akan langsung aktif setelah pembayaran dikonfirmasi. Premium seharga Rp 25.000/bulan dan mencakup pembuatan email tanpa batas, alamat permanen, akses API key, notifikasi webhook, dan semua domain yang tersedia." },
    { q: "Bisakah saya membatalkan langganan Premium?", a: "Ya, hubungi admin untuk membatalkan. Email Anda yang sudah ada akan tetap aktif, tetapi Anda akan kembali ke batas paket Gratis untuk pembuatan baru. Tidak ada komitmen jangka panjang yang diperlukan." },
    { q: "Apakah IfMail aman dan privat digunakan?", a: "IfMail dibangun sepenuhnya di atas infrastruktur enterprise Cloudflare yang menyediakan perlindungan DDoS dan keamanan edge global. Semua konten email dienkripsi saat disimpan menggunakan enkripsi AES-256-GCM. Email sementara dihapus permanen dari server kami saat kedaluwarsa — kami tidak menyimpan salinan cadangan. Seluruh proyek bersifat open source, sehingga Anda bisa mengaudit kode sendiri di GitHub untuk memverifikasi cara data Anda ditangani." },
    { q: "Apakah IfMail memiliki API untuk developer?", a: "Ya, IfMail menyediakan REST API lengkap untuk developer dan tim otomasi QA. Dengan API key Premium, Anda bisa membuat kotak masuk sementara, melihat dan membaca pesan, menghapus email, dan mengelola kotak surat secara programatik dari bahasa pemrograman atau pipeline CI/CD apa pun. API juga mendukung notifikasi webhook agar aplikasi Anda menerima notifikasi real-time saat email baru masuk. Dokumentasi API lengkap tersedia di if-mail.tech/docs." },
  ] : [
    { q: "What is IfMail and how does it work?", a: "IfMail is a free temporary email service that creates disposable email addresses instantly — no account or phone number required. You choose a username and domain, and your temporary inbox is ready to receive emails in seconds. Emails are delivered in real-time via Cloudflare's global edge network. When the expiry time you selected arrives (from 1 hour to 72 hours on Free, or permanent on Premium), your address and all messages are automatically deleted from our servers. Free users get 3 email addresses, while Premium users get unlimited addresses with permanent retention, API access, and webhook notifications." },
    { q: "What happens when I delete a mailbox?", a: "Deleting a mailbox does NOT restore your creation credits. Each email creation permanently uses one credit, regardless of whether the mailbox is later deleted or expires. This means if you created 3 emails on the Free plan and delete all of them, you will have zero credits remaining. To get more email addresses, you can upgrade to Premium for unlimited email creation, or create a new account." },
    { q: "What happens if my Premium subscription expires?", a: "When your Premium plan expires, your existing mailboxes and permanent email addresses will continue to work normally — you won't lose any existing emails. However, you will no longer be able to create new email addresses if you've already used your 3 free credits. Your API keys and webhooks will also stop working until you renew. Permanent emails you created while on Premium will remain active and continue to receive messages." },
    { q: "Can I use IfMail without creating an account?", a: "Yes! IfMail offers guest access that lets you create 1 temporary email address without any signup or registration. The guest email lasts for 3 days and then auto-expires. If you need more flexibility, you can sign up for a free account to get 3 email creation credits with up to 72-hour expiry. No phone number or personal information is required to register — just pick a username and password." },
    { q: "How do I upgrade to Premium?", a: "Click the 'Upgrade Now' button and complete the payment through our secure DOKU payment gateway. Your Premium plan will be activated instantly after payment confirmation. Premium costs Rp 25,000/month (approximately $1.50 USD) and includes unlimited email creation, permanent addresses, API key access, webhook notifications, and all available domains." },
    { q: "Can I cancel my Premium subscription?", a: "Yes, contact the admin to cancel. Your existing emails remain active, but you'll return to Free plan limits for new creations. No long-term commitment required." },
    { q: "Is IfMail safe and private to use?", a: "IfMail is built entirely on Cloudflare's enterprise-grade infrastructure, which provides DDoS protection and global edge security. All email content is encrypted at rest using AES-256-GCM encryption. Temporary emails are permanently deleted from our servers when they expire — we keep no backup copies. The entire project is open source, so you can audit the code yourself on GitHub to verify exactly how your data is handled." },
    { q: "Does IfMail have an API for developers?", a: "Yes, IfMail provides a full REST API for developers and QA automation teams. With a Premium API key, you can create temporary inboxes, list and read messages, delete emails, and manage your mailboxes programmatically from any language or CI/CD pipeline. The API also supports webhook notifications so your application can receive real-time alerts when new emails arrive. Full API documentation is available at if-mail.tech/docs." },
  ]

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map(item => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": { "@type": "Answer", "text": item.a },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: localeFromParams } = await params
  const locale = localeFromParams as Locale
  const t = await getTranslations({ locale, namespace: "pricing" })
  const { freePrice, premiumPrice } = await getPrices()
  const session = await auth()
  const userRole = session?.user?.id ? await getUserRole(session.user.id) : null
  const isPremiumUser = userRole === ROLES.KNIGHT || userRole === ROLES.DUKE || userRole === ROLES.EMPEROR

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="container mx-auto px-4 lg:px-8 max-w-[1600px]">
        <Header />
        <PricingFaqSchema locale={locale} />
        <BreadcrumbJsonLd locale={locale} items={[{ name: "Home", path: "" }, { name: "Pricing", path: "/pricing" }]} />
        <main className="pt-24 pb-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-3xl sm:text-4xl font-bold mb-3">{t("title")}</h1>
              <p className="text-lg text-muted-foreground">{t("subtitle")}</p>
            </div>
            <PricingContent freePrice={freePrice} premiumPrice={premiumPrice} isPremiumUser={isPremiumUser} isLoggedIn={!!session} />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  )
}

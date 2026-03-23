import {
  darkButton,
  darkEmailLayout,
  darkFeatureCard,
  darkIconCircle,
  darkInfoRow,
  darkInfoTable,
  darkPill,
  darkTitleBlock,
  darkTopBar,
  escapeHtml,
} from "./base"

const i18n = {
  en: {
    subject: "🌟 Welcome to Premium! — IfMail",
    heading: "Welcome to Premium!",
    sub: "Your account has been upgraded",
    greeting: (name: string) => `Hi ${name},`,
    body: "Congratulations! Your IfMail account is now Premium. You've unlocked all the features below:",
    feature1: "Unlimited email addresses",
    feature2: "Extended email retention (30 days)",
    feature3: "Priority support",
    feature4: "Higher daily send limits",
    thanks: "Thank you for supporting IfMail — we're excited to have you on board! 🎉",
  },
  id: {
    subject: "🌟 Selamat Datang di Premium! — IfMail",
    heading: "Selamat Datang di Premium!",
    sub: "Akun Anda telah di-upgrade",
    greeting: (name: string) => `Hai ${name},`,
    body: "Selamat! Akun IfMail Anda sekarang Premium. Anda telah membuka semua fitur di bawah ini:",
    feature1: "Alamat email tanpa batas",
    feature2: "Retensi email lebih lama (30 hari)",
    feature3: "Dukungan prioritas",
    feature4: "Batas kirim harian lebih tinggi",
    thanks: "Terima kasih telah mendukung IfMail — kami senang Anda bergabung! 🎉",
  },
}

export function premiumActivatedTemplate(name: string, locale: string = "en") {
  const t = locale === "id" ? i18n.id : i18n.en
  const safeName = escapeHtml(name)
  const activatedAt = new Date().toLocaleDateString(locale === "id" ? "id-ID" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const features = [
    darkFeatureCard("♾️", locale === "id" ? "Pembuatan email tanpa batas" : "Unlimited Email Creation", locale === "id" ? "Buat email sementara sebanyak yang Anda butuhkan" : "Create as many temporary emails as you need", "#f59e0b30"),
    darkFeatureCard("⏰", locale === "id" ? "Durasi kedaluwarsa fleksibel" : "Flexible Expiry Duration", locale === "id" ? "Atur masa aktif email sesuai kebutuhan" : "Set custom expiry or keep emails longer", "#f59e0b30"),
    darkFeatureCard("🔗", locale === "id" ? "Akses API & webhook penuh" : "Full API & Webhook Access", locale === "id" ? "Integrasikan IfMail ke workflow Anda" : "Integrate IfMail into your workflow", "#f59e0b30"),
    darkFeatureCard("🔄", locale === "id" ? "Opsi berbagi lengkap" : "All Sharing Options", locale === "id" ? "Bagikan mailbox dengan izin yang lebih lengkap" : "Share mailboxes with advanced permissions", "#f59e0b30"),
  ].join("")
  const subscriptionInfo = darkInfoTable(
    darkInfoRow(locale === "id" ? "⭐" : "⭐", locale === "id" ? "Paket" : "Plan", "Premium", { accent: "#f59e0b" }) +
    darkInfoRow(locale === "id" ? "🕐" : "🕐", locale === "id" ? "Aktif sejak" : "Activated", activatedAt, { accent: "#e0dce8", divider: false })
  )
  const cardContent = [
    darkTopBar("linear-gradient(90deg,#f59e0b,#fbbf24,#f59e0b)"),
    darkIconCircle("⭐", "#f59e0b20", "#f59e0b40"),
    darkPill(locale === "id" ? "⭐ Premium Aktif" : "⭐ Premium Active", "#f59e0b", "#0a0714"),
    darkTitleBlock(
      t.heading,
      locale === "id"
        ? `Hai <strong style="color:#e0dce8;">${safeName}</strong>,`
        : `Hi <strong style="color:#e0dce8;">${safeName}</strong>,`,
      t.body.replace("<strong style=\"color:#f59e0b;\">Premium</strong>", "Premium")
    ),
    `<tr><td style="padding:0 40px 32px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${features}</table></td></tr>`,
    `<tr><td style="padding:0 40px 32px;">${subscriptionInfo}</td></tr>`,
    `<tr><td align="center" style="padding:0 40px 32px;">${darkButton("https://if-mail.tech", locale === "id" ? "→  Mulai Gunakan Premium" : "→  Start Using Premium", "#7c3aed")}</td></tr>`,
  ].join("")

  return {
    subject: t.subject,
    html: darkEmailLayout({
      title: t.subject,
      preheader: locale === "id"
        ? "Selamat datang di IfMail Premium, email tanpa batas, API, webhook, dan lainnya"
        : "Welcome to IfMail Premium! Unlimited emails, API access, and more",
      cardContent,
      footerNote: t.thanks,
      locale,
    }),
    text: `${t.greeting(name)}\n\n${t.body}\n\n✓ ${t.feature1}\n✓ ${t.feature2}\n✓ ${t.feature3}\n✓ ${t.feature4}\n\n${t.thanks}`,
  }
}

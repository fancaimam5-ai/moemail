import {
  darkButton,
  darkCallout,
  darkEmailLayout,
  darkFeatureCard,
  darkIconCircle,
  darkProgressCard,
  darkTitleBlock,
  darkTopBar,
  escapeHtml,
} from "./base"

const i18n = {
  en: {
    subject: "⚠️ Email Quota Running Low — IfMail",
    heading: "Quota Running Low",
    sub: "You're approaching your email limit",
    greeting: (name: string) => `Hi ${name},`,
    body: (used: number, total: number) =>
      `You've used <strong>${used}</strong> of your <strong>${total}</strong> email address slots. Consider upgrading for more capacity.`,
    used: "Used",
    limit: "Limit",
    status: "Status",
    statusBadge: "Approaching Limit",
  },
  id: {
    subject: "⚠️ Kuota Email Hampir Penuh — IfMail",
    heading: "Kuota Hampir Penuh",
    sub: "Anda mendekati batas email Anda",
    greeting: (name: string) => `Hai ${name},`,
    body: (used: number, total: number) =>
      `Anda telah menggunakan <strong>${used}</strong> dari <strong>${total}</strong> slot alamat email. Pertimbangkan untuk upgrade untuk kapasitas lebih besar.`,
    used: "Terpakai",
    limit: "Batas",
    status: "Status",
    statusBadge: "Mendekati Batas",
  },
}

export function quotaWarningTemplate(
  name: string,
  used: number,
  total: number,
  locale: string = "en"
) {
  const t = locale === "id" ? i18n.id : i18n.en
  const safeName = escapeHtml(name)
  const remaining = Math.max(total - used, 0)
  const percentage = total > 0 ? Math.round((used / total) * 100) : 0
  const benefits = [
    darkFeatureCard("✓", locale === "id" ? "Pembuatan email tanpa batas" : "Unlimited email creation", locale === "id" ? "Buat email sementara sebanyak yang Anda butuhkan" : "Create as many temporary emails as you need", "#f59e0b30"),
    darkFeatureCard("✓", locale === "id" ? "Durasi kedaluwarsa fleksibel" : "Flexible expiry duration", locale === "id" ? "Atur masa aktif email sesuai kebutuhan" : "Set the expiry that fits your workflow", "#f59e0b30"),
    darkFeatureCard("✓", locale === "id" ? "Akses API & webhook" : "API & webhook access", locale === "id" ? "Integrasikan IfMail ke workflow Anda" : "Integrate IfMail into your workflow", "#f59e0b30"),
    darkFeatureCard("✓", locale === "id" ? "Opsi berbagi penuh" : "Advanced sharing options", locale === "id" ? "Bagikan mailbox dengan izin yang lebih lengkap" : "Share mailboxes with richer permissions", "#f59e0b30"),
  ].join("")
  const cardContent = [
    darkTopBar("linear-gradient(90deg,#f59e0b,#ef4444)"),
    darkIconCircle("⚠️", "#f59e0b20", "#f59e0b40"),
    darkTitleBlock(
      locale === "id" ? "Peringatan Batas Penggunaan" : "Usage Limit Warning",
      locale === "id"
        ? `Hai <strong style="color:#e0dce8;">${safeName}</strong>,`
        : `Hi <strong style="color:#e0dce8;">${safeName}</strong>,`,
      locale === "id"
        ? "Anda mendekati batas plan gratis Anda. Berikut pemakaian saat ini:"
        : "You're approaching the limit of your free plan. Here's your current usage:"
    ),
    `<tr><td style="padding:0 40px 16px;">${darkProgressCard(locale === "id" ? "Kredit Email Terpakai" : "Email Credits Used", `${used} / ${total}`, percentage, "linear-gradient(90deg,#f59e0b,#ef4444)")}</td></tr>`,
    `<tr><td align="center" style="padding:0 40px 32px;">${darkCallout(locale === "id" ? `⚠️ Anda memiliki sisa <strong>${remaining}</strong> kredit` : `⚠️ You have <strong>${remaining}</strong> credit(s) remaining`, "#ef444410", "#ef444430", "#ef4444")}</td></tr>`,
    `<tr><td style="padding:0 40px 8px;"><p style="margin:0;font-size:14px;font-weight:600;color:#f59e0b;">${locale === "id" ? "Upgrade ke Premium dan dapatkan:" : "Upgrade to Premium and get:"}</p></td></tr>`,
    `<tr><td style="padding:0 40px 24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${benefits}</table></td></tr>`,
    `<tr><td align="center" style="padding:0 40px 32px;">${darkButton("https://if-mail.tech/pricing", locale === "id" ? "⭐  Upgrade ke Premium" : "⭐  Upgrade to Premium", "linear-gradient(90deg,#f59e0b,#fbbf24)", "#0a0714")}</td></tr>`,
  ].join("")

  return {
    subject: t.subject,
    html: darkEmailLayout({
      title: t.subject,
      preheader: locale === "id"
        ? "Kuota email Anda hampir habis, upgrade ke Premium untuk akses tanpa batas"
        : "You're running low on email credits, upgrade to Premium for unlimited access",
      cardContent,
      footerNote: locale === "id"
        ? "Butuh bantuan? Hubungi admin untuk mengetahui detail Premium."
        : "Need help? Contact our admin to learn more about Premium.",
      locale,
    }),
    text: `${t.greeting(name)}\n\n${t.body(used, total).replace(/<[^>]*>/g, "")}\n\n${t.used}: ${used}/${total}`,
  }
}

import {
  darkButton,
  darkCallout,
  darkEmailLayout,
  darkIconCircle,
  darkLinkBox,
  darkTitleBlock,
  darkTopBar,
  escapeHtml,
} from "./base"

const i18n = {
  en: {
    subject: "Verify Your Email — IfMail",
    heading: "Verify Your Email",
    sub: "One quick step to get started",
    greeting: (name: string) => `Hi ${name},`,
    body: "Welcome to IfMail! Please confirm your email address by clicking the button below. This helps keep your account secure.",
    button: "Verify My Email →",
    badge: "Expires in 24h",
    expiry: "This verification link is valid for <strong>24 hours</strong>. After it expires, you'll need to request a new one.",
    fallback: "Or paste this link in your browser:",
    ignore: "Didn't create an account? No action needed — this email will be ignored.",
  },
  id: {
    subject: "Verifikasi Email Anda — IfMail",
    heading: "Verifikasi Email Anda",
    sub: "Satu langkah cepat untuk memulai",
    greeting: (name: string) => `Hai ${name},`,
    body: "Selamat datang di IfMail! Silakan konfirmasi alamat email Anda dengan mengklik tombol di bawah. Ini membantu menjaga keamanan akun Anda.",
    button: "Verifikasi Email Saya →",
    badge: "Berlaku 24 jam",
    expiry: "Tautan verifikasi ini berlaku selama <strong>24 jam</strong>. Setelah kedaluwarsa, Anda perlu meminta tautan baru.",
    fallback: "Atau tempel tautan ini di browser Anda:",
    ignore: "Tidak membuat akun? Tidak perlu tindakan — email ini akan diabaikan.",
  },
}

export function verifyEmailTemplate(name: string, url: string, locale: string = "en") {
  const t = locale === "id" ? i18n.id : i18n.en
  const safeName = escapeHtml(name)
  const cardContent = [
    darkTopBar("linear-gradient(90deg,#7c3aed,#a78bfa)"),
    darkIconCircle("✓", "#7c3aed20", "#7c3aed40"),
    darkTitleBlock(
      t.heading,
      locale === "id"
        ? `Hai <strong style="color:#e0dce8;">${safeName}</strong>,`
        : `Hi <strong style="color:#e0dce8;">${safeName}</strong>,`,
      t.body
    ),
    `<tr><td align="center" style="padding:0 40px 24px;">${darkButton(url, t.button, "#7c3aed")}</td></tr>`,
    `<tr><td align="center" style="padding:0 40px 24px;">${darkCallout(t.expiry.replace("<strong>", "").replace("</strong>", ""), "#7c3aed10", "#7c3aed30", "#a78bfa")}</td></tr>`,
    darkLinkBox(t.fallback, url, "#7c3aed"),
  ].join("")

  return {
    subject: t.subject,
    html: darkEmailLayout({
      title: t.subject,
      preheader: locale === "id"
        ? "Verifikasi akun IfMail Anda untuk mulai membuat email sementara"
        : "Verify your IfMail account to start creating temporary emails",
      cardContent,
      footerNote: t.ignore,
      locale,
    }),
    text: `${t.greeting(name)}\n\n${t.body}\n\n${url}\n\n${t.expiry.replace(/<[^>]*>/g, "")}\n\n${t.ignore}`,
  }
}

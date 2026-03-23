import {
  darkButton,
  darkEmailLayout,
  darkIconCircle,
  darkInfoRow,
  darkInfoTable,
  darkLinkBox,
  darkTitleBlock,
  darkTopBar,
  escapeHtml,
} from "./base"

const i18n = {
  en: {
    subject: "Your Magic Login Link — IfMail",
    heading: "Magic Login Link",
    sub: "Sign in without a password",
    greeting: (name: string) => `Hi ${name},`,
    body: "You requested a passwordless sign-in to your IfMail account. Click below to instantly access your account — no password needed.",
    button: "Sign In to IfMail ✨",
    badge: "Single use · 10 min",
    alert: "🔒 This link can only be used once and expires in 10 minutes",
    fallback: "Or paste this link in your browser:",
    ignore: "Didn't request this? Someone may have entered your email by mistake. No action is needed.",
  },
  id: {
    subject: "Tautan Masuk Ajaib — IfMail",
    heading: "Tautan Masuk Ajaib",
    sub: "Masuk tanpa kata sandi",
    greeting: (name: string) => `Hai ${name},`,
    body: "Anda meminta masuk tanpa kata sandi ke akun IfMail. Klik di bawah untuk langsung mengakses akun Anda — tanpa perlu kata sandi.",
    button: "Masuk ke IfMail ✨",
    badge: "Sekali pakai · 10 menit",
    alert: "🔒 Tautan ini hanya bisa digunakan sekali dan berlaku 10 menit",
    fallback: "Atau tempel tautan ini di browser Anda:",
    ignore: "Tidak meminta ini? Seseorang mungkin salah memasukkan email Anda. Tidak perlu tindakan.",
  },
}

export function magicLinkTemplate(name: string, url: string, locale: string = "en") {
  const t = locale === "id" ? i18n.id : i18n.en
  const safeName = escapeHtml(name)
  const infoTable = darkInfoTable(
    darkInfoRow("⏱", locale === "id" ? "Masa berlaku" : "Expires", locale === "id" ? "10 menit" : "10 minutes", { accent: "#a78bfa" }) +
    darkInfoRow("🔒", locale === "id" ? "Tipe tautan" : "Link type", locale === "id" ? "Sekali pakai" : "Single use", { accent: "#a78bfa", divider: false })
  )
  const cardContent = [
    darkTopBar("linear-gradient(90deg,#7c3aed,#a78bfa)"),
    darkIconCircle("🔗", "#7c3aed20", "#7c3aed40"),
    darkTitleBlock(
      t.heading,
      locale === "id"
        ? `Hai <strong style="color:#e0dce8;">${safeName}</strong>,`
        : `Hi <strong style="color:#e0dce8;">${safeName}</strong>,`,
      t.body
    ),
    `<tr><td align="center" style="padding:0 40px 32px;">${darkButton(url, t.button, "#7c3aed")}</td></tr>`,
    darkLinkBox(t.fallback, url, "#7c3aed"),
    `<tr><td align="center" style="padding:0 40px 32px;">${infoTable}</td></tr>`,
  ].join("")

  return {
    subject: t.subject,
    html: darkEmailLayout({
      title: t.subject,
      preheader: locale === "id"
        ? "Tautan login ajaib IfMail Anda, masuk hanya dengan satu klik"
        : "Your IfMail magic login link, sign in with one click",
      cardContent,
      footerNote: t.ignore,
      locale,
    }),
    text: `${t.greeting(name)}\n\n${t.body}\n\n${url}\n\n${t.alert}\n\n${t.ignore}`,
  }
}

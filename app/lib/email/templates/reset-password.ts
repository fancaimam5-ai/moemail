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
    subject: "Reset Your Password — IfMail",
    heading: "Reset Your Password",
    sub: "Secure your account in seconds",
    greeting: (name: string) => `Hi ${name},`,
    body: "We received a request to reset the password for your IfMail account. Click the button below to choose a new password.",
    alert: "⏱ This link expires in 1 hour",
    button: "Reset Password →",
    expiry: "For your security, this link is valid for <strong>1 hour</strong> only. After that, you'll need to request a new one from the login page.",
    fallback: "Or paste this link in your browser:",
    ignore: "Didn't request this? Your password is safe — no changes have been made. You can safely ignore this email.",
  },
  id: {
    subject: "Atur Ulang Kata Sandi — IfMail",
    heading: "Atur Ulang Kata Sandi",
    sub: "Amankan akun Anda dalam hitungan detik",
    greeting: (name: string) => `Hai ${name},`,
    body: "Kami menerima permintaan untuk mengatur ulang kata sandi akun IfMail Anda. Klik tombol di bawah untuk membuat kata sandi baru.",
    alert: "⏱ Tautan ini berlaku 1 jam",
    button: "Atur Ulang Kata Sandi →",
    expiry: "Demi keamanan Anda, tautan ini hanya berlaku selama <strong>1 jam</strong>. Setelah itu, Anda perlu meminta tautan baru dari halaman login.",
    fallback: "Atau tempel tautan ini di browser Anda:",
    ignore: "Tidak meminta ini? Kata sandi Anda aman — tidak ada perubahan. Anda bisa mengabaikan email ini.",
  },
}

export function resetPasswordTemplate(name: string, url: string, locale: string = "en") {
  const t = locale === "id" ? i18n.id : i18n.en
  const safeName = escapeHtml(name)
  const cardContent = [
    darkTopBar("linear-gradient(90deg,#7c3aed,#a78bfa)"),
    darkIconCircle("🔑", "#7c3aed20", "#7c3aed40"),
    darkTitleBlock(
      t.heading,
      locale === "id"
        ? `Hai <strong style="color:#e0dce8;">${safeName}</strong>,`
        : `Hi <strong style="color:#e0dce8;">${safeName}</strong>,`,
      t.body
    ),
    `<tr><td align="center" style="padding:0 40px 32px;">${darkButton(url, t.button, "#7c3aed")}</td></tr>`,
    darkLinkBox(t.fallback, url, "#7c3aed"),
    `<tr><td align="center" style="padding:0 40px 16px;">${darkCallout(t.alert, "#f59e0b10", "#f59e0b30", "#f59e0b")}</td></tr>`,
    `<tr><td align="center" style="padding:0 40px 32px;">${darkCallout(locale === "id" ? "🔒 Jika Anda tidak meminta ini, segera amankan akun Anda" : "🔒 If you didn't request this, please secure your account immediately", "#ef444410", "#ef444430", "#ef4444")}</td></tr>`,
  ].join("")

  return {
    subject: t.subject,
    html: darkEmailLayout({
      title: t.subject,
      preheader: locale === "id"
        ? "Atur ulang kata sandi IfMail Anda, tautan ini berlaku 60 menit"
        : "Reset your IfMail password, this link expires in 60 minutes",
      cardContent,
      footerNote: t.ignore,
      locale,
    }),
    text: `${t.greeting(name)}\n\n${t.body}\n\n${url}\n\n${t.expiry.replace(/<[^>]*>/g, "")}\n\n${t.ignore}`,
  }
}

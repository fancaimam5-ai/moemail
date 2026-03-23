import {
  darkCallout,
  darkEmailLayout,
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
    subject: "🔐 New Login Detected — IfMail",
    heading: "New Login Detected",
    sub: "We noticed a sign-in to your account",
    greeting: (name: string) => `Hi ${name},`,
    body: "A new sign-in to your IfMail account was detected. If this was you, no action is needed.",
    time: "Time",
    sessionId: "Session ID",
    safe: "✅ If this was you, you can safely ignore this email.",
    warning: "⚠️ If this wasn't you, change your password immediately to secure your account.",
  },
  id: {
    subject: "🔐 Login Baru Terdeteksi — IfMail",
    heading: "Login Baru Terdeteksi",
    sub: "Kami mendeteksi login ke akun Anda",
    greeting: (name: string) => `Hai ${name},`,
    body: "Sebuah login baru ke akun IfMail Anda terdeteksi. Jika ini Anda, tidak perlu tindakan.",
    time: "Waktu",
    sessionId: "ID Sesi",
    safe: "✅ Jika ini Anda, Anda bisa mengabaikan email ini.",
    warning: "⚠️ Jika ini bukan Anda, segera ubah kata sandi Anda untuk mengamankan akun.",
  },
}

export function securityAlertTemplate(
  name: string,
  ipHash: string,
  time: string,
  locale: string = "en"
) {
  const t = locale === "id" ? i18n.id : i18n.en
  const safeName = escapeHtml(name)
  const details = darkInfoTable(
    darkInfoRow("🕐", t.time, escapeHtml(time)) +
    darkInfoRow("🌐", locale === "id" ? "IP / Sesi" : "IP / Session", escapeHtml(ipHash), { mono: true, divider: false })
  )
  const cardContent = [
    darkTopBar("linear-gradient(90deg,#ef4444,#dc2626)"),
    darkIconCircle("🛡️", "#ef444420", "#ef444440"),
    darkPill(locale === "id" ? "🔴 Peringatan Keamanan" : "🔴 Security Alert", "#ef4444", "#ffffff"),
    darkTitleBlock(
      t.heading,
      locale === "id"
        ? `Hai <strong style="color:#e0dce8;">${safeName}</strong>,`
        : `Hi <strong style="color:#e0dce8;">${safeName}</strong>,`,
      locale === "id"
        ? "Kami mendeteksi login baru ke akun IfMail Anda. Jika ini Anda, tidak perlu tindakan. Jika bukan, segera amankan akun Anda."
        : "We detected a new sign-in to your IfMail account. If this was you, no action is needed. If not, please secure your account immediately."
    ),
    `<tr><td style="padding:0 40px 24px;">${details}</td></tr>`,
    `<tr><td align="center" style="padding:0 40px 24px;">${darkCallout(t.warning, "#ef444410", "#ef444430", "#ef4444")}</td></tr>`,
  ].join("")

  return {
    subject: t.subject,
    html: darkEmailLayout({
      title: t.subject,
      preheader: locale === "id"
        ? "Login baru terdeteksi di akun IfMail Anda, mohon cek aktivitas ini"
        : "New login detected on your IfMail account, please verify this activity",
      cardContent,
      footerNote: t.safe,
      locale,
    }),
    text: `${t.greeting(name)}\n\n${t.body}\n\n${t.time}: ${time}\n${t.sessionId}: ${ipHash}\n\n${t.warning}`,
  }
}

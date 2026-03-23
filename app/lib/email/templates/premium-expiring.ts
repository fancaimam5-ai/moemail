import { baseLayout, actionButton, textLine, heading, subheading, alertBox, infoBox, badge, detailRow, detailTable, fallbackUrl, THEMES } from "./base"

const theme = THEMES.premiumExpiring

const i18n = {
  en: {
    subject: "⚠️ Your Premium Plan Expires Soon — IfMail",
    heading: "Premium Expires Soon",
    sub: "Don't lose your premium benefits",
    greeting: (name: string) => `Hi ${name},`,
    body: "Your IfMail Premium plan is about to expire. Renew now to keep enjoying all benefits without interruption.",
    plan: "Plan",
    planValue: "Premium",
    expires: "Expires",
    status: "Status",
    statusBadge: "Expiring Soon",
    button: "Renew Premium →",
    warning: "After your plan expires, your account will revert to Free plan limits. Existing emails beyond the free quota will be preserved but you won't be able to create new ones.",
    fallback: "Or paste this link in your browser:",
  },
  id: {
    subject: "⚠️ Paket Premium Anda Segera Berakhir — IfMail",
    heading: "Premium Segera Berakhir",
    sub: "Jangan kehilangan keuntungan premium Anda",
    greeting: (name: string) => `Hai ${name},`,
    body: "Paket Premium IfMail Anda akan segera berakhir. Perpanjang sekarang untuk tetap menikmati semua keuntungan tanpa gangguan.",
    plan: "Paket",
    planValue: "Premium",
    expires: "Berakhir",
    status: "Status",
    statusBadge: "Segera Berakhir",
    button: "Perpanjang Premium →",
    warning: "Setelah paket berakhir, akun Anda akan kembali ke batasan paket Gratis. Email yang ada di luar kuota gratis akan tetap tersimpan, tetapi Anda tidak dapat membuat yang baru.",
    fallback: "Atau tempel tautan ini di browser Anda:",
  },
}

function formatDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale === "id" ? "id-ID" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function premiumExpiringTemplate(name: string, expiryDate: Date, renewUrl: string, locale: string = "en") {
  const t = locale === "id" ? i18n.id : i18n.en
  const formattedDate = formatDate(expiryDate, locale)

  const content = [
    heading(t.heading, theme),
    subheading(t.sub),
    textLine(t.greeting(name)),
    textLine(t.body),
    alertBox(`⏱ ${t.statusBadge}: ${formattedDate}`, theme),
    detailTable(
      detailRow(t.plan, `<strong>${t.planValue}</strong>`) +
      detailRow(t.expires, `<strong>${formattedDate}</strong>`) +
      detailRow(t.status, badge(t.statusBadge, theme))
    ),
    actionButton(renewUrl, t.button, theme),
    infoBox(t.warning, theme),
    fallbackUrl(renewUrl, t.fallback, theme),
  ].join("")

  return {
    subject: t.subject,
    html: baseLayout(content, theme, locale),
    text: `${t.greeting(name)}\n\n${t.body}\n\n${t.plan}: ${t.planValue}\n${t.expires}: ${formattedDate}\n${t.status}: ${t.statusBadge}\n\n${renewUrl}\n\n${t.warning}`,
  }
}

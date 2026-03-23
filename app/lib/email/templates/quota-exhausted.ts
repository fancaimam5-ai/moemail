import { baseLayout, actionButton, textLine, heading, subheading, alertBox, infoBox, badge, progressBar, detailRow, detailTable, fallbackUrl, THEMES } from "./base"

const theme = THEMES.quotaExhausted

const i18n = {
  en: {
    subject: "🚫 Email Quota Reached — IfMail",
    heading: "Quota Reached",
    sub: "You've hit your email limit",
    greeting: (name: string) => `Hi ${name},`,
    body: (total: number) =>
      `You've reached your limit of <strong>${total}</strong> email addresses. To create more, upgrade now.`,
    alert: "🚫 No more email addresses can be created",
    used: "Used",
    limit: "Limit",
    status: "Status",
    statusBadge: "Limit Reached",
    button: "Upgrade to Premium →",
    info: "Premium members enjoy unlimited email creation with extended retention and priority support.",
    fallback: "Or paste this link in your browser:",
  },
  id: {
    subject: "🚫 Kuota Email Habis — IfMail",
    heading: "Kuota Tercapai",
    sub: "Anda telah mencapai batas email",
    greeting: (name: string) => `Hai ${name},`,
    body: (total: number) =>
      `Anda telah mencapai batas <strong>${total}</strong> alamat email. Untuk membuat lebih banyak, upgrade sekarang.`,
    alert: "🚫 Tidak ada lagi alamat email yang dapat dibuat",
    used: "Terpakai",
    limit: "Batas",
    status: "Status",
    statusBadge: "Batas Tercapai",
    button: "Upgrade ke Premium →",
    info: "Anggota Premium menikmati pembuatan email tanpa batas dengan retensi lebih lama dan dukungan prioritas.",
    fallback: "Atau tempel tautan ini di browser Anda:",
  },
}

export function quotaExhaustedTemplate(
  name: string,
  used: number,
  total: number,
  upgradeUrl: string,
  locale: string = "en"
) {
  const t = locale === "id" ? i18n.id : i18n.en

  const content = [
    heading(t.heading, theme),
    subheading(t.sub),
    textLine(t.greeting(name)),
    textLine(t.body(total)),
    alertBox(t.alert, theme),
    progressBar(used, total, theme, true),
    detailTable(
      detailRow(t.used, `<strong>${used}</strong>`) +
      detailRow(t.limit, `<strong>${total}</strong>`) +
      detailRow(t.status, badge(t.statusBadge, theme))
    ),
    actionButton(upgradeUrl, t.button, theme),
    infoBox(t.info, theme),
    fallbackUrl(upgradeUrl, t.fallback, theme),
  ].join("")

  return {
    subject: t.subject,
    html: baseLayout(content, theme, locale),
    text: `${t.greeting(name)}\n\n${t.body(total).replace(/<[^>]*>/g, "")}\n\n${t.used}: ${used}/${total}\n\n${upgradeUrl}\n\n${t.info}`,
  }
}

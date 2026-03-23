import { baseLayout, textLine, heading, subheading, infoBox, badge, detailRow, detailTable, THEMES } from "./base"

const theme = THEMES.adminTest

const i18n = {
  en: {
    subject: "✅ Test Email — IfMail Admin",
    heading: "Test Email",
    sub: "Provider configuration check",
    body: "This is a test email sent from the IfMail admin panel to verify the email provider configuration.",
    provider: "Provider",
    from: "From",
    sentAt: "Sent At",
    statusBadge: "Delivered",
    success: "✅ If you received this email, the email provider is configured correctly and ready to send.",
  },
  id: {
    subject: "✅ Email Tes — IfMail Admin",
    heading: "Email Tes",
    sub: "Pemeriksaan konfigurasi penyedia",
    body: "Ini adalah email tes yang dikirim dari panel admin IfMail untuk memverifikasi konfigurasi penyedia email.",
    provider: "Penyedia",
    from: "Dari",
    sentAt: "Dikirim",
    statusBadge: "Terkirim",
    success: "✅ Jika Anda menerima email ini, penyedia email telah dikonfigurasi dengan benar dan siap mengirim.",
  },
}

export function adminTestTemplate(
  providerLabel: string,
  fromEmail: string,
  locale: string = "en"
) {
  const t = locale === "id" ? i18n.id : i18n.en
  const now = new Date().toISOString()

  const content = [
    heading(t.heading, theme),
    subheading(t.sub),
    textLine(t.body),
    detailTable(
      detailRow(t.provider, `<strong>${providerLabel}</strong>`) +
      detailRow(t.from, `<code style="font-size:12px;background:#e4e4e7;padding:3px 8px;border-radius:6px;font-family:monospace;">${fromEmail}</code>`) +
      detailRow(t.sentAt, now)
    ),
    `<div style="text-align:center;margin:16px 0;">${badge(t.statusBadge, theme)}</div>`,
    infoBox(t.success, theme),
  ].join("")

  return {
    subject: t.subject,
    html: baseLayout(content, theme, locale),
    text: `${t.body}\n\n${t.provider}: ${providerLabel}\n${t.from}: ${fromEmail}\n${t.sentAt}: ${now}\n\n${t.success}`,
  }
}

// Base email template layout with premium branding — each template gets its own theme

export interface EmailTheme {
  gradient: string        // header gradient
  accent: string          // primary accent color
  accentLight: string     // lighter accent for backgrounds
  accentDark: string      // darker accent for hover/text
  accentMuted: string     // very subtle accent for borders
  iconSvg: string         // inline SVG icon for the header
  iconBg: string          // icon circle background
  headerPattern: string   // decorative dots/pattern SVG for header bg
}

export const THEMES = {
  verify: {
    gradient: "linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)",
    accent: "#059669",
    accentLight: "#ecfdf5",
    accentDark: "#047857",
    accentMuted: "#a7f3d0",
    iconBg: "rgba(255,255,255,0.18)",
    headerPattern: "rgba(255,255,255,0.08)",
    iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  },
  reset: {
    gradient: "linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)",
    accent: "#dc2626",
    accentLight: "#fef2f2",
    accentDark: "#b91c1c",
    accentMuted: "#fecaca",
    iconBg: "rgba(255,255,255,0.18)",
    headerPattern: "rgba(255,255,255,0.08)",
    iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/></svg>`,
  },
  magicLink: {
    gradient: "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #a78bfa 100%)",
    accent: "#7c3aed",
    accentLight: "#f5f3ff",
    accentDark: "#6d28d9",
    accentMuted: "#c4b5fd",
    iconBg: "rgba(255,255,255,0.18)",
    headerPattern: "rgba(255,255,255,0.08)",
    iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 9h0"/><path d="M17.8 6.2 19 5"/><path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/></svg>`,
  },
  quota: {
    gradient: "linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%)",
    accent: "#d97706",
    accentLight: "#fffbeb",
    accentDark: "#b45309",
    accentMuted: "#fde68a",
    iconBg: "rgba(255,255,255,0.18)",
    headerPattern: "rgba(255,255,255,0.08)",
    iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  },
  security: {
    gradient: "linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)",
    accent: "#1e40af",
    accentLight: "#eff6ff",
    accentDark: "#1e3a8a",
    accentMuted: "#bfdbfe",
    iconBg: "rgba(255,255,255,0.18)",
    headerPattern: "rgba(255,255,255,0.08)",
    iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>`,
  },
  premium: {
    gradient: "linear-gradient(135deg, #b45309 0%, #d97706 40%, #f59e0b 100%)",
    accent: "#b45309",
    accentLight: "#fffbeb",
    accentDark: "#92400e",
    accentMuted: "#fde68a",
    iconBg: "rgba(255,255,255,0.18)",
    headerPattern: "rgba(255,255,255,0.08)",
    iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  },
  premiumExpiring: {
    gradient: "linear-gradient(135deg, #c2410c 0%, #ea580c 50%, #fb923c 100%)",
    accent: "#c2410c",
    accentLight: "#fff7ed",
    accentDark: "#9a3412",
    accentMuted: "#fed7aa",
    iconBg: "rgba(255,255,255,0.18)",
    headerPattern: "rgba(255,255,255,0.08)",
    iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  },
  quotaExhausted: {
    gradient: "linear-gradient(135deg, #b91c1c 0%, #dc2626 50%, #ef4444 100%)",
    accent: "#b91c1c",
    accentLight: "#fef2f2",
    accentDark: "#991b1b",
    accentMuted: "#fecaca",
    iconBg: "rgba(255,255,255,0.18)",
    headerPattern: "rgba(255,255,255,0.08)",
    iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`,
  },
  adminTest: {
    gradient: "linear-gradient(135deg, #7c3aed 0%, #826DD9 50%, #a78bfa 100%)",
    accent: "#7c3aed",
    accentLight: "#f5f3ff",
    accentDark: "#6d28d9",
    accentMuted: "#c4b5fd",
    iconBg: "rgba(255,255,255,0.18)",
    headerPattern: "rgba(255,255,255,0.08)",
    iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  },
} satisfies Record<string, EmailTheme>

// ─── Layout ───────────────────────────────────────────────

export function baseLayout(content: string, theme: EmailTheme, locale: string = "en"): string {
  const footer = locale === "id"
    ? "Email ini dikirim secara otomatis oleh IfMail. Jangan membalas email ini."
    : "This email was sent automatically by IfMail. Please do not reply."

  const tagline = locale === "id" ? "Email sementara, aman &amp; cepat" : "Temporary email, safe &amp; fast"
  const year = new Date().getFullYear()

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>IfMail</title>
  <!--[if mso]><style>table,td{font-family:Arial,sans-serif!important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:32px 16px 40px;">
        <!--[if mso]><table role="presentation" width="560" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo & Tagline -->
          <tr>
            <td style="padding:0 0 20px;text-align:center;">
              <div style="font-size:26px;font-weight:800;color:#18181b;letter-spacing:-0.5px;">If<span style="color:${theme.accent};">Mail</span></div>
              <div style="font-size:12px;color:#a1a1aa;letter-spacing:0.5px;margin-top:4px;">${tagline}</div>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.08),0 2px 4px rgba(0,0,0,0.04);border:1px solid #e4e4e7;">

                <!-- Gradient Header with Icon -->
                <tr>
                  <td style="background:${theme.gradient};padding:40px 40px 36px;text-align:center;position:relative;">
                    <!-- Decorative circles -->
                    <div style="position:absolute;top:-20px;right:-20px;width:80px;height:80px;border-radius:50%;background:${theme.headerPattern};"></div>
                    <div style="position:absolute;bottom:-10px;left:20px;width:40px;height:40px;border-radius:50%;background:${theme.headerPattern};"></div>
                    <!-- Icon -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                      <tr>
                        <td style="width:68px;height:68px;border-radius:20px;background:${theme.iconBg};text-align:center;vertical-align:middle;border:2px solid rgba(255,255,255,0.15);">
                          <div style="display:inline-block;vertical-align:middle;line-height:1;padding-top:2px;">
                            ${theme.iconSvg}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Accent Line -->
                <tr>
                  <td style="height:3px;background:${theme.gradient};opacity:0.3;"></td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding:36px 40px 16px;">
                    ${content}
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding:8px 40px 0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="border-top:1px solid #e4e4e7;"></td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:20px 40px 28px;text-align:center;">
                    <p style="margin:0;color:#a1a1aa;font-size:12px;line-height:1.6;">${footer}</p>
                    <p style="margin:8px 0 0;color:#d4d4d8;font-size:11px;">&copy; ${year} IfMail &middot; if-mail.tech</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ─── Content Helpers ──────────────────────────────────────

export function heading(text: string, theme?: EmailTheme): string {
  const colorStyle = theme ? `color:${theme.accent};` : "color:#18181b;"
  return `<h2 style="margin:0 0 12px;${colorStyle}font-size:22px;font-weight:800;line-height:1.3;letter-spacing:-0.3px;">${text}</h2>`
}

export function subheading(text: string): string {
  return `<p style="margin:0 0 20px;color:#71717a;font-size:14px;line-height:1.5;font-weight:500;">${text}</p>`
}

export function textLine(text: string, style?: string): string {
  return `<p style="margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.75;${style || ''}">${text}</p>`
}

export function actionButton(url: string, label: string, theme: EmailTheme): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:28px 0 24px;">
  <tr>
    <td align="center">
      <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${url}" style="width:240px;height:48px;" arcsize="21%" fill="true" stroke="false"><v:fill type="gradient" color="${theme.accent}" color2="${theme.accentDark}"/><v:textbox inset="0,0,0,0"><center style="color:#ffffff;font-size:15px;font-weight:bold;">${label}</center></v:textbox></v:roundrect><![endif]-->
      <!--[if !mso]><!-->
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:${theme.gradient};border-radius:12px;box-shadow:0 4px 14px ${theme.accent}30,0 2px 4px ${theme.accent}15;">
            <a href="${url}" target="_blank" style="display:inline-block;padding:15px 44px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;letter-spacing:0.3px;">${label}</a>
          </td>
        </tr>
      </table>
      <!--<![endif]-->
    </td>
  </tr>
</table>`
}

export function infoBox(text: string, theme: EmailTheme): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;">
  <tr>
    <td style="padding:16px 20px;background-color:${theme.accentLight};border-left:4px solid ${theme.accent};border-radius:0 12px 12px 0;">
      <p style="margin:0;color:${theme.accentDark};font-size:13px;line-height:1.7;">${text}</p>
    </td>
  </tr>
</table>`
}

export function alertBox(text: string, theme: EmailTheme): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;">
  <tr>
    <td style="padding:18px 20px;background-color:${theme.accentLight};border:1px solid ${theme.accentMuted};border-radius:12px;text-align:center;">
      <p style="margin:0;color:${theme.accentDark};font-size:14px;line-height:1.6;font-weight:600;">${text}</p>
    </td>
  </tr>
</table>`
}

export function detailRow(label: string, value: string): string {
  return `<tr>
  <td style="padding:10px 16px;color:#71717a;font-size:13px;font-weight:600;white-space:nowrap;vertical-align:top;border-bottom:1px solid #f4f4f5;">${label}</td>
  <td style="padding:10px 16px;color:#18181b;font-size:13px;word-break:break-all;border-bottom:1px solid #f4f4f5;">${value}</td>
</tr>`
}

export function detailTable(rows: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;background:#fafafa;border-radius:12px;overflow:hidden;border:1px solid #f0f0f0;">
  ${rows}
</table>`
}

export function fallbackUrl(url: string, label: string, theme: EmailTheme): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0 20px;">
  <tr>
    <td style="padding:16px 20px;background:#fafafa;border-radius:12px;border:1px solid #f0f0f0;text-align:center;">
      <p style="margin:0 0 8px;color:#a1a1aa;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">${label}</p>
      <a href="${url}" style="color:${theme.accent};font-size:12px;word-break:break-all;text-decoration:underline;text-underline-offset:2px;">${url}</a>
    </td>
  </tr>
</table>`
}

export function badge(text: string, theme: EmailTheme): string {
  return `<span style="display:inline-block;padding:4px 12px;background:${theme.accentLight};color:${theme.accent};font-size:11px;font-weight:700;border-radius:99px;letter-spacing:0.3px;border:1px solid ${theme.accentMuted};">${text}</span>`
}

export function progressBar(used: number, total: number, theme: EmailTheme, isMax: boolean = false): string {
  const percentage = Math.min(Math.round((used / total) * 100), 100)
  const barGradient = isMax ? "linear-gradient(90deg,#b91c1c,#ef4444)" : theme.gradient
  const percentColor = isMax ? "#b91c1c" : theme.accent

  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;">
  <tr>
    <td>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="font-size:12px;color:#71717a;padding-bottom:8px;">${used} / ${total}</td>
          <td style="font-size:13px;font-weight:700;color:${percentColor};text-align:right;padding-bottom:8px;">${percentage}%</td>
        </tr>
      </table>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="background:#e4e4e7;border-radius:99px;height:12px;">
            <div style="background:${barGradient};width:${percentage}%;height:12px;border-radius:99px;box-shadow:0 2px 4px ${percentColor}20;"></div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`
}

export function featureItem(text: string, theme: EmailTheme): string {
  return `<tr>
  <td style="padding:14px 18px;border-bottom:1px solid ${theme.accentMuted};">
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr>
        <td style="width:28px;vertical-align:top;">
          <div style="width:22px;height:22px;border-radius:50%;background:${theme.accentLight};border:1px solid ${theme.accentMuted};text-align:center;line-height:22px;">
            <span style="color:${theme.accent};font-size:12px;">&#10003;</span>
          </div>
        </td>
        <td style="padding-left:10px;color:#27272a;font-size:14px;line-height:1.5;">${text}</td>
      </tr>
    </table>
  </td>
</tr>`
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

interface DarkEmailLayoutOptions {
  title: string
  preheader: string
  cardContent: string
  footerNote: string
  locale?: string
}

export function darkEmailLayout({
  title,
  preheader,
  cardContent,
  footerNote,
  locale = "en",
}: DarkEmailLayoutOptions): string {
  const year = new Date().getFullYear()
  const unsubscribe = locale === "id"
    ? "Berhenti berlangganan email notifikasi"
    : "Unsubscribe from notification emails"

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${title}</title>
  <!--[if mso]><style>table,td,a,p,h1{font-family:Arial,sans-serif!important;}</style><![endif]-->
  <style>
    @media only screen and (max-width: 480px) {
      .ifmail-main { width: 100% !important; }
      .ifmail-shell { padding: 24px 20px !important; }
      .ifmail-title { font-size: 20px !important; }
      .ifmail-copy { font-size: 14px !important; }
      .ifmail-footer { padding-left: 20px !important; padding-right: 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0a0714;font-family:'Inter','Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="display:none;font-size:1px;color:#0a0714;line-height:1px;max-height:0;overflow:hidden;">${preheader}&zwnj;&nbsp;&zwnj;&nbsp;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0714;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;" class="ifmail-main">
          <tr>
            <td align="center" style="padding:30px 40px 20px;" class="ifmail-footer">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:10px;vertical-align:middle;"><img src="https://if-mail.tech/icons/icon-192x192.png" width="36" height="36" alt="IfMail" style="display:block;border:0;border-radius:8px;"></td>
                  <td style="font-size:28px;font-weight:700;color:#7c3aed;letter-spacing:-0.5px;">IfMail</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 20px;" class="ifmail-footer">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1333;border:1px solid #2d2650;border-radius:12px;overflow:hidden;">
                ${cardContent}
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:32px 40px 16px;" class="ifmail-footer">
              <p style="margin:0;font-size:13px;color:#5a5672;line-height:1.6;">${footerNote}</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 40px 8px;" class="ifmail-footer">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:0 8px;"><a href="https://if-mail.tech" style="font-size:13px;color:#7c3aed;text-decoration:none;">Website</a></td>
                  <td style="color:#2d2650;">•</td>
                  <td style="padding:0 8px;"><a href="https://if-mail.tech/pricing" style="font-size:13px;color:#7c3aed;text-decoration:none;">Pricing</a></td>
                  <td style="color:#2d2650;">•</td>
                  <td style="padding:0 8px;"><a href="https://if-mail.tech/login" style="font-size:13px;color:#7c3aed;text-decoration:none;">Login</a></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:4px 40px 8px;" class="ifmail-footer">
              <p style="margin:0;font-size:11px;color:#3d3756;">
                <span style="color:#5a5672;text-decoration:underline;">${unsubscribe}</span>
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:4px 40px 40px;" class="ifmail-footer">
              <p style="margin:0;font-size:12px;color:#3d3756;">© ${year} IfMail. All rights reserved. | <a href="https://if-mail.tech" style="color:#5a5672;text-decoration:none;">if-mail.tech</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function darkTopBar(gradient: string): string {
  return `<tr><td style="height:4px;background:${gradient};font-size:0;line-height:0;">&nbsp;</td></tr>`
}

export function darkIconCircle(icon: string, background: string, border: string): string {
  return `<tr>
  <td align="center" style="padding:40px 40px 0;" class="ifmail-shell">
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr>
        <td style="width:72px;height:72px;background-color:${background};border:2px solid ${border};border-radius:50%;text-align:center;line-height:72px;font-size:32px;">${icon}</td>
      </tr>
    </table>
  </td>
</tr>`
}

export function darkPill(text: string, background: string, color: string): string {
  return `<tr>
  <td align="center" style="padding:16px 40px 0;" class="ifmail-shell">
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background-color:${background};border-radius:20px;padding:6px 20px;">
          <p style="margin:0;font-size:12px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:1.5px;">${text}</p>
        </td>
      </tr>
    </table>
  </td>
</tr>`
}

export function darkTitleBlock(title: string, greeting: string, body: string): string {
  return `<tr><td align="center" style="padding:24px 40px 8px;" class="ifmail-shell"><h1 class="ifmail-title" style="margin:0;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">${title}</h1></td></tr>
<tr><td align="center" style="padding:0 40px 8px;" class="ifmail-shell"><p class="ifmail-copy" style="margin:0;font-size:15px;color:#b4b0c4;line-height:1.6;">${greeting}</p></td></tr>
<tr><td align="center" style="padding:0 40px 32px;" class="ifmail-shell"><p class="ifmail-copy" style="margin:0;font-size:15px;color:#b4b0c4;line-height:1.6;">${body}</p></td></tr>`
}

export function darkButton(url: string, label: string, background: string, textColor: string = "#ffffff"): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0">
  <tr>
    <td style="background:${background};border-radius:8px;">
      <a href="${url}" target="_blank" style="display:inline-block;padding:14px 40px;color:${textColor};font-size:16px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">${label}</a>
    </td>
  </tr>
</table>`
}

export function darkOutlineButton(url: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0">
  <tr>
    <td style="border:1px solid #2d2650;border-radius:8px;">
      <a href="${url}" target="_blank" style="display:inline-block;padding:12px 32px;color:#b4b0c4;font-size:14px;text-decoration:none;">${label}</a>
    </td>
  </tr>
</table>`
}

export function darkLinkBox(label: string, url: string, color: string): string {
  return `<tr><td align="center" style="padding:24px 40px 8px;" class="ifmail-shell"><p style="margin:0;font-size:13px;color:#8b85a1;">${label}</p></td></tr>
<tr>
  <td align="center" style="padding:0 40px 24px;" class="ifmail-shell">
    <table role="presentation" cellpadding="0" cellspacing="0" style="background-color:#0f0b1a;border:1px solid #2d2650;border-radius:8px;width:100%;">
      <tr>
        <td style="padding:12px 16px;">
          <p style="margin:0;font-size:12px;color:${color};word-break:break-all;font-family:'Courier New',monospace;">${url}</p>
        </td>
      </tr>
    </table>
  </td>
</tr>`
}

export function darkCallout(text: string, background: string, border: string, color: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${background};border:1px solid ${border};border-radius:8px;">
  <tr>
    <td style="padding:16px 20px;">
      <p style="margin:0;font-size:13px;color:${color};text-align:center;line-height:1.6;">${text}</p>
    </td>
  </tr>
</table>`
}

export function darkCodePanel(label: string, value: string, color: string): string {
  return `<tr>
  <td align="center" style="padding:0 40px 24px;" class="ifmail-shell">
    <table role="presentation" cellpadding="0" cellspacing="0" style="background-color:#0f0b1a;border:1px solid #2d2650;border-radius:8px;width:100%;">
      <tr>
        <td align="center" style="padding:20px;">
          <p style="margin:0 0 8px;font-size:12px;color:#8b85a1;text-transform:uppercase;letter-spacing:1.5px;">${label}</p>
          <p style="margin:0;font-size:28px;font-weight:700;color:${color};letter-spacing:4px;font-family:'Courier New',monospace;word-break:break-all;">${value}</p>
        </td>
      </tr>
    </table>
  </td>
</tr>`
}

export function darkFeatureCard(icon: string, title: string, description: string, borderColor: string): string {
  return `<tr>
  <td style="padding:0 0 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0b1a;border:1px solid ${borderColor};border-radius:8px;">
      <tr>
        <td width="48" style="padding:14px;text-align:center;font-size:20px;">${icon}</td>
        <td style="padding:14px 14px 14px 0;">
          <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#ffffff;">${title}</p>
          <p style="margin:0;font-size:12px;color:#8b85a1;">${description}</p>
        </td>
      </tr>
    </table>
  </td>
</tr>`
}

export function darkInfoTable(rows: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0b1a;border:1px solid #2d2650;border-radius:8px;">
  <tr>
    <td style="padding:20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
    </td>
  </tr>
</table>`
}

export function darkInfoRow(icon: string, label: string, value: string, options?: { mono?: boolean; divider?: boolean; accent?: string }): string {
  const divider = options?.divider === false ? "" : "border-bottom:1px solid #2d2650;"
  const valueStyle = options?.mono
    ? `font-family:'Courier New',monospace;color:${options?.accent || "#e0dce8"};font-weight:600;`
    : `color:${options?.accent || "#e0dce8"};font-weight:600;`

  return `<tr>
  <td style="padding:8px 0;${divider}">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="24" style="font-size:16px;">${icon}</td>
        <td style="font-size:13px;color:#8b85a1;padding-left:8px;">${label}</td>
        <td align="right" style="font-size:13px;${valueStyle}">${value}</td>
      </tr>
    </table>
  </td>
</tr>`
}

export function darkProgressCard(label: string, value: string, percentage: number, gradient: string): string {
  const safePercentage = Math.max(0, Math.min(percentage, 100))

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0b1a;border:1px solid #2d2650;border-radius:8px;">
  <tr>
    <td style="padding:20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:13px;color:#8b85a1;">${label}</td>
          <td align="right" style="font-size:13px;font-weight:700;color:#f59e0b;">${value}</td>
        </tr>
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
        <tr>
          <td>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#2d2650;border-radius:4px;height:8px;">
              <tr>
                <td width="${safePercentage}%" style="background:${gradient};border-radius:4px;height:8px;font-size:0;">&nbsp;</td>
                <td style="font-size:0;">&nbsp;</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`
}

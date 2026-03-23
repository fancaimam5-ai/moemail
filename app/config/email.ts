export const EMAIL_CONFIG = {
  MAX_ACTIVE_EMAILS: 3, // Maximum number of active emails (Free plan default)
  POLL_INTERVAL: 10_000, // Polling interval in milliseconds
  DEFAULT_DAILY_SEND_LIMITS: {
    emperor: 0,  // Unlimited
    duke: 5,     // 5 per day (admin-level)
    knight: 5,   // 5 per day (Premium)
    civilian: 2, // 2 per day (Free)
  },
} as const

export type EmailConfig = typeof EMAIL_CONFIG

export const FREE_DOMAINS: readonly string[] = ["ifshop.my.id", "panelbotif.my.id", "snapmail.biz.id"] 
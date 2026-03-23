import { WEBHOOK_CONFIG } from "@/config/webhook"

export interface EmailMessage {
  emailId: string
  messageId: string
  fromAddress: string
  subject: string
  content: string
  html: string
  receivedAt: string
  toAddress: string
}

export interface WebhookPayload {
  event: typeof WEBHOOK_CONFIG.EVENTS[keyof typeof WEBHOOK_CONFIG.EVENTS]
  data: EmailMessage
}

export async function callWebhook(url: string, payload: WebhookPayload, signingSecret?: string) {
  let lastError: Error | null = null

  const body = JSON.stringify(payload.data)

  for (let i = 0; i < WEBHOOK_CONFIG.MAX_RETRIES; i++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_CONFIG.TIMEOUT)

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Webhook-Event": payload.event,
      }

      if (signingSecret) {
        const key = await crypto.subtle.importKey(
          "raw",
          new TextEncoder().encode(signingSecret),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        )
        const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body))
        headers["X-Webhook-Signature"] = `sha256=${Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("")}`
      }

      const response = await fetch(url, {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        return true
      }

      lastError = new Error(`HTTP error! status: ${response.status}`)
    } catch (error) {
      lastError = error as Error
      
      if (i < WEBHOOK_CONFIG.MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, WEBHOOK_CONFIG.RETRY_DELAY))
      }
    }
  }

  throw lastError
} 
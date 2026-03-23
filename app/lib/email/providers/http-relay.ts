import type { EmailProviderAdapter, EmailMessage, SendResult, ProviderConfig } from "./base"
import { adminTestTemplate } from "../templates"

export class HttpRelayAdapter implements EmailProviderAdapter {
  async send(message: EmailMessage, config: ProviderConfig): Promise<SendResult> {
    if (!config.relayEndpoint) {
      return { success: false, error: "HTTP relay endpoint not configured" }
    }

    const payload = {
      from: { email: config.fromEmail, name: config.fromName },
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(config.replyTo ? { replyTo: config.replyTo } : {}),
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (config.relayAuth) {
      headers["Authorization"] = config.relayAuth.startsWith("Bearer ")
        ? config.relayAuth
        : `Bearer ${config.relayAuth}`
    }

    try {
      const response = await fetch(config.relayEndpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        let messageId: string | undefined
        try {
          const data = await response.json() as { id?: string; messageId?: string }
          messageId = data.id ?? data.messageId
        } catch {
          // Response body may not be JSON
        }
        return { success: true, messageId, statusCode: response.status }
      }

      const errorText = await response.text()
      return {
        success: false,
        statusCode: response.status,
        error: `HTTP relay error (${response.status}): ${errorText}`,
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown HTTP relay error",
      }
    }
  }

  async testConnection(config: ProviderConfig): Promise<SendResult> {
    const template = adminTestTemplate("HTTP Relay", config.fromEmail)
    return this.send(
      {
        to: config.fromEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      },
      config
    )
  }
}

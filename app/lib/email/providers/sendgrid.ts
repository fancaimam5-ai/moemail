import type { EmailProviderAdapter, EmailMessage, SendResult, ProviderConfig } from "./base"
import { adminTestTemplate } from "../templates"

const SENDGRID_API_URL = "https://api.sendgrid.com/v3/mail/send"

export class SendGridAdapter implements EmailProviderAdapter {
  async send(message: EmailMessage, config: ProviderConfig): Promise<SendResult> {
    const body = {
      personalizations: [{ to: [{ email: message.to }] }],
      from: { email: config.fromEmail, name: config.fromName },
      subject: message.subject,
      content: [
        ...(message.text ? [{ type: "text/plain", value: message.text }] : []),
        { type: "text/html", value: message.html },
      ],
      ...(config.replyTo ? { reply_to: { email: config.replyTo } } : {}),
    }

    try {
      const response = await fetch(SENDGRID_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      if (response.status === 202) {
        const messageId = response.headers.get("X-Message-Id") || undefined
        return { success: true, messageId, statusCode: 202 }
      }

      const errorText = await response.text()
      return {
        success: false,
        statusCode: response.status,
        error: `SendGrid API error (${response.status}): ${errorText}`,
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown SendGrid error",
      }
    }
  }

  async testConnection(config: ProviderConfig): Promise<SendResult> {
    const template = adminTestTemplate("SendGrid", config.fromEmail)
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

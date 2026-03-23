export interface EmailMessage {
  to: string
  subject: string
  html: string
  text?: string
}

export interface SendResult {
  success: boolean
  messageId?: string
  statusCode?: number
  error?: string
}

export interface EmailProviderAdapter {
  send(message: EmailMessage, config: ProviderConfig): Promise<SendResult>
  testConnection(config: ProviderConfig): Promise<SendResult>
}

export interface ProviderConfig {
  apiKey: string
  fromEmail: string
  fromName: string
  replyTo?: string | null
  relayEndpoint?: string | null
  relayAuth?: string | null
}

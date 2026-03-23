import { callWebhook } from "@/lib/webhook"
import { WEBHOOK_CONFIG } from "@/config/webhook"
import { z } from "zod"
import { EmailMessage } from "@/lib/webhook"
import { checkPermission, auth } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"
import { createDb } from "@/lib/db"
import { webhooks } from "@/lib/schema"
import { eq } from "drizzle-orm"

const testSchema = z.object({
  url: z.string().url()
})

export async function POST(request: Request) {
  try {
    const canManageWebhook = await checkPermission(PERMISSIONS.MANAGE_WEBHOOK)
    if (!canManageWebhook) {
      return Response.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const session = await auth()
    const body = await request.json()
    const { url } = testSchema.parse(body)

    let signingSecret: string | undefined
    if (session?.user?.id) {
      const db = createDb()
      const userWebhook = await db.query.webhooks.findFirst({
        where: eq(webhooks.userId, session.user.id)
      })
      signingSecret = userWebhook?.signingSecret ?? undefined
    }

    await callWebhook(url, {
      event: WEBHOOK_CONFIG.EVENTS.NEW_MESSAGE,
      data: {
        emailId: "123456789",
        messageId: '987654321',
        fromAddress: "sender@example.com",
        subject: "Test Email",
        content: "This is a test email.",
        html: "<p>This is a <strong>test</strong> email.</p>",
        receivedAt: "2023-03-01T12:00:00Z",
        toAddress: "recipient@example.com"
      } as EmailMessage
    }, signingSecret)

    return Response.json({ success: true })
  } catch (error) {
    console.error("Failed to test webhook:", error)
    return Response.json(
      { error: "Failed to test webhook" },
      { status: 400 }
    )
  }
}

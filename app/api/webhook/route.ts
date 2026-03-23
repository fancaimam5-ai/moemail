import { auth } from "@/lib/auth"
import { createDb } from "@/lib/db"
import { webhooks } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
  /^0\./,
]

function isPrivateUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    return PRIVATE_IP_PATTERNS.some(p => p.test(hostname))
  } catch {
    return true
  }
}

const webhookSchema = z.object({
  url: z.string().url(),
  enabled: z.boolean()
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const db = createDb()
  const webhook = await db.query.webhooks.findFirst({
    where: eq(webhooks.userId, session.user.id)
  })

  return Response.json(webhook ? { enabled: webhook.enabled, url: webhook.url, signingSecret: webhook.signingSecret } : { enabled: false, url: "", signingSecret: "" })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { url, enabled } = webhookSchema.parse(body)

    if (isPrivateUrl(url)) {
      return Response.json({ error: "Webhook URL must be a public internet address" }, { status: 400 })
    }
    
    const db = createDb()
    const now = new Date()

    const existingWebhook = await db.query.webhooks.findFirst({
      where: eq(webhooks.userId, session.user.id)
    })

    if (existingWebhook) {
      await db
        .update(webhooks)
        .set({
          url,
          enabled,
          updatedAt: now
        })
        .where(eq(webhooks.userId, session.user.id))
    } else {
      await db
        .insert(webhooks)
        .values({
          userId: session.user.id,
          url,
          enabled,
        })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("Failed to save webhook:", error)
    return Response.json(
      { error: "Invalid request" },
      { status: 400 }
    )
  }
} 
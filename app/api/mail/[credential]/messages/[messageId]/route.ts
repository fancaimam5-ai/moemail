import { NextResponse } from "next/server"
import { createDb } from "@/lib/db"
import { messages, emails } from "@/lib/schema"
import { and, eq } from "drizzle-orm"
import { verifyCredential } from "@/lib/credential"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ credential: string; messageId: string }> }
) {
  const { credential, messageId } = await params

  const emailId = await verifyCredential(credential)
  if (!emailId) {
    return NextResponse.json({ error: "Invalid credential" }, { status: 404 })
  }

  const db = createDb()

  const email = await db.query.emails.findFirst({
    where: eq(emails.id, emailId),
  })

  if (!email || email.expiresAt < new Date()) {
    return NextResponse.json({ error: "Email expired" }, { status: 410 })
  }

  const message = await db.query.messages.findFirst({
    where: and(eq(messages.id, messageId), eq(messages.emailId, emailId)),
  })

  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 })
  }

  return NextResponse.json({
    message: {
      id: message.id,
      from_address: message.fromAddress,
      to_address: message.toAddress,
      subject: message.subject,
      content: message.content,
      html: message.html,
      received_at: message.receivedAt.getTime(),
      sent_at: message.sentAt?.getTime(),
    },
  })
}

import { createDb } from "@/lib/db"
import { messageShares, messages, emails } from "@/lib/schema"
import { eq, and } from "drizzle-orm"
import { NextResponse } from "next/server"
import { getUserId } from "@/lib/apiKey"

// Delete message share link
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; messageId: string; shareId: string }> }
) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: emailId, messageId, shareId } = await params
  const db = createDb()

  try {
    // Verify email ownership
    const email = await db.query.emails.findFirst({
      where: and(eq(emails.id, emailId), eq(emails.userId, userId))
    })

    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get and verify message
    const message = await db.query.messages.findFirst({
      where: and(eq(messages.id, messageId), eq(messages.emailId, emailId))
    })

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    // Delete share record
    await db.delete(messageShares).where(
      and(eq(messageShares.id, shareId), eq(messageShares.messageId, messageId))
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete message share:", error)
    return NextResponse.json(
      { error: "Failed to delete share" },
      { status: 500 }
    )
  }
}


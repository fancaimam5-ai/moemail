import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createDb } from "@/lib/db"
import { emails, messages } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { checkSendPermission } from "@/lib/send-permissions"
import { sendEmail, checkGlobalDailyLimit } from "@/lib/email"

interface SendEmailRequest {
  to: string
  subject: string
  content: string
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params
    const db = createDb()

    const permissionResult = await checkSendPermission(session.user.id)
    if (!permissionResult.canSend) {
      return NextResponse.json(
        { error: permissionResult.error },
        { status: 403 }
      )
    }

    const globalLimit = await checkGlobalDailyLimit()
    if (!globalLimit.allowed) {
      return NextResponse.json(
        { error: "Service daily send limit reached. Please try again tomorrow." },
        { status: 429 }
      )
    }

    const remainingEmails = permissionResult.remainingEmails

    const { to, subject, content } = await request.json() as SendEmailRequest

    if (!to || !subject || !content) {
      return NextResponse.json(
        { error: "Recipient, subject and content are required" },
        { status: 400 }
      )
    }

    const email = await db.query.emails.findFirst({
      where: eq(emails.id, id)
    })

    if (!email) {
      return NextResponse.json(
        { error: "Email not found" },
        { status: 404 }
      )
    }

    if (email.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You do not have access to this email" },
        { status: 403 }
      )
    }

    const sendResult = await sendEmail({
      to,
      subject,
      html: content,
      text: content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
      emailType: "outbound_user",
    })

    if (!sendResult.success) {
      return NextResponse.json(
        { error: sendResult.error || "Failed to send email. Please try again later." },
        { status: 502 }
      )
    }

    await db.insert(messages).values({
      emailId: email.id,
      fromAddress: email.address,
      toAddress: to,
      subject,
      content: '',
      type: "sent",
      html: content
    })

    return NextResponse.json({ 
      success: true,
      message: "Email sent successfully",
      remainingEmails
    })
  } catch (error) {
    console.error('Failed to send email:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 }
    )
  }
} 
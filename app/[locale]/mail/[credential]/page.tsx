import { verifyCredential } from "@/lib/credential"
import { createDb } from "@/lib/db"
import { emails, messages } from "@/lib/schema"
import { eq, and, or, ne, isNull, desc, sql } from "drizzle-orm"
import { SharedErrorPage } from "@/components/emails/shared-error-page"
import { MailCredentialPageClient } from "./page-client"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

interface PageProps {
  params: Promise<{ credential: string; locale: string }>
}

export default async function MailCredentialPage({ params }: PageProps) {
  const { credential } = await params

  const emailId = await verifyCredential(credential)
  if (!emailId) {
    return (
      <SharedErrorPage
        titleKey="emailNotFound"
        subtitleKey="linkExpired"
        errorKey="linkInvalid"
        descriptionKey="linkInvalidDescription"
        ctaTextKey="createOwnEmail"
      />
    )
  }

  const db = createDb()
  const email = await db.query.emails.findFirst({
    where: eq(emails.id, emailId),
  })

  if (!email || email.expiresAt < new Date()) {
    return (
      <SharedErrorPage
        titleKey="emailNotFound"
        subtitleKey="linkExpired"
        errorKey="linkInvalid"
        descriptionKey="linkInvalidDescription"
        ctaTextKey="createOwnEmail"
      />
    )
  }

  const baseConditions = and(
    eq(messages.emailId, emailId),
    or(ne(messages.type, "sent"), isNull(messages.type))
  )

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(messages)
    .where(baseConditions)

  const initialMessages = await db.query.messages.findMany({
    where: baseConditions,
    orderBy: [desc(messages.receivedAt), desc(messages.id)],
    limit: 21,
  })

  const hasMore = initialMessages.length > 20
  const messageList = hasMore ? initialMessages.slice(0, 20) : initialMessages

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-1 pt-16">
        <MailCredentialPageClient
          email={{
            id: email.id,
            address: email.address,
            createdAt: email.createdAt,
            expiresAt: email.expiresAt,
          }}
          initialMessages={messageList.map((msg) => ({
            id: msg.id,
            from_address: msg.fromAddress || undefined,
            to_address: msg.toAddress || undefined,
            subject: msg.subject,
            received_at: msg.receivedAt,
            sent_at: msg.sentAt || undefined,
          }))}
          initialNextCursor={null}
          initialTotal={Number(totalResult[0].count)}
          credential={credential}
        />
      </main>
      <Footer />
    </div>
  )
}

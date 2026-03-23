import { getSharedMessage } from "@/lib/shared-data"
import { SharedErrorPage } from "@/components/emails/shared-error-page"
import { SharedMessagePageClient } from "./page-client"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

interface PageProps {
  params: Promise<{
    token: string
    locale: string
  }>
}

export default async function SharedMessagePage({ params }: PageProps) {
  const { token } = await params
  
  // 服务端获取数据
  const message = await getSharedMessage(token)
  
  if (!message) {
    return (
      <SharedErrorPage
        titleKey="messageNotFound"
        subtitleKey="linkExpired"
        errorKey="linkInvalid"
        descriptionKey="linkInvalidDescription"
        ctaTextKey="createOwnEmail"
      />
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-1 pt-16">
        <SharedMessagePageClient message={message} />
      </main>
      <Footer />
    </div>
  )
}

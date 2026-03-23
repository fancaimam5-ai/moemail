"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import { SharedMessageList } from "@/components/emails/shared-message-list"
import { SharedMessageDetail } from "@/components/emails/shared-message-detail"
import { EMAIL_CONFIG } from "@/config"
import { Copy, CheckCircle } from "lucide-react"

interface Email {
  id: string
  address: string
  createdAt: Date
  expiresAt: Date
}

interface Message {
  id: string
  from_address?: string
  to_address?: string
  subject: string
  received_at?: Date
  sent_at?: Date
}

interface MessageDetail extends Message {
  content?: string
  html?: string
}

interface MailCredentialPageClientProps {
  email: Email
  initialMessages: Message[]
  initialNextCursor: string | null
  initialTotal: number
  credential: string
}

export function MailCredentialPageClient({
  email,
  initialMessages,
  initialNextCursor,
  initialTotal,
  credential,
}: MailCredentialPageClientProps) {
  const t = useTranslations("emails")
  const tShared = useTranslations("emails.shared")

  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [selectedMessage, setSelectedMessage] = useState<MessageDetail | null>(null)
  const [messageLoading, setMessageLoading] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor)
  const [loadingMore, setLoadingMore] = useState(false)
  const [total, setTotal] = useState(initialTotal)
  const [refreshing, setRefreshing] = useState(false)
  const [copied, setCopied] = useState(false)
  const pollTimeoutRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const messagesRef = useRef<Message[]>(initialMessages)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const copyCredentialLink = () => {
    const url = `${window.location.origin}/en/mail/${credential}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const fetchMessages = async (cursor?: string) => {
    try {
      if (cursor) setLoadingMore(true)

      const url = new URL(`/api/mail/${credential}/messages`, window.location.origin)
      if (cursor) url.searchParams.set("cursor", cursor)

      const res = await fetch(url)
      if (res.ok) {
        const data = (await res.json()) as {
          messages: Message[]
          nextCursor: string | null
          total: number
        }

        if (!cursor) {
          const newMsgs = data.messages
          const oldMsgs = messagesRef.current
          const dupeIdx = newMsgs.findIndex((n: Message) =>
            oldMsgs.some((o: Message) => o.id === n.id)
          )
          if (dupeIdx === -1) {
            setMessages(newMsgs)
            setNextCursor(data.nextCursor)
            setTotal(data.total)
            return
          }
          const unique = newMsgs.slice(0, dupeIdx)
          setMessages([...unique, ...oldMsgs])
          setTotal(data.total)
          return
        }
        setMessages((prev: Message[]) => [...prev, ...(data.messages || [])])
        setNextCursor(data.nextCursor)
        setTotal(data.total)
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err)
    } finally {
      setLoadingMore(false)
      setRefreshing(false)
    }
  }

  const startPolling = () => {
    stopPolling()
    pollTimeoutRef.current = setInterval(() => {
      if (!refreshing && !loadingMore) fetchMessages()
    }, EMAIL_CONFIG.POLL_INTERVAL)
  }

  const stopPolling = () => {
    if (pollTimeoutRef.current) {
      clearInterval(pollTimeoutRef.current)
      pollTimeoutRef.current = null
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchMessages()
  }

  useEffect(() => {
    startPolling()
    return () => stopPolling()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credential])

  const handleLoadMore = () => {
    if (nextCursor && !loadingMore) fetchMessages(nextCursor)
  }

  const fetchMessageDetail = async (messageId: string) => {
    try {
      setMessageLoading(true)
      const res = await fetch(`/api/mail/${credential}/messages/${messageId}`)
      if (!res.ok) throw new Error("Failed to load message")
      const data = (await res.json()) as { message: MessageDetail }
      setSelectedMessage(data.message)
    } catch (err) {
      console.error("Failed to fetch message:", err)
    } finally {
      setMessageLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    try {
      const d = new Date(date)
      if (isNaN(d.getTime())) return undefined
      return d
    } catch {
      return undefined
    }
  }

  const mapMessage = (msg: Message) => ({
    ...msg,
    received_at: msg.received_at ? formatDate(msg.received_at)?.getTime() : undefined,
    sent_at: msg.sent_at ? formatDate(msg.sent_at)?.getTime() : undefined,
  })

  const mapDetail = (msg: MessageDetail) => ({
    ...msg,
    received_at: msg.received_at ? formatDate(msg.received_at)?.getTime() : undefined,
    sent_at: msg.sent_at ? formatDate(msg.sent_at)?.getTime() : undefined,
  })

  const expiresLabel = (() => {
    try {
      const d = new Date(email.expiresAt)
      if (isNaN(d.getTime())) return ""
      if (d.getFullYear() === 9999) return tShared("permanent")
      return `Expires: ${d.toLocaleDateString()} ${d.toLocaleTimeString()}`
    } catch {
      return ""
    }
  })()

  const translationStrings = {
    list: {
      received: t("messages.received"),
      noMessages: t("messages.noMessages"),
      messageCount: t("messages.messageCount"),
      loading: t("messageView.loading"),
      loadingMore: t("messages.loadingMore"),
    },
    detail: {
      messageContent: t("layout.messageContent"),
      selectMessage: t("layout.selectMessage"),
      loading: t("messageView.loading"),
      from: t("messageView.from"),
      to: t("messageView.to"),
      subject: t("messages.subject"),
      time: t("messageView.time"),
      htmlFormat: t("messageView.htmlFormat"),
      textFormat: t("messageView.textFormat"),
    },
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
        <div className="text-center py-2 mb-2">
          <h1 className="text-xl font-bold truncate">{email.address}</h1>
          {expiresLabel && <p className="text-sm text-muted-foreground">{expiresLabel}</p>}
        </div>

        {/* Credential link copy */}
        <div className="flex justify-center mt-2 mb-4">
          <button
            onClick={copyCredentialLink}
            className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors px-3 py-1.5 rounded-md border border-primary/20 hover:border-primary/40 bg-primary/5"
          >
            {copied ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copied ? "Copied!" : "Copy access link"}
          </button>
        </div>

        {/* Desktop two-column layout */}
        <div className="hidden lg:grid grid-cols-2 gap-4 h-[calc(100vh-210px)] mt-4">
          <div className="border-2 border-primary/20 bg-background rounded-lg overflow-hidden">
            <SharedMessageList
              messages={messages.map(mapMessage)}
              selectedMessageId={selectedMessage?.id}
              onMessageSelect={fetchMessageDetail}
              onLoadMore={handleLoadMore}
              onRefresh={handleRefresh}
              loading={false}
              loadingMore={loadingMore}
              refreshing={refreshing}
              hasMore={!!nextCursor}
              total={total}
              t={translationStrings.list}
            />
          </div>
          <div className="border-2 border-primary/20 bg-background rounded-lg overflow-hidden">
            <SharedMessageDetail
              message={selectedMessage ? mapDetail(selectedMessage) : null}
              loading={messageLoading}
              t={translationStrings.detail}
            />
          </div>
        </div>

        {/* Mobile single-column layout */}
        <div className="lg:hidden h-[calc(100vh-190px)] mt-4">
          <div className="border-2 border-primary/20 bg-background rounded-lg overflow-hidden h-full flex flex-col">
            {!selectedMessage ? (
              <SharedMessageList
                messages={messages.map(mapMessage)}
                selectedMessageId={null}
                onMessageSelect={fetchMessageDetail}
                onLoadMore={handleLoadMore}
                onRefresh={handleRefresh}
                loading={false}
                loadingMore={loadingMore}
                refreshing={refreshing}
                hasMore={!!nextCursor}
                total={total}
                t={translationStrings.list}
              />
            ) : (
              <>
                <div className="p-2 border-b-2 border-primary/20 flex items-center justify-between shrink-0">
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="text-sm text-primary"
                  >
                    {t("layout.backToMessageList")}
                  </button>
                  <span className="text-sm font-medium">
                    {t("layout.messageContent")}
                  </span>
                </div>
                <div className="flex-1 overflow-auto">
                  <SharedMessageDetail
                    message={mapDetail(selectedMessage)}
                    loading={messageLoading}
                    t={translationStrings.detail}
                  />
                </div>
              </>
            )}
          </div>
        </div>
    </div>
  )
}

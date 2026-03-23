"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { CreateDialog } from "./create-dialog"
import { ShareDialog } from "./share-dialog"
import { UpgradeDialog } from "./upgrade-dialog"
import { OnboardingBanner } from "./onboarding-banner"
import { Mail, RefreshCw, Trash2, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { EmailListSkeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { useThrottle } from "@/hooks/use-throttle"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ROLES } from "@/lib/permissions"
import { useUserRole } from "@/hooks/use-user-role"

interface Email {
  id: string
  address: string
  createdAt: number
  expiresAt: number
}

interface EmailListProps {
  onEmailSelect: (email: Email | null) => void
  selectedEmailId?: string
}

interface EmailResponse {
  emails: Email[]
  nextCursor: string | null
  total: number
}

interface QuotaInfo {
  totalCreated: number
  max: number
  remaining: number
  planName: string
  isPremium: boolean
}

export function EmailList({ onEmailSelect, selectedEmailId }: EmailListProps) {
  const { data: session } = useSession()
  const { role } = useUserRole()
  const t = useTranslations("emails.list")
  const tCommon = useTranslations("common.actions")
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [emailToDelete, setEmailToDelete] = useState<Email | null>(null)
  const [quota, setQuota] = useState<QuotaInfo | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const { toast } = useToast()

  const fetchQuota = async () => {
    try {
      const res = await fetch("/api/emails/quota")
      if (res.ok) setQuota(await res.json() as QuotaInfo)
    } catch { /* ignore */ }
  }

  const fetchEmails = async (cursor?: string) => {
    try {
      const url = new URL("/api/emails", window.location.origin)
      if (cursor) {
        url.searchParams.set('cursor', cursor)
      }
      const response = await fetch(url)
      const data = await response.json() as EmailResponse
      
      if (!cursor) {
        const newEmails = data.emails
        const oldEmails = emails

        const lastDuplicateIndex = newEmails.findIndex(
          newEmail => oldEmails.some(oldEmail => oldEmail.id === newEmail.id)
        )

        if (lastDuplicateIndex === -1) {
          setEmails(newEmails)
          setNextCursor(data.nextCursor)
          setTotal(data.total)
          return
        }
        const uniqueNewEmails = newEmails.slice(0, lastDuplicateIndex)
        setEmails([...uniqueNewEmails, ...oldEmails])
        setTotal(data.total)
        return
      }
      setEmails(prev => [...prev, ...data.emails])
      setNextCursor(data.nextCursor)
      setTotal(data.total)
    } catch (error) {
      console.error("Failed to fetch emails:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLoadingMore(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchEmails()
    await fetchQuota()
  }

  const handleScroll = useThrottle((e: React.UIEvent<HTMLDivElement>) => {
    if (loadingMore) return

    const { scrollHeight, scrollTop, clientHeight } = e.currentTarget
    const threshold = clientHeight * 1.5
    const remainingScroll = scrollHeight - scrollTop

    if (remainingScroll <= threshold && nextCursor) {
      setLoadingMore(true)
      fetchEmails(nextCursor)
    }
  }, 200)

  useEffect(() => {
    if (session) {
      fetchEmails()
      fetchQuota()
    }
  }, [session])

  const handleDelete = async (email: Email) => {
    try {
      const response = await fetch(`/api/emails/${email.id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const data = await response.json()
        toast({
          title: t("error"),
          description: (data as { error: string }).error,
          variant: "destructive"
        })
        return
      }

      setEmails(prev => prev.filter(e => e.id !== email.id))
      setTotal(prev => prev - 1)

      toast({
        title: t("success"),
        description: t("deleteSuccess")
      })
      
      if (selectedEmailId === email.id) {
        onEmailSelect(null)
      }
    } catch {
      toast({
        title: t("error"),
        description: t("deleteFailed"),
        variant: "destructive"
      })
    } finally {
      setEmailToDelete(null)
    }
  }

  if (!session) return null

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="p-2 flex justify-between items-center border-b border-primary/20">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              className={cn("h-8 w-8", refreshing && "animate-spin")}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <span className="text-xs text-gray-500">
              {role === ROLES.EMPEROR ? (
                t("emailCountUnlimited", { count: total })
              ) : quota ? (
                <>
                  {t("creditCount", { used: quota.totalCreated, max: quota.max })}
                  {quota.isPremium && <span className="ml-1 text-amber-500">✨</span>}
                </>
              ) : (
                t("emailCount", { count: total, max: "..." })
              )}
            </span>
          </div>
          <CreateDialog onEmailCreated={handleRefresh} disabled={!!quota && quota.remaining === 0 && role !== ROLES.EMPEROR} onLimitReached={() => setShowUpgrade(true)} />
        </div>

        {/* Onboarding for first-time users */}
        {quota && quota.totalCreated === 0 && role !== ROLES.EMPEROR && (
          <OnboardingBanner />
        )}

        {/* Upgrade CTA when limit reached */}
        {quota && quota.remaining === 0 && role !== ROLES.EMPEROR && (
          <div className="mx-2 mt-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 animate-fade-in">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-amber-800 dark:text-amber-300">{t("limitReached")}</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">{t("upgradeMessage")}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex-1 overflow-auto p-2" onScroll={handleScroll}>
          {loading ? (
            <EmailListSkeleton />
          ) : emails.length > 0 ? (
            <div className="space-y-1">
              {emails.map(email => (
                <div
                  key={email.id}
                  className={cn("flex items-center gap-2 p-2 rounded cursor-pointer text-sm group transition-colors duration-150",
                    "hover:bg-primary/5",
                    selectedEmailId === email.id && "bg-primary/10"
                  )}
                  onClick={() => onEmailSelect(email)}
                >
                  <Mail className="h-4 w-4 text-primary/60" />
                  <div className="truncate flex-1">
                    <div className="font-medium truncate">{email.address}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(email.expiresAt).getFullYear() === 9999 ? (
                        t("permanent")
                      ) : (
                        `${t("expiresAt")}: ${new Date(email.expiresAt).toLocaleString()}`
                      )}
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <ShareDialog emailId={email.id} emailAddress={email.address} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEmailToDelete(email)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              {loadingMore && (
                <div className="text-center text-sm text-gray-500 py-2">
                  {t("loadingMore")}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-sm text-gray-500">
              {t("noEmails")}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!emailToDelete} onOpenChange={() => setEmailToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDescription", { email: emailToDelete?.address || "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => emailToDelete && handleDelete(emailToDelete)}
            >
              {tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UpgradeDialog open={showUpgrade} onOpenChange={setShowUpgrade} />
    </>
  )
} 
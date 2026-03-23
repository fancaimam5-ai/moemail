"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"
import { signOut, useSession } from "next-auth/react"
import { LogIn, Shield } from "lucide-react"
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from "next-intl"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface SignButtonProps {
  size?: "default" | "lg"
}

export function SignButton({ size = "default" }: SignButtonProps) {
  const router = useRouter()
  const locale = useLocale()
  const { data: session, status } = useSession()
  const t = useTranslations("auth.signButton")
  const loading = status === "loading"

  if (loading) {
    return <div className="h-9" />
  }

  if (!session?.user) {
    return (
      <Button onClick={() => router.push(`/${locale}/login`)} className={cn("gap-2", size === "lg" ? "px-8" : "")} size={size}>
        <LogIn className={size === "lg" ? "w-5 h-5" : "w-4 h-4"} />
        {t("login")}
      </Button>
    )
  }

  const isAdmin = session.user.roles?.some(r => r.name === "emperor")

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {isAdmin && (
        <Link href={`/${locale}/admin`}>
          <Button variant="outline" size="sm" className="gap-1.5 flex-shrink-0">
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline-block text-xs">{t("adminPanel")}</span>
          </Button>
        </Link>
      )}
      <Link
        href={`/${locale}/profile`}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        {session.user.image && (
          <Image
            src={session.user.image}
            alt={session.user.name || t("userAvatar")}
            width={24}
            height={24}
            className="rounded-full"
          />
        )}
        <span className="hidden sm:inline-block text-sm">{session.user.name}</span>
      </Link>
      <Button onClick={() => signOut({ callbackUrl: `/${locale}` })} variant="outline" size="sm" className="flex-shrink-0">
        {t("logout")}
      </Button>
    </div>
  )
} 
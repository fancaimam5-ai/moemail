"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Loader2, KeyRound, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

interface ResetPasswordFormProps {
  locale: string
}

export function ResetPasswordForm({ locale }: ResetPasswordFormProps) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({})
  const { toast } = useToast()
  const t = useTranslations("auth.resetPassword")
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  if (!token) {
    return (
      <Card className="w-[95%] max-w-lg border-2 border-primary/20">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl">{t("invalidToken")}</CardTitle>
          <CardDescription>{t("invalidTokenDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Link href={`/${locale}/login`}>
            <Button variant="outline">{t("backToLogin")}</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  if (success) {
    return (
      <Card className="w-[95%] max-w-lg border-2 border-primary/20">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-xl">{t("successTitle")}</CardTitle>
          <CardDescription>{t("successDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Link href={`/${locale}/login?reset=true`}>
            <Button>{t("loginNow")}</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  const handleSubmit = async () => {
    const newErrors: { password?: string; confirmPassword?: string } = {}
    if (!password) newErrors.password = t("errors.passwordRequired")
    if (password && password.length < 8) newErrors.password = t("errors.passwordTooShort")
    if (!confirmPassword) newErrors.confirmPassword = t("errors.confirmRequired")
    if (password !== confirmPassword) newErrors.confirmPassword = t("errors.passwordMismatch")
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setLoading(true)
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json() as { error?: string }

      if (!response.ok) {
        toast({
          title: t("error"),
          description: data.error || t("errorDesc"),
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      setSuccess(true)
    } catch {
      toast({
        title: t("error"),
        description: t("errorDesc"),
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  return (
    <Card className="w-[95%] max-w-lg border-2 border-primary/20">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl text-center bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          {t("title")}
        </CardTitle>
        <CardDescription className="text-center">
          {t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <div className="relative">
            <div className="absolute left-2.5 top-2 text-muted-foreground">
              <KeyRound className="h-5 w-5" />
            </div>
            <Input
              className={cn("h-9 pl-9 pr-3", errors.password && "border-destructive focus-visible:ring-destructive")}
              type="password"
              placeholder={t("newPassword")}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors({}) }}
              disabled={loading}
            />
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>
        <div className="space-y-1.5">
          <div className="relative">
            <div className="absolute left-2.5 top-2 text-muted-foreground">
              <KeyRound className="h-5 w-5" />
            </div>
            <Input
              className={cn("h-9 pl-9 pr-3", errors.confirmPassword && "border-destructive focus-visible:ring-destructive")}
              type="password"
              placeholder={t("confirmPassword")}
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setErrors({}) }}
              disabled={loading}
            />
          </div>
          {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
        </div>
        <Button className="w-full" onClick={handleSubmit} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("submit")}
        </Button>
      </CardContent>
    </Card>
  )
}

"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { signIn } from "next-auth/react"
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Loader2, KeyRound, User2, Mail, UserCircle, ArrowLeft, CheckCircle2, AlertCircle, Wand2, Phone, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Turnstile } from "@/components/auth/turnstile"
import { useSearchParams } from "next/navigation"

interface TurnstileConfigProps {
  enabled: boolean
  siteKey: string
}

interface LoginFormProps {
  turnstile?: TurnstileConfigProps
}

interface FormErrors {
  username?: string
  email?: string
  name?: string
  password?: string
  confirmPassword?: string
  phone?: string
  otp?: string
}

type View = "main" | "forgot-password" | "forgot-password-whatsapp" | "forgot-password-whatsapp-otp" | "magic-link" | "register-success" | "forgot-success" | "magic-link-success" | "register-whatsapp" | "register-whatsapp-otp"

export function LoginForm({ turnstile }: LoginFormProps) {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [whatsAppOtp, setWhatsAppOtp] = useState("")
  const [otpTimer, setOtpTimer] = useState(0)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [turnstileToken, setTurnstileToken] = useState("")
  const [turnstileResetCounter, setTurnstileResetCounter] = useState(0)
  const [activeTab, setActiveTab] = useState<"login" | "register">("login")
  const [view, setView] = useState<View>("main")
  const { toast } = useToast()
  const t = useTranslations("auth.loginForm")
  const searchParams = useSearchParams()

  const turnstileSiteKey = turnstile?.siteKey ?? ""
  const turnstileEnabled = Boolean(turnstile?.enabled && turnstileSiteKey)

  // URL param banners
  const verified = searchParams.get("verified") === "true"
  const resetDone = searchParams.get("reset") === "true"
  const magicLinkVerified = searchParams.get("magic_link_verified") === "true"
  const tokenError = searchParams.get("error")
  const magicCode = searchParams.get("magic_code")

  // Auto-login for magic link
  const magicLoginAttempted = useRef(false)
  useEffect(() => {
    if (!magicCode || magicLoginAttempted.current) return
    magicLoginAttempted.current = true
    setLoading(true)

    signIn("magic-link", { code: magicCode, redirect: false }).then((result) => {
      if (result?.error) {
        toast({
          title: t("toast.loginFailed"),
          description: t("banners.expiredToken"),
          variant: "destructive",
        })
        setLoading(false)
      } else {
        window.location.href = "/"
      }
    }).catch(() => {
      setLoading(false)
    })
  }, [magicCode, toast, t])

  const resetTurnstile = useCallback(() => {
    setTurnstileToken("")
    setTurnstileResetCounter((prev) => prev + 1)
  }, [])

  // OTP timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [otpTimer])

  const ensureTurnstileSolved = () => {
    if (!turnstileEnabled) return true
    if (turnstileToken) return true
    toast({
      title: t("toast.turnstileRequired"),
      description: t("toast.turnstileRequiredDesc"),
      variant: "destructive",
    })
    return false
  }

  const clearForm = () => {
    setUsername("")
    setEmail("")
    setName("")
    setPassword("")
    setConfirmPassword("")
    setPhone("")
    setWhatsAppOtp("")
    setErrors({})
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value as "login" | "register")
    clearForm()
  }

  const validateLoginForm = () => {
    const newErrors: FormErrors = {}
    if (!username) newErrors.username = t("errors.usernameRequired")
    if (!password) newErrors.password = t("errors.passwordRequired")
    if (username.includes('@')) newErrors.username = t("errors.usernameInvalid")
    if (password && password.length < 8) newErrors.password = t("errors.passwordTooShort")
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateRegisterForm = () => {
    const newErrors: FormErrors = {}
    if (!username) newErrors.username = t("errors.usernameRequired")
    if (username.includes('@')) newErrors.username = t("errors.usernameInvalid")
    if (!email) newErrors.email = t("errors.emailRequired")
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = t("errors.emailInvalid")
    if (!name.trim()) newErrors.name = t("errors.nameRequired")
    if (!password) newErrors.password = t("errors.passwordRequired")
    if (password && password.length < 8) newErrors.password = t("errors.passwordTooShort")
    if (!confirmPassword) newErrors.confirmPassword = t("errors.confirmPasswordRequired")
    if (password !== confirmPassword) newErrors.confirmPassword = t("errors.passwordMismatch")
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateEmailForm = () => {
    const newErrors: FormErrors = {}
    if (!email) newErrors.email = t("errors.emailRequired")
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = t("errors.emailInvalid")
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validatePhoneForm = () => {
    const newErrors: FormErrors = {}
    const cleaned = phone.replace(/\D/g, "")
    if (!phone) newErrors.phone = "Nomor telepon wajib diisi"
    else if (cleaned.length < 10 || cleaned.length > 13) newErrors.phone = "Nomor telepon tidak valid"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const formatPhoneDisplay = (value: string) => {
    const cleaned = value.replace(/\D/g, "")
    if (cleaned.length <= 4) return cleaned
    if (cleaned.length <= 8) return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8, 12)}`
  }

  const handleLogin = async () => {
    if (!validateLoginForm()) return
    if (!ensureTurnstileSolved()) return

    setLoading(true)
    try {
      const result = await signIn("credentials", {
        username,
        password,
        turnstileToken,
        redirect: false,
      })

      if (result?.error) {
        toast({
          title: t("toast.loginFailed"),
          description: result.error,
          variant: "destructive",
        })
        setLoading(false)
        resetTurnstile()
        return
      }

      window.location.href = "/"
    } catch (error) {
      toast({
        title: t("toast.loginFailed"),
        description: error instanceof Error ? error.message : t("toast.loginFailedDesc"),
        variant: "destructive",
      })
      setLoading(false)
      resetTurnstile()
    }
  }

  const handleRegister = async () => {
    if (!validateRegisterForm()) return
    if (!ensureTurnstileSolved()) return

    setLoading(true)
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, name: name.trim(), password, turnstileToken }),
      })

      const data = await response.json() as { error?: string }

      if (!response.ok) {
        toast({
          title: t("toast.registerFailed"),
          description: data.error || t("toast.registerFailedDesc"),
          variant: "destructive",
        })
        setLoading(false)
        resetTurnstile()
        return
      }

      // Show verification email notice instead of auto-login
      setView("register-success")
      setLoading(false)
    } catch (error) {
      toast({
        title: t("toast.registerFailed"),
        description: error instanceof Error ? error.message : t("toast.registerFailedDesc"),
        variant: "destructive",
      })
      setLoading(false)
      resetTurnstile()
    }
  }

  const handleForgotPassword = async () => {
    if (!validateEmailForm()) return
    if (!ensureTurnstileSolved()) return

    setLoading(true)
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, turnstileToken }),
      })

      if (!response.ok) {
        const data = await response.json() as { error?: string }
        toast({
          title: t("toast.error"),
          description: data.error || t("toast.forgotFailedDesc"),
          variant: "destructive",
        })
        setLoading(false)
        resetTurnstile()
        return
      }

      setView("forgot-success")
      setLoading(false)
    } catch {
      toast({
        title: t("toast.error"),
        description: t("toast.forgotFailedDesc"),
        variant: "destructive",
      })
      setLoading(false)
      resetTurnstile()
    }
  }

  const handleMagicLink = async () => {
    if (!validateEmailForm()) return
    if (!ensureTurnstileSolved()) return

    setLoading(true)
    try {
      const response = await fetch("/api/auth/request-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, turnstileToken }),
      })

      if (!response.ok) {
        const data = await response.json() as { error?: string }
        toast({
          title: t("toast.error"),
          description: data.error || t("toast.magicLinkFailedDesc"),
          variant: "destructive",
        })
        setLoading(false)
        resetTurnstile()
        return
      }

      setView("magic-link-success")
      setLoading(false)
    } catch {
      toast({
        title: t("toast.error"),
        description: t("toast.magicLinkFailedDesc"),
        variant: "destructive",
      })
      setLoading(false)
      resetTurnstile()
    }
  }

  // WhatsApp forgot password - request OTP
  const handleWhatsAppForgotRequest = async () => {
    if (!validatePhoneForm()) return

    setLoading(true)
    try {
      const response = await fetch("/api/auth/whatsapp/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      })

      const data = await response.json() as { success: boolean; error?: string; expires_in?: number }

      if (!response.ok || !data.success) {
        toast({
          title: "Gagal",
          description: data.error || "Gagal mengirim OTP",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      setOtpTimer(60)
      setView("forgot-password-whatsapp-otp")
      setLoading(false)
    } catch {
      toast({
        title: "Gagal",
        description: "Terjadi kesalahan",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  // WhatsApp forgot password - verify OTP and reset
  const handleWhatsAppForgotVerify = async () => {
    if (!whatsAppOtp || whatsAppOtp.length !== 6) {
      setErrors({ otp: "Masukkan 6 digit kode OTP" })
      return
    }
    if (!password || password.length < 8) {
      setErrors({ password: t("errors.passwordTooShort") })
      return
    }
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: t("errors.passwordMismatch") })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/auth/whatsapp/verify-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp: whatsAppOtp, newPassword: password }),
      })

      const data = await response.json() as { success: boolean; error?: string }

      if (!response.ok || !data.success) {
        toast({
          title: "Gagal",
          description: data.error || "Verifikasi gagal",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      setView("forgot-success")
      setLoading(false)
    } catch {
      toast({
        title: "Gagal",
        description: "Terjadi kesalahan",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  // WhatsApp register - request OTP
  const handleWhatsAppRegisterRequest = async () => {
    const newErrors: FormErrors = {}
    if (!username) newErrors.username = t("errors.usernameRequired")
    if (username.includes("@")) newErrors.username = t("errors.usernameInvalid")
    if (!email) newErrors.email = t("errors.emailRequired")
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = t("errors.emailInvalid")
    const cleaned = phone.replace(/\D/g, "")
    if (!phone) newErrors.phone = "Nomor telepon wajib diisi"
    else if (cleaned.length < 10) newErrors.phone = "Nomor telepon tidak valid"
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setLoading(true)
    try {
      const response = await fetch("/api/auth/whatsapp/request-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, email, username }),
      })

      const data = await response.json() as { success: boolean; error?: string }

      if (!response.ok || !data.success) {
        toast({
          title: "Gagal",
          description: data.error || "Gagal mengirim OTP",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      setOtpTimer(60)
      setView("register-whatsapp-otp")
      setLoading(false)
    } catch {
      toast({
        title: "Gagal",
        description: "Terjadi kesalahan",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  // WhatsApp register - verify OTP and create account
  const handleWhatsAppRegisterVerify = async () => {
    if (!whatsAppOtp || whatsAppOtp.length !== 6) {
      setErrors({ otp: "Masukkan 6 digit kode OTP" })
      return
    }
    if (!password || password.length < 8) {
      setErrors({ password: t("errors.passwordTooShort") })
      return
    }
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: t("errors.passwordMismatch") })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/auth/whatsapp/verify-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp: whatsAppOtp, email, username, name: name.trim(), password }),
      })

      const data = await response.json() as { success: boolean; error?: string }

      if (!response.ok || !data.success) {
        toast({
          title: "Gagal",
          description: data.error || "Registrasi gagal",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      toast({
        title: "Berhasil",
        description: "Akun berhasil dibuat. Silakan login.",
      })
      setView("main")
      setActiveTab("login")
      clearForm()
      setLoading(false)
    } catch {
      toast({
        title: "Gagal",
        description: "Terjadi kesalahan",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const goBack = () => {
    setView("main")
    clearForm()
    resetTurnstile()
  }

  // Magic link auto-login in progress
  if (magicCode && loading) {
    return (
      <Card className="w-[95%] max-w-lg border-2 border-primary/20 shadow-xl shadow-primary/5 backdrop-blur-sm bg-card/80">
        <CardHeader className="space-y-3 text-center pb-8">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-100 to-primary/20 dark:from-purple-900/40 dark:to-primary/20 flex items-center justify-center shadow-lg shadow-primary/10">
            <Loader2 className="w-7 h-7 text-primary animate-spin" />
          </div>
          <CardTitle className="text-xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">{t("magicLink.title")}</CardTitle>
          <CardDescription className="text-sm">
            {t("banners.magicLinkVerified")}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Success/info views
  if (view === "register-success") {
    return (
      <Card className="w-[95%] max-w-lg border-2 border-primary/20 shadow-xl shadow-primary/5 backdrop-blur-sm bg-card/80">
        <CardHeader className="space-y-3 text-center pb-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/30 flex items-center justify-center shadow-lg shadow-green-500/10">
            <Mail className="w-7 h-7 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-xl bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">{t("verify.title")}</CardTitle>
          <CardDescription className="text-sm">
            {t("verify.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">{t("verify.checkSpam")}</p>
          <Button variant="outline" onClick={goBack} className="gap-2 border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all">
            <ArrowLeft className="w-4 h-4" />
            {t("actions.backToLogin")}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (view === "forgot-success") {
    return (
      <Card className="w-[95%] max-w-lg border-2 border-primary/20 shadow-xl shadow-primary/5 backdrop-blur-sm bg-card/80">
        <CardHeader className="space-y-3 text-center pb-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-sky-100 dark:from-blue-900/40 dark:to-sky-900/30 flex items-center justify-center shadow-lg shadow-blue-500/10">
            <Mail className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-xl bg-gradient-to-r from-blue-600 to-sky-600 dark:from-blue-400 dark:to-sky-400 bg-clip-text text-transparent">{t("forgot.successTitle")}</CardTitle>
          <CardDescription className="text-sm">
            {t("forgot.successDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">{t("verify.checkSpam")}</p>
          <Button variant="outline" onClick={goBack} className="gap-2 border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all">
            <ArrowLeft className="w-4 h-4" />
            {t("actions.backToLogin")}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (view === "magic-link-success") {
    return (
      <Card className="w-[95%] max-w-lg border-2 border-primary/20 shadow-xl shadow-primary/5 backdrop-blur-sm bg-card/80">
        <CardHeader className="space-y-3 text-center pb-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-100 to-primary/20 dark:from-purple-900/40 dark:to-primary/20 flex items-center justify-center shadow-lg shadow-primary/10">
            <Wand2 className="w-7 h-7 text-primary" />
          </div>
          <CardTitle className="text-xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">{t("magicLink.successTitle")}</CardTitle>
          <CardDescription className="text-sm">
            {t("magicLink.successDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">{t("verify.checkSpam")}</p>
          <Button variant="outline" onClick={goBack} className="gap-2 border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all">
            <ArrowLeft className="w-4 h-4" />
            {t("actions.backToLogin")}
          </Button>
        </CardContent>
      </Card>
    )
  }

  // WhatsApp register - input form
  if (view === "register-whatsapp") {
    return (
      <Card className="w-[95%] max-w-lg border-2 border-primary/20 shadow-xl shadow-primary/5 backdrop-blur-sm bg-card/80">
        <CardHeader className="space-y-3">
          <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors w-fit group">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            {t("actions.back")}
          </button>
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/30 flex items-center justify-center shadow-lg shadow-green-500/10">
            <MessageCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl text-center bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
            Daftar via WhatsApp
          </CardTitle>
          <CardDescription className="text-center">
            Verifikasi nomor WhatsApp untuk membuat akun
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-green-500 transition-colors">
                <User2 className="h-4.5 w-4.5" />
              </div>
              <Input
                className={cn("h-10 pl-10 pr-3 bg-muted/30 border-primary/10", errors.username && "border-destructive")}
                placeholder={t("fields.username")}
                value={username}
                onChange={(e) => { setUsername(e.target.value); setErrors({}) }}
                disabled={loading}
              />
            </div>
            {errors.username && <p className="text-xs text-destructive">{errors.username}</p>}
          </div>

          <div className="space-y-1.5">
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-green-500 transition-colors">
                <Mail className="h-4.5 w-4.5" />
              </div>
              <Input
                className={cn("h-10 pl-10 pr-3 bg-muted/30 border-primary/10", errors.email && "border-destructive")}
                type="email"
                placeholder={t("fields.email")}
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors({}) }}
                disabled={loading}
              />
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-green-500 transition-colors">
                <UserCircle className="h-4.5 w-4.5" />
              </div>
              <Input
                className={cn("h-10 pl-10 pr-3 bg-muted/30 border-primary/10", errors.name && "border-destructive")}
                placeholder={t("fields.name")}
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors({}) }}
                disabled={loading}
              />
            </div>
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-green-500 transition-colors">
                <Phone className="h-4.5 w-4.5" />
              </div>
              <Input
                className={cn("h-10 pl-10 pr-3 bg-muted/30 border-primary/10", errors.phone && "border-destructive")}
                type="tel"
                placeholder="08123456789"
                value={formatPhoneDisplay(phone)}
                onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "")); setErrors({}) }}
                disabled={loading}
                maxLength={16}
              />
            </div>
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>

          <Button className="w-full h-10 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-600/90 hover:to-emerald-600/90 shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all" onClick={handleWhatsAppRegisterRequest} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kirim Kode OTP
          </Button>
        </CardContent>
      </Card>
    )
  }

  // WhatsApp register - OTP verification and password
  if (view === "register-whatsapp-otp") {
    return (
      <Card className="w-[95%] max-w-lg border-2 border-primary/20 shadow-xl shadow-primary/5 backdrop-blur-sm bg-card/80">
        <CardHeader className="space-y-3">
          <button onClick={() => setView("register-whatsapp")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors w-fit group">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            {t("actions.back")}
          </button>
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/30 flex items-center justify-center shadow-lg shadow-green-500/10">
            <CheckCircle2 className="w-7 h-7 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl text-center bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
            Verifikasi & Buat Akun
          </CardTitle>
          <CardDescription className="text-center">
            Masukkan kode OTP dan buat password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Kode OTP (6 digit)</label>
            <Input
              className={cn("h-10 text-center text-lg tracking-widest font-mono", errors.otp && "border-destructive")}
              type="text"
              placeholder="000000"
              value={whatsAppOtp}
              onChange={(e) => { setWhatsAppOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setErrors({}) }}
              disabled={loading}
              maxLength={6}
            />
            {errors.otp && <p className="text-xs text-destructive">{errors.otp}</p>}
            {otpTimer > 0 && <p className="text-xs text-center text-muted-foreground">Kirim ulang dalam {otpTimer}s</p>}
            {otpTimer === 0 && (
              <button type="button" onClick={handleWhatsAppRegisterRequest} className="text-xs text-green-600 hover:underline w-full text-center" disabled={loading}>
                Kirim ulang OTP
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Password</label>
            <Input
              className={cn("h-10", errors.password && "border-destructive")}
              type="password"
              placeholder="Minimal 8 karakter"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors({}) }}
              disabled={loading}
            />
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Konfirmasi Password</label>
            <Input
              className={cn("h-10", errors.confirmPassword && "border-destructive")}
              type="password"
              placeholder="Ulangi password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setErrors({}) }}
              disabled={loading}
            />
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
          </div>

          <Button className="w-full h-10 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-600/90 hover:to-emerald-600/90 shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all" onClick={handleWhatsAppRegisterVerify} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Buat Akun
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Forgot password view
  if (view === "forgot-password") {
    return (
      <Card className="w-[95%] max-w-lg border-2 border-primary/20 shadow-xl shadow-primary/5 backdrop-blur-sm bg-card/80">
        <CardHeader className="space-y-3">
          <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors w-fit group">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            {t("actions.back")}
          </button>
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20 flex items-center justify-center shadow-lg shadow-primary/10">
            <KeyRound className="w-7 h-7 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            {t("forgot.title")}
          </CardTitle>
          <CardDescription className="text-center">
            {t("forgot.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                <Mail className="h-4.5 w-4.5" />
              </div>
              <Input
                className={cn("h-10 pl-10 pr-3 bg-muted/30 border-primary/10 focus-visible:border-primary/30 focus-visible:ring-primary/20 transition-all", errors.email && "border-destructive focus-visible:ring-destructive")}
                type="email"
                placeholder={t("fields.email")}
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors({}) }}
                disabled={loading}
              />
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          {turnstileEnabled && (
            <div className="flex justify-center">
              <Turnstile siteKey={turnstileSiteKey} onVerify={setTurnstileToken} resetSignal={turnstileResetCounter} />
            </div>
          )}

          <Button className="w-full h-10 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" onClick={handleForgotPassword} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("actions.sendResetLink")}
          </Button>

          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-primary/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground">atau</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full h-10 border-green-500/30 hover:bg-green-500/10 hover:border-green-500/50 text-green-600 dark:text-green-400"
            onClick={() => { setView("forgot-password-whatsapp"); clearForm() }}
            disabled={loading}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Reset via WhatsApp
          </Button>
        </CardContent>
      </Card>
    )
  }

  // WhatsApp forgot password - phone input
  if (view === "forgot-password-whatsapp") {
    return (
      <Card className="w-[95%] max-w-lg border-2 border-primary/20 shadow-xl shadow-primary/5 backdrop-blur-sm bg-card/80">
        <CardHeader className="space-y-3">
          <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors w-fit group">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            {t("actions.back")}
          </button>
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/30 flex items-center justify-center shadow-lg shadow-green-500/10">
            <MessageCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl text-center bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
            Reset via WhatsApp
          </CardTitle>
          <CardDescription className="text-center">
            Masukkan nomor WhatsApp yang terdaftar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-green-500 transition-colors">
                <Phone className="h-4.5 w-4.5" />
              </div>
              <Input
                className={cn("h-10 pl-10 pr-3 bg-muted/30 border-primary/10 focus-visible:border-green-500/30 focus-visible:ring-green-500/20 transition-all", errors.phone && "border-destructive focus-visible:ring-destructive")}
                type="tel"
                placeholder="08123456789"
                value={formatPhoneDisplay(phone)}
                onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "")); setErrors({}) }}
                disabled={loading}
                maxLength={16}
              />
            </div>
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>

          <Button className="w-full h-10 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-600/90 hover:to-emerald-600/90 shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all" onClick={handleWhatsAppForgotRequest} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kirim Kode OTP
          </Button>
        </CardContent>
      </Card>
    )
  }

  // WhatsApp forgot password - OTP input and new password
  if (view === "forgot-password-whatsapp-otp") {
    return (
      <Card className="w-[95%] max-w-lg border-2 border-primary/20 shadow-xl shadow-primary/5 backdrop-blur-sm bg-card/80">
        <CardHeader className="space-y-3">
          <button onClick={() => setView("forgot-password-whatsapp")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors w-fit group">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            {t("actions.back")}
          </button>
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/30 flex items-center justify-center shadow-lg shadow-green-500/10">
            <KeyRound className="w-7 h-7 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl text-center bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
            Verifikasi & Reset
          </CardTitle>
          <CardDescription className="text-center">
            Masukkan kode OTP dan password baru
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Kode OTP (6 digit)</label>
            <Input
              className={cn("h-10 text-center text-lg tracking-widest font-mono", errors.otp && "border-destructive")}
              type="text"
              placeholder="000000"
              value={whatsAppOtp}
              onChange={(e) => { setWhatsAppOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setErrors({}) }}
              disabled={loading}
              maxLength={6}
            />
            {errors.otp && <p className="text-xs text-destructive">{errors.otp}</p>}
            {otpTimer > 0 && <p className="text-xs text-center text-muted-foreground">Kirim ulang dalam {otpTimer}s</p>}
            {otpTimer === 0 && (
              <button type="button" onClick={handleWhatsAppForgotRequest} className="text-xs text-green-600 hover:underline w-full text-center" disabled={loading}>
                Kirim ulang OTP
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Password Baru</label>
            <Input
              className={cn("h-10", errors.password && "border-destructive")}
              type="password"
              placeholder="Minimal 8 karakter"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors({}) }}
              disabled={loading}
            />
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Konfirmasi Password</label>
            <Input
              className={cn("h-10", errors.confirmPassword && "border-destructive")}
              type="password"
              placeholder="Ulangi password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setErrors({}) }}
              disabled={loading}
            />
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
          </div>

          <Button className="w-full h-10 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-600/90 hover:to-emerald-600/90 shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all" onClick={handleWhatsAppForgotVerify} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reset Password
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Magic link view
  if (view === "magic-link") {
    return (
      <Card className="w-[95%] max-w-lg border-2 border-primary/20 shadow-xl shadow-primary/5 backdrop-blur-sm bg-card/80">
        <CardHeader className="space-y-3">
          <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors w-fit group">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            {t("actions.back")}
          </button>
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-100 to-primary/20 dark:from-purple-900/40 dark:to-primary/20 flex items-center justify-center shadow-lg shadow-primary/10">
            <Wand2 className="w-7 h-7 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            {t("magicLink.title")}
          </CardTitle>
          <CardDescription className="text-center">
            {t("magicLink.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                <Mail className="h-4.5 w-4.5" />
              </div>
              <Input
                className={cn("h-10 pl-10 pr-3 bg-muted/30 border-primary/10 focus-visible:border-primary/30 focus-visible:ring-primary/20 transition-all", errors.email && "border-destructive focus-visible:ring-destructive")}
                type="email"
                placeholder={t("fields.email")}
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors({}) }}
                disabled={loading}
              />
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          {turnstileEnabled && (
            <div className="flex justify-center">
              <Turnstile siteKey={turnstileSiteKey} onVerify={setTurnstileToken} resetSignal={turnstileResetCounter} />
            </div>
          )}

          <Button className="w-full h-10 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" onClick={handleMagicLink} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Wand2 className="mr-2 h-4 w-4" />
            {t("actions.sendMagicLink")}
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Main login/register view
  return (
    <Card className="w-[95%] max-w-lg border-2 border-primary/20 shadow-xl shadow-primary/5 backdrop-blur-sm bg-card/80">
      <CardHeader className="space-y-3 pb-4">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20 flex items-center justify-center shadow-lg shadow-primary/10">
          <Mail className="w-7 h-7 text-primary" />
        </div>
        <CardTitle className="text-2xl text-center bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          {t("title")}
        </CardTitle>
        <CardDescription className="text-center">
          {t("subtitle")}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6">
        {/* URL param banners */}
        {verified && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3.5 text-sm text-green-700 dark:text-green-300 shadow-sm">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            {t("banners.verified")}
          </div>
        )}
        {resetDone && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3.5 text-sm text-green-700 dark:text-green-300 shadow-sm">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            {t("banners.resetDone")}
          </div>
        )}
        {magicLinkVerified && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3.5 text-sm text-green-700 dark:text-green-300 shadow-sm">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            {t("banners.magicLinkVerified")}
          </div>
        )}
        {tokenError && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3.5 text-sm text-red-700 dark:text-red-300 shadow-sm">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
            {tokenError === "expired_token" ? t("banners.expiredToken") : t("banners.invalidToken")}
          </div>
        )}

        <Tabs value={activeTab} className="w-full" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2 mb-6 h-11 bg-muted/60 p-1 rounded-xl">
            <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 transition-all duration-200 font-medium">{t("tabs.login")}</TabsTrigger>
            <TabsTrigger value="register" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 transition-all duration-200 font-medium">{t("tabs.register")}</TabsTrigger>
          </TabsList>
          <div className="min-h-[220px]">
            <TabsContent value="login" className="space-y-4 mt-0">
              <form onSubmit={(e) => { e.preventDefault(); handleLogin() }} className="space-y-3">
                <div className="space-y-1.5">
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                      <User2 className="h-4.5 w-4.5" />
                    </div>
                    <Input
                      className={cn(
                        "h-10 pl-10 pr-3 bg-muted/30 border-primary/10 focus-visible:border-primary/30 focus-visible:ring-primary/20 transition-all",
                        errors.username && "border-destructive focus-visible:ring-destructive"
                      )}
                      placeholder={t("fields.username")}
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value)
                        setErrors({})
                      }}
                      disabled={loading}
                    />
                  </div>
                  {errors.username && (
                    <p className="text-xs text-destructive">{errors.username}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                      <KeyRound className="h-4.5 w-4.5" />
                    </div>
                    <Input
                      className={cn(
                        "h-10 pl-10 pr-3 bg-muted/30 border-primary/10 focus-visible:border-primary/30 focus-visible:ring-primary/20 transition-all",
                        errors.password && "border-destructive focus-visible:ring-destructive"
                      )}
                      type="password"
                      placeholder={t("fields.password")}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setErrors({})
                      }}
                      disabled={loading}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password}</p>
                  )}
                </div>
              </form>

              <div className="space-y-3 pt-1">
                <Button
                  className="w-full h-10 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-medium"
                  onClick={handleLogin}
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("actions.login")}
                </Button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => { setView("forgot-password"); clearForm() }}
                    className="text-muted-foreground hover:text-primary transition-colors duration-200"
                  >
                    {t("actions.forgotPassword")}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setView("magic-link"); clearForm() }}
                    className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-1"
                  >
                    <Wand2 className="w-3 h-3" />
                    {t("actions.loginMagicLink")}
                  </button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="register" className="space-y-4 mt-0">
              <form onSubmit={(e) => { e.preventDefault(); handleRegister() }} className="space-y-3">
                <div className="space-y-1.5">
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                      <User2 className="h-4.5 w-4.5" />
                    </div>
                    <Input
                      className={cn(
                        "h-10 pl-10 pr-3 bg-muted/30 border-primary/10 focus-visible:border-primary/30 focus-visible:ring-primary/20 transition-all",
                        errors.username && "border-destructive focus-visible:ring-destructive"
                      )}
                      placeholder={t("fields.username")}
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value)
                        setErrors({})
                      }}
                      disabled={loading}
                    />
                  </div>
                  {errors.username && (
                    <p className="text-xs text-destructive">{errors.username}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                      <Mail className="h-4.5 w-4.5" />
                    </div>
                    <Input
                      className={cn(
                        "h-10 pl-10 pr-3 bg-muted/30 border-primary/10 focus-visible:border-primary/30 focus-visible:ring-primary/20 transition-all",
                        errors.email && "border-destructive focus-visible:ring-destructive"
                      )}
                      type="email"
                      placeholder={t("fields.email")}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        setErrors({})
                      }}
                      disabled={loading}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                      <UserCircle className="h-4.5 w-4.5" />
                    </div>
                    <Input
                      className={cn(
                        "h-10 pl-10 pr-3 bg-muted/30 border-primary/10 focus-visible:border-primary/30 focus-visible:ring-primary/20 transition-all",
                        errors.name && "border-destructive focus-visible:ring-destructive"
                      )}
                      placeholder={t("fields.name")}
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value)
                        setErrors({})
                      }}
                      disabled={loading}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                      <KeyRound className="h-4.5 w-4.5" />
                    </div>
                    <Input
                      className={cn(
                        "h-10 pl-10 pr-3 bg-muted/30 border-primary/10 focus-visible:border-primary/30 focus-visible:ring-primary/20 transition-all",
                        errors.password && "border-destructive focus-visible:ring-destructive"
                      )}
                      type="password"
                      placeholder={t("fields.password")}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setErrors({})
                      }}
                      disabled={loading}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                      <KeyRound className="h-4.5 w-4.5" />
                    </div>
                    <Input
                      className={cn(
                        "h-10 pl-10 pr-3 bg-muted/30 border-primary/10 focus-visible:border-primary/30 focus-visible:ring-primary/20 transition-all",
                        errors.confirmPassword && "border-destructive focus-visible:ring-destructive"
                      )}
                      type="password"
                      placeholder={t("fields.confirmPassword")}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        setErrors({})
                      }}
                      disabled={loading}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>
              </form>

              <div className="space-y-3 pt-1">
                <Button
                  className="w-full h-10 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-medium"
                  onClick={handleRegister}
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("actions.register")}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-primary/10" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-2 text-muted-foreground">atau</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full h-10 border-green-500/30 hover:bg-green-500/10 hover:border-green-500/50 text-green-600 dark:text-green-400"
                  onClick={() => { setView("register-whatsapp"); clearForm() }}
                  disabled={loading}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Daftar via WhatsApp
                </Button>
              </div>
            </TabsContent>
          </div>

          {turnstileEnabled && (
            <div className="flex justify-center mt-4">
              <Turnstile siteKey={turnstileSiteKey} onVerify={setTurnstileToken} resetSignal={turnstileResetCounter} />
            </div>
          )}
        </Tabs>
      </CardContent>
    </Card>
  )
}

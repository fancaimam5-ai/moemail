"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, Copy, CheckCircle, ExternalLink, RefreshCw, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { nanoid } from "nanoid"
import { useRouter, usePathname } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Turnstile } from "@/components/auth/turnstile"

interface EmailCreationCardProps {
  isLoggedIn: boolean
  domains: string[]
  turnstileSiteKey: string
  turnstileEnabled: boolean
}

interface CreationResult {
  email: string
  credential: string
  expiresAt: string
}

export function EmailCreationCard({
  isLoggedIn,
  domains,
  turnstileSiteKey,
  turnstileEnabled,
}: EmailCreationCardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const locale = pathname.split("/")[1] || "en"

  const [emailName, setEmailName] = useState("")
  const [domain, setDomain] = useState(domains[0] || "ifmail.email")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [shaking, setShaking] = useState(false)
  const [result, setResult] = useState<CreationResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState("")
  const [turnstileReset, setTurnstileReset] = useState(0)

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token)
  }, [])

  const generateRandomName = () => setEmailName(nanoid(8))

  const triggerError = (msg: string) => {
    setError(msg)
    setShaking(true)
    setTimeout(() => setShaking(false), 400)
  }

  const handleCreate = async () => {
    setError("")
    setLoading(true)

    try {
      const name = emailName.trim() || nanoid(8)

      if (!/^[a-zA-Z0-9._-]+$/.test(name) || name.length > 30) {
        triggerError("Invalid email name. Use only letters, numbers, dots, hyphens, underscores.")
        setLoading(false)
        return
      }

      if (isLoggedIn) {
        // Authenticated flow
        const res = await fetch("/api/emails/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            domain,
            expiryTime: 1000 * 60 * 60 * 24 * 3, // 3 days default
          }),
        })

        if (!res.ok) {
          const data = (await res.json()) as { error: string }
          triggerError(data.error || "Failed to create email")
          return
        }

        const data = (await res.json()) as { email: string; credential: string }
        setResult({
          email: data.email,
          credential: data.credential,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
        })
      } else {
        // Guest flow
        if (turnstileEnabled && turnstileSiteKey && !turnstileToken) {
          triggerError("Please complete the captcha verification first.")
          setLoading(false)
          return
        }

        const res = await fetch("/api/emails/guest-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            domain,
            turnstileToken: turnstileEnabled ? turnstileToken : undefined,
          }),
        })

        if (!res.ok) {
          const data = (await res.json()) as { error: string; code?: string }
          if (data.code === "GUEST_LIMIT") {
            triggerError("Guest limit reached (1 email per IP). Sign up to create more!")
          } else {
            triggerError(data.error || "Failed to create email")
          }
          return
        }

        const data = (await res.json()) as {
          email: string
          credential: string
          expiresAt: string
        }
        setResult(data)
      }
    } catch {
      triggerError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
      setTurnstileToken("")
      setTurnstileReset((c) => c + 1)
    }
  }

  const copyCredentialLink = () => {
    if (!result) return
    const link = `${window.location.origin}/${locale}/mail/${result.credential}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const openMailbox = () => {
    if (!result) return
    router.push(`/${locale}/mail/${result.credential}`)
  }

  if (result) {
    return (
      <div className="w-full max-w-lg mx-auto p-6 rounded-xl border-2 border-primary/30 bg-white/80 dark:bg-gray-900/80 backdrop-blur shadow-lg space-y-4 animate-scale-in">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-primary">
            <CheckCircle className="w-6 h-6 animate-scale-in" />
            <span className="text-lg font-semibold">Email Created!</span>
          </div>
          <p className="text-xl font-mono font-bold text-gray-900 dark:text-gray-100">
            {result.email}
          </p>
          <p className="text-sm text-gray-500">
            Expires: {new Date(result.expiresAt).toLocaleDateString()}{" "}
            {new Date(result.expiresAt).toLocaleTimeString()}
          </p>
        </div>

        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-800 dark:text-amber-200 font-medium mb-1">
            Save this link to access your mailbox:
          </p>
          <p className="text-xs font-mono text-amber-700 dark:text-amber-300 break-all">
            {window.location.origin}/{locale}/mail/{result.credential}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={openMailbox} className="flex-1 gap-2">
            <ExternalLink className="w-4 h-4" />
            Open Mailbox
          </Button>
          <Button
            variant="outline"
            onClick={copyCredentialLink}
            className="flex-1 gap-2 active:scale-[0.97] transition-transform duration-100"
          >
            {copied ? (
              <CheckCircle className="w-4 h-4 text-green-500 animate-scale-in" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copied ? "Copied!" : "Copy Link"}
          </Button>
        </div>

        <Button
          variant="ghost"
          className="w-full text-sm"
          onClick={() => setResult(null)}
        >
          Create another email
        </Button>
      </div>
    )
  }

  return (
    <div className={cn(
      "w-full max-w-lg mx-auto p-6 rounded-xl border-2 border-primary/20 bg-white/80 dark:bg-gray-900/80 backdrop-blur shadow-lg space-y-4",
      shaking && "animate-shake"
    )}>
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-2 text-primary">
          <Mail className="w-5 h-5" />
          <span className="text-lg font-semibold">Create Temporary Email</span>
        </div>
        <p className="text-sm text-gray-500">
          {isLoggedIn
            ? "Create a new disposable email address"
            : "No account needed — create one instantly"}
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={emailName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmailName(e.target.value)}
              placeholder="username"
              className="pr-9"
              maxLength={30}
            />
            <button
              type="button"
              onClick={generateRandomName}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
              title="Generate random name"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <span className="flex items-center text-gray-400 font-mono">@</span>
          <Select value={domain} onValueChange={setDomain}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {domains.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center animate-fade-in">{error}</p>
        )}

        {!isLoggedIn && turnstileEnabled && turnstileSiteKey && (
          <div className="flex justify-center">
            <Turnstile
              siteKey={turnstileSiteKey}
              onVerify={handleTurnstileVerify}
              resetSignal={turnstileReset}
            />
          </div>
        )}

        <Button
          onClick={handleCreate}
          disabled={loading || (!isLoggedIn && turnstileEnabled && !!turnstileSiteKey && !turnstileToken)}
          className="w-full gap-2 active:scale-[0.97] transition-transform duration-100"
          size="lg"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Mail className="w-4 h-4" />
          )}
          {loading ? "Creating..." : "Create Email"}
        </Button>
      </div>

      {!isLoggedIn && (
        <p className="text-xs text-center text-gray-400">
          Guest emails expire in 3 days. Sign up for more options.
        </p>
      )}
    </div>
  )
}

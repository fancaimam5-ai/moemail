"use client"

import { useState } from "react"
import { Book, Copy, Check, ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Endpoint {
  method: "GET" | "POST" | "DELETE" | "PATCH"
  path: string
  desc: string
  auth: "API Key" | "None"
  params?: { name: string; type: string; desc: string }[]
  response?: string
}

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  POST: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  PATCH: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
}

const SECTIONS: { title: string; endpoints: Endpoint[] }[] = [
  {
    title: "Emails",
    endpoints: [
      {
        method: "GET",
        path: "/api/emails",
        desc: "List all your email addresses",
        auth: "API Key",
        response: `{ "emails": [{ "id": "...", "address": "user@domain.com", "expiresAt": "..." }] }`,
      },
      {
        method: "POST",
        path: "/api/emails/generate",
        desc: "Create a new email address",
        auth: "API Key",
        params: [
          { name: "name", type: "string?", desc: "Custom email name (optional, auto-generated if empty)" },
          { name: "domain", type: "string", desc: "Domain to use (e.g. ifmail.email)" },
          { name: "expiryTime", type: "number", desc: "Expiry in ms (0 = permanent for premium)" },
        ],
        response: `{ "email": { "id": "...", "address": "name@domain.com" } }`,
      },
      {
        method: "DELETE",
        path: "/api/emails/{id}",
        desc: "Delete an email address and all its messages",
        auth: "API Key",
      },
    ],
  },
  {
    title: "Messages",
    endpoints: [
      {
        method: "GET",
        path: "/api/emails/{id}",
        desc: "List messages for an email address",
        auth: "API Key",
        params: [
          { name: "type", type: "query: 'sent'", desc: "Set to 'sent' to get sent messages (default: received)" },
          { name: "cursor", type: "query: string", desc: "Pagination cursor" },
        ],
        response: `{ "messages": [{ "id": "...", "subject": "...", "from_address": "...", "received_at": 123 }], "nextCursor": "...", "total": 5 }`,
      },
      {
        method: "GET",
        path: "/api/emails/{id}/{messageId}",
        desc: "Get full message content (HTML + text). Marks message as read.",
        auth: "API Key",
        response: `{ "message": { "id": "...", "subject": "...", "html": "...", "content": "..." } }`,
      },
      {
        method: "DELETE",
        path: "/api/emails/{id}/{messageId}",
        desc: "Delete a specific message",
        auth: "API Key",
      },
    ],
  },
  {
    title: "Send Email",
    endpoints: [
      {
        method: "POST",
        path: "/api/emails/{id}/send",
        desc: "Send an email (Knight+ role required, email service must be configured)",
        auth: "API Key",
        params: [
          { name: "to", type: "string", desc: "Recipient email address" },
          { name: "subject", type: "string", desc: "Email subject" },
          { name: "text", type: "string?", desc: "Plain text body" },
          { name: "html", type: "string?", desc: "HTML body" },
        ],
        response: `{ "success": true, "messageId": "..." }`,
      },
    ],
  },
  {
    title: "Credential-based Access",
    endpoints: [
      {
        method: "GET",
        path: "/api/mail/{credential}",
        desc: "Get email info by credential token (no API key needed, used for public access links)",
        auth: "None",
        response: `{ "id": "...", "address": "...", "expiresAt": "..." }`,
      },
      {
        method: "GET",
        path: "/api/mail/{credential}/messages",
        desc: "List messages by credential token",
        auth: "None",
      },
      {
        method: "GET",
        path: "/api/mail/{credential}/messages/{messageId}",
        desc: "Get message by credential token",
        auth: "None",
      },
    ],
  },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="p-1 rounded hover:bg-muted transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
    </button>
  )
}

function EndpointCard({ ep }: { ep: Endpoint }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
      >
        <span className={cn("text-xs font-bold px-2 py-0.5 rounded", METHOD_COLORS[ep.method])}>
          {ep.method}
        </span>
        <code className="text-sm font-mono flex-1 truncate">{ep.path}</code>
        {open ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
      </button>
      {open && (
        <div className="border-t p-4 space-y-3 bg-muted/20">
          <p className="text-sm">{ep.desc}</p>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium">Auth:</span>
            <span className={cn(
              "px-2 py-0.5 rounded-full",
              ep.auth === "API Key" ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
            )}>{ep.auth}</span>
          </div>
          {ep.params && (
            <div>
              <p className="text-xs font-medium mb-1">Parameters:</p>
              <div className="space-y-1">
                {ep.params.map(p => (
                  <div key={p.name} className="flex gap-2 text-xs">
                    <code className="font-mono text-primary">{p.name}</code>
                    <span className="text-muted-foreground">({p.type})</span>
                    <span>{p.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {ep.response && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-medium">Response:</p>
                <CopyButton text={ep.response} />
              </div>
              <pre className="text-xs bg-background border rounded p-2 overflow-x-auto">
                <code>{ep.response}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ApiDocsContent() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Book className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">API Documentation</h1>
          <p className="text-sm text-muted-foreground">Use the IfMail API to manage emails programmatically</p>
        </div>
      </div>

      {/* Auth section */}
      <div className="border rounded-lg p-5 space-y-3 bg-card">
        <h2 className="font-semibold text-lg">Authentication</h2>
        <p className="text-sm text-muted-foreground">
          All authenticated endpoints require an API key sent via the <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">X-API-Key</code> header.
        </p>
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium">Example:</p>
          <CopyButton text='curl -H "X-API-Key: your-api-key" https://if-mail.tech/api/emails' />
        </div>
        <pre className="text-xs bg-muted rounded p-3 overflow-x-auto">
          <code>{`curl -H "X-API-Key: your-api-key" https://if-mail.tech/api/emails`}</code>
        </pre>
        <p className="text-xs text-muted-foreground">
          Create API keys from your <strong>Profile</strong> page. Each user can have up to 10 API keys.
        </p>
      </div>

      {/* Rate limits */}
      <div className="border rounded-lg p-5 space-y-2 bg-card">
        <h2 className="font-semibold text-lg">Rate Limits</h2>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc ml-4">
          <li>Email sending: 2/day (Free), 5/day (Premium)</li>
          <li>Global sending cap: 90 emails/day across all users</li>
          <li>API key limit: 10 keys per user</li>
        </ul>
      </div>

      {/* Endpoints */}
      {SECTIONS.map(section => (
        <div key={section.title} className="space-y-3">
          <h2 className="font-semibold text-lg border-b pb-2">{section.title}</h2>
          <div className="space-y-2">
            {section.endpoints.map(ep => (
              <EndpointCard key={`${ep.method}-${ep.path}`} ep={ep} />
            ))}
          </div>
        </div>
      ))}

      {/* Error codes */}
      <div className="border rounded-lg p-5 space-y-3 bg-card">
        <h2 className="font-semibold text-lg">Error Codes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div className="flex gap-2"><code className="font-mono text-red-500">401</code> Unauthorized (missing/invalid API key)</div>
          <div className="flex gap-2"><code className="font-mono text-red-500">403</code> Forbidden (insufficient permissions)</div>
          <div className="flex gap-2"><code className="font-mono text-red-500">404</code> Not found</div>
          <div className="flex gap-2"><code className="font-mono text-red-500">429</code> Rate limit exceeded</div>
        </div>
      </div>
    </div>
  )
}

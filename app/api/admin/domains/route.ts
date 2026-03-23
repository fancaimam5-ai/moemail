import { requireAdmin, logAdminAction } from "@/lib/admin"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { createDb } from "@/lib/db"
import { emails } from "@/lib/schema"
import { like, count } from "drizzle-orm"

function getConfiguredDomains(domainString: string | null): string[] {
  if (!domainString) return ["ifmail.email"]
  const normalized = domainString.trim()
  if (!normalized || normalized === "undefined" || normalized === "null") {
    return ["ifmail.email"]
  }
  const domains = normalized.split(",").map(d => d.trim()).filter(Boolean)
  return domains.length > 0 ? domains : ["ifmail.email"]
}

export async function GET() {
  const { error, status } = await requireAdmin()
  if (error) return Response.json({ error }, { status })

  const env = getCloudflareContext().env
  const domainsStr = await env.SITE_CONFIG.get("EMAIL_DOMAINS")
  const domainList = getConfiguredDomains(domainsStr)

  const db = createDb()

  const domains = await Promise.all(
    domainList.map(async (domain) => {
      const [result] = await db.select({ count: count() }).from(emails).where(like(emails.address, `%@${domain}`))
      return { domain, emailCount: result.count }
    })
  )

  return Response.json({ domains })
}

export async function POST(request: Request) {
  const { error, status, userId: adminId } = await requireAdmin()
  if (error) return Response.json({ error }, { status })

  const { domain } = (await request.json()) as { domain: string }
  if (!domain || !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain)) {
    return Response.json({ error: "Invalid domain format" }, { status: 400 })
  }

  const env = getCloudflareContext().env
  const domainsStr = await env.SITE_CONFIG.get("EMAIL_DOMAINS")
  const domainList = getConfiguredDomains(domainsStr)

  if (domainList.includes(domain.toLowerCase())) {
    return Response.json({ error: "Domain already exists" }, { status: 400 })
  }

  domainList.push(domain.toLowerCase())
  await env.SITE_CONFIG.put("EMAIL_DOMAINS", domainList.join(","))

  await logAdminAction(adminId!, "add_domain", "domain", undefined, { domain: domain.toLowerCase() })

  return Response.json({ success: true })
}

export async function DELETE(request: Request) {
  const { error, status, userId: adminId } = await requireAdmin()
  if (error) return Response.json({ error }, { status })

  const url = new URL(request.url)
  const domain = url.searchParams.get("domain")
  if (!domain) return Response.json({ error: "Missing domain" }, { status: 400 })

  const env = getCloudflareContext().env
  const domainsStr = await env.SITE_CONFIG.get("EMAIL_DOMAINS")
  const domainList = getConfiguredDomains(domainsStr)

  const filtered = domainList.filter(d => d !== domain)
  if (filtered.length === domainList.length) {
    return Response.json({ error: "Domain not found" }, { status: 404 })
  }
  if (filtered.length === 0) {
    return Response.json({ error: "Cannot remove last domain" }, { status: 400 })
  }

  await env.SITE_CONFIG.put("EMAIL_DOMAINS", filtered.join(","))
  await logAdminAction(adminId!, "remove_domain", "domain", undefined, { domain })

  return Response.json({ success: true })
}

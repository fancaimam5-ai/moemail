import { createDb } from "@/lib/db"
import { emailProviders } from "@/lib/schema"
import { requireAdmin, logAdminAction } from "@/lib/admin"
import { eq, desc } from "drizzle-orm"
import { encrypt } from "@/lib/email/crypto"
import { testProvider } from "@/lib/email"

// GET: List all email providers
export async function GET() {
  const { error, status } = await requireAdmin()
  if (error) return Response.json({ error }, { status })

  const db = createDb()
  const providers = await db
    .select({
      id: emailProviders.id,
      label: emailProviders.label,
      providerType: emailProviders.providerType,
      fromEmail: emailProviders.fromEmail,
      fromName: emailProviders.fromName,
      replyTo: emailProviders.replyTo,
      priority: emailProviders.priority,
      status: emailProviders.status,
      isDefault: emailProviders.isDefault,
      lastTestedAt: emailProviders.lastTestedAt,
      lastTestResult: emailProviders.lastTestResult,
      totalSent: emailProviders.totalSent,
      totalFailed: emailProviders.totalFailed,
      relayEndpoint: emailProviders.relayEndpoint,
      createdAt: emailProviders.createdAt,
      updatedAt: emailProviders.updatedAt,
      // Don't expose encrypted keys
    })
    .from(emailProviders)
    .orderBy(emailProviders.priority, desc(emailProviders.createdAt))

  return Response.json({ providers })
}

// POST: Create a new email provider
export async function POST(request: Request) {
  const { error, status, userId: adminId } = await requireAdmin()
  if (error) return Response.json({ error }, { status })

  const body = await request.json() as {
    label: string
    providerType: string
    apiKey?: string
    fromEmail: string
    fromName?: string
    replyTo?: string
    priority?: number
    relayEndpoint?: string
    relayAuth?: string
  }

  if (!body.label || !body.fromEmail) {
    return Response.json({ error: "Missing required fields (label, fromEmail)" }, { status: 400 })
  }

  const validTypes = ["sendgrid"]
  if (body.providerType && !validTypes.includes(body.providerType)) {
    return Response.json({ error: `Invalid provider type. Allowed: ${validTypes.join(", ")}` }, { status: 400 })
  }

  let encryptedApiKey: string | null = null
  if (body.apiKey) {
    encryptedApiKey = await encrypt(body.apiKey)
  }

  let encryptedRelayAuth: string | null = null
  if (body.relayAuth) {
    encryptedRelayAuth = await encrypt(body.relayAuth)
  }

  const db = createDb()
  const [provider] = await db.insert(emailProviders).values({
    label: body.label,
    providerType: body.providerType || "sendgrid",
    encryptedApiKey,
    fromEmail: body.fromEmail,
    fromName: body.fromName || "IfMail",
    replyTo: body.replyTo || null,
    priority: body.priority ?? 0,
    relayEndpoint: body.relayEndpoint || null,
    encryptedRelayAuth,
    createdBy: adminId,
  }).returning()

  await logAdminAction(adminId!, "create_email_provider", "email_provider", provider.id, {
    label: body.label,
    providerType: body.providerType || "sendgrid",
    fromEmail: body.fromEmail,
  })

  return Response.json({ provider: { ...provider, encryptedApiKey: undefined, encryptedRelayAuth: undefined } })
}

// PATCH: Update an email provider
export async function PATCH(request: Request) {
  const { error, status, userId: adminId } = await requireAdmin()
  if (error) return Response.json({ error }, { status })

  const body = await request.json() as {
    id: string
    action?: "test" | "activate" | "disable" | "set_default"
    label?: string
    apiKey?: string
    fromEmail?: string
    fromName?: string
    replyTo?: string
    priority?: number
    relayEndpoint?: string
    relayAuth?: string
  }

  if (!body.id) {
    return Response.json({ error: "Missing provider id" }, { status: 400 })
  }

  const db = createDb()
  const existing = await db.select().from(emailProviders).where(eq(emailProviders.id, body.id)).limit(1)
  if (!existing[0]) {
    return Response.json({ error: "Provider not found" }, { status: 404 })
  }

  // Handle special actions
  if (body.action === "test") {
    const result = await testProvider(body.id)
    return Response.json({ result })
  }

  if (body.action === "activate") {
    if (existing[0].status !== "tested" && existing[0].status !== "disabled") {
      return Response.json({ error: "Provider must be tested before activation" }, { status: 400 })
    }
    await db.update(emailProviders).set({ status: "active", updatedAt: new Date() }).where(eq(emailProviders.id, body.id))
    await logAdminAction(adminId!, "activate_email_provider", "email_provider", body.id, { label: existing[0].label })
    return Response.json({ success: true })
  }

  if (body.action === "disable") {
    await db.update(emailProviders).set({ status: "disabled", updatedAt: new Date() }).where(eq(emailProviders.id, body.id))
    await logAdminAction(adminId!, "disable_email_provider", "email_provider", body.id, { label: existing[0].label })
    return Response.json({ success: true })
  }

  if (body.action === "set_default") {
    // Clear existing defaults
    await db.update(emailProviders).set({ isDefault: false }).where(eq(emailProviders.isDefault, true))
    await db.update(emailProviders).set({ isDefault: true, updatedAt: new Date() }).where(eq(emailProviders.id, body.id))
    await logAdminAction(adminId!, "set_default_email_provider", "email_provider", body.id, { label: existing[0].label })
    return Response.json({ success: true })
  }

  // Regular field update
  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (body.label !== undefined) updates.label = body.label
  if (body.fromEmail !== undefined) updates.fromEmail = body.fromEmail
  if (body.fromName !== undefined) updates.fromName = body.fromName
  if (body.replyTo !== undefined) updates.replyTo = body.replyTo || null
  if (body.priority !== undefined) updates.priority = body.priority
  if (body.relayEndpoint !== undefined) updates.relayEndpoint = body.relayEndpoint || null

  if (body.apiKey) {
    updates.encryptedApiKey = await encrypt(body.apiKey)
    // Reset status when key changes
    updates.status = "draft"
  }
  if (body.relayAuth) {
    updates.encryptedRelayAuth = await encrypt(body.relayAuth)
  }

  await db.update(emailProviders).set(updates).where(eq(emailProviders.id, body.id))
  await logAdminAction(adminId!, "update_email_provider", "email_provider", body.id, {
    label: body.label || existing[0].label,
    fields: Object.keys(updates).filter(k => k !== "updatedAt" && k !== "encryptedApiKey" && k !== "encryptedRelayAuth"),
  })

  return Response.json({ success: true })
}

// DELETE: Remove an email provider
export async function DELETE(request: Request) {
  const { error, status, userId: adminId } = await requireAdmin()
  if (error) return Response.json({ error }, { status })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) {
    return Response.json({ error: "Missing provider id" }, { status: 400 })
  }

  const db = createDb()
  const existing = await db.select().from(emailProviders).where(eq(emailProviders.id, id)).limit(1)
  if (!existing[0]) {
    return Response.json({ error: "Provider not found" }, { status: 404 })
  }

  await db.delete(emailProviders).where(eq(emailProviders.id, id))
  await logAdminAction(adminId!, "delete_email_provider", "email_provider", id, { label: existing[0].label })

  return Response.json({ success: true })
}

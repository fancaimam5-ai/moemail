import { auth } from "@/lib/auth"
import { createDb } from "@/lib/db"
import { apiKeys } from "@/lib/schema"
import { nanoid } from "nanoid"
import { NextResponse } from "next/server"
import { checkPermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"
import { desc, eq, sql } from "drizzle-orm"

const MAX_API_KEYS_PER_USER = 10

export async function GET() {
  const hasPermission = await checkPermission(PERMISSIONS.MANAGE_API_KEY)
  if (!hasPermission) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const db = createDb()
    const keys = await db.query.apiKeys.findMany({
      where: eq(apiKeys.userId, session.user.id),
      orderBy: desc(apiKeys.createdAt),
    })

    return NextResponse.json({
      apiKeys: keys.map(key => ({
        ...key,
        key: undefined
      }))
    })
  } catch (error) {
    console.error("Failed to fetch API keys:", error)
    return NextResponse.json(
      { error: "Failed to fetch API Keys" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const hasPermission = await checkPermission(PERMISSIONS.MANAGE_API_KEY)
  if (!hasPermission) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { name } = await request.json() as { name: string }
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    const key = `mk_${nanoid(32)}`
    const db = createDb()

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(apiKeys)
      .where(eq(apiKeys.userId, session.user.id))
    if (Number(count) >= MAX_API_KEYS_PER_USER) {
      return NextResponse.json(
        { error: `Maximum ${MAX_API_KEYS_PER_USER} API keys allowed` },
        { status: 400 }
      )
    }

    await db.insert(apiKeys).values({
      name,
      key,
      userId: session.user.id,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    })

    return NextResponse.json({ key })
  } catch (error) {
    console.error("Failed to create API key:", error)
    return NextResponse.json(
      { error: "Failed to create API Key" },
      { status: 500 }
    )
  }
} 
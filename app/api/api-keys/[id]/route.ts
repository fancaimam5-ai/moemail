import { auth } from "@/lib/auth"
import { createDb } from "@/lib/db"
import { apiKeys } from "@/lib/schema"
import { NextResponse } from "next/server"
import { checkPermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"
import { eq, and } from "drizzle-orm"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const hasPermission = await checkPermission(PERMISSIONS.MANAGE_API_KEY)
  if (!hasPermission) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }
  try {
    const db = createDb()
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const result = await db.delete(apiKeys)
      .where(
        and(
          eq(apiKeys.id, id),
          eq(apiKeys.userId, session.user.id)
        )
      )
      .returning()

    if (!result.length) {
      return NextResponse.json(
        { error: "API Key not found or no permission to delete" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete API key:", error)
    return NextResponse.json(
      { error: "Failed to delete API Key" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const hasPermission = await checkPermission(PERMISSIONS.MANAGE_API_KEY)
  if (!hasPermission) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const { enabled } = await request.json() as { enabled: boolean }
    const db = createDb()
    
    const result = await db.update(apiKeys)
      .set({ enabled })
      .where(
        and(
          eq(apiKeys.id, id),
          eq(apiKeys.userId, session.user.id)
        )
      )
      .returning()

    if (!result.length) {
      return NextResponse.json(
        { error: "API Key not found or no permission to update" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update API key:", error)
    return NextResponse.json(
      { error: "Failed to update API Key" },
      { status: 500 }
    )
  }
} 
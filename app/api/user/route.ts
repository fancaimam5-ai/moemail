import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createDb } from "@/lib/db"
import { users, emails, apiKeys, webhooks, userPlans } from "@/lib/schema"
import { eq } from "drizzle-orm"

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  try {
    const db = createDb()

    // Delete in order to respect FK constraints (cascade handles messages/shares)
    await db.delete(apiKeys).where(eq(apiKeys.userId, userId))
    await db.delete(webhooks).where(eq(webhooks.userId, userId))
    await db.delete(userPlans).where(eq(userPlans.userId, userId))
    await db.delete(emails).where(eq(emails.userId, userId))
    await db.delete(users).where(eq(users.id, userId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete account:", error)
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    )
  }
}

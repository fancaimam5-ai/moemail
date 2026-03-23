import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/email/tokens"
import { createDb } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { hashPassword } from "@/lib/utils"

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json() as { token: string; password: string }

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const result = await verifyToken(token, "reset")
    if (!result.valid || !result.userId) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)
    const db = createDb()
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, result.userId))

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 })
  }
}

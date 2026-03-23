import { NextResponse } from "next/server"
import { verifyToken, createToken } from "@/lib/email/tokens"
import { createDb } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=invalid_token", request.url))
  }

  const result = await verifyToken(token, "magic_link")
  if (!result.valid || !result.userId) {
    return NextResponse.redirect(new URL("/login?error=expired_token", request.url))
  }

  // Mark email as verified if not already
  const db = createDb()
  const user = await db.select().from(users).where(eq(users.id, result.userId)).limit(1)
  if (user[0] && !user[0].emailVerified) {
    await db.update(users).set({ emailVerified: new Date() }).where(eq(users.id, result.userId))
  }

  // Create a short-lived one-time magic session code for auto-login
  const magicCode = await createToken(result.userId, "magic_session")

  return NextResponse.redirect(new URL(`/login?magic_code=${magicCode}`, request.url))
}

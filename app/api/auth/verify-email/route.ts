import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/email/tokens"
import { createDb } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=invalid_token", request.url))
  }

  const result = await verifyToken(token, "verify")

  if (!result.valid || !result.userId) {
    return NextResponse.redirect(new URL("/login?error=expired_token", request.url))
  }

  const db = createDb()
  await db
    .update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.id, result.userId))

  return NextResponse.redirect(new URL("/login?verified=true", request.url))
}

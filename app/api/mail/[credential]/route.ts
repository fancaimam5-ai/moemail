import { NextResponse } from "next/server"
import { verifyCredential } from "@/lib/credential"
import { createDb } from "@/lib/db"
import { emails } from "@/lib/schema"
import { eq } from "drizzle-orm"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ credential: string }> }
) {
  const { credential } = await params

  const emailId = await verifyCredential(credential)
  if (!emailId) {
    return NextResponse.json({ error: "Invalid credential" }, { status: 404 })
  }

  const db = createDb()
  const email = await db.query.emails.findFirst({
    where: eq(emails.id, emailId),
  })

  if (!email) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 })
  }

  if (email.expiresAt < new Date()) {
    return NextResponse.json({ error: "Email has expired" }, { status: 410 })
  }

  return NextResponse.json({
    id: email.id,
    address: email.address,
    createdAt: email.createdAt,
    expiresAt: email.expiresAt,
  })
}

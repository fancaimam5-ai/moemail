import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sendVerificationEmail } from "@/lib/email/tokens"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const ipHeader = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown"
  const result = await sendVerificationEmail(session.user.id, ipHeader)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 429 })
  }

  return NextResponse.json({ success: true })
}

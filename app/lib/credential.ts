import { createDb } from "./db"
import { emailCredentials } from "./schema"
import { eq } from "drizzle-orm"

const CREDENTIAL_LENGTH = 32
const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

export function generateCredential(): string {
  const array = new Uint8Array(CREDENTIAL_LENGTH)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => CHARSET[byte % CHARSET.length]).join("")
}

export async function hashCredential(credential: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(credential)
  const hash = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export async function createEmailCredential(emailId: string): Promise<string> {
  const db = createDb()
  const credential = generateCredential()
  const hash = await hashCredential(credential)

  await db.insert(emailCredentials).values({
    emailId,
    credentialHash: hash,
  })

  return credential
}

export async function verifyCredential(credential: string): Promise<string | null> {
  const db = createDb()
  const hash = await hashCredential(credential)

  const result = await db.query.emailCredentials.findFirst({
    where: eq(emailCredentials.credentialHash, hash),
  })

  return result?.emailId ?? null
}

import { getCloudflareContext } from "@opennextjs/cloudflare"

/**
 * AES-256-GCM encryption/decryption for email provider credentials.
 * Uses Web Crypto API (Cloudflare Workers compatible).
 */

// Workaround for TS strict Uint8Array<ArrayBufferLike> vs BufferSource incompatibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const buf = (data: Uint8Array): any => data

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("")
}

async function getEncryptionKey(): Promise<CryptoKey> {
  const { env } = getCloudflareContext()
  const keyHex = await env.SITE_CONFIG.get("EMAIL_ENCRYPTION_KEY")
  if (!keyHex || keyHex.length !== 64) {
    throw new Error("EMAIL_ENCRYPTION_KEY not configured or invalid (must be 64 hex chars / 32 bytes)")
  }
  const keyBytes = hexToBytes(keyHex)
  return crypto.subtle.importKey("raw", buf(keyBytes), { name: "AES-GCM" }, false, ["encrypt", "decrypt"])
}

export async function encrypt(plaintext: string): Promise<string> {
  const key = await getEncryptionKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: buf(iv) },
    key,
    buf(encoded)
  )

  // Format: iv_hex:ciphertext_hex
  return `${bytesToHex(iv)}:${bytesToHex(new Uint8Array(ciphertext))}`
}

export async function decrypt(encrypted: string): Promise<string> {
  const key = await getEncryptionKey()
  const [ivHex, ciphertextHex] = encrypted.split(":")
  if (!ivHex || !ciphertextHex) {
    throw new Error("Invalid encrypted format")
  }

  const iv = hexToBytes(ivHex)
  const ciphertext = hexToBytes(ciphertextHex)

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: buf(iv) },
    key,
    buf(ciphertext)
  )

  return new TextDecoder().decode(decrypted)
}

export function generateEncryptionKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return bytesToHex(bytes)
}

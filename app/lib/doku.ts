/**
 * DOKU Payment Gateway - Direct API Integration
 * Docs: https://dashboard.doku.com/docs/
 */

const DOKU_BASE_URL = "https://api.doku.com"

interface DokuCheckoutRequest {
  orderId: string
  amount: number
  currency: string
  customerName: string
  customerEmail: string
  itemName: string
  expiryMinutes?: number
}

interface DokuCheckoutResponse {
  message: string[]
  response: {
    order: {
      invoice_number: string
      amount: number
    }
    payment: {
      url: string
      token_id: string
      expired_date: string
    }
    uuid: string
  }
}

async function generateDigest(body: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(body)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)))
}

async function generateSignature(
  clientId: string,
  secretKey: string,
  requestId: string,
  requestTimestamp: string,
  requestTarget: string,
  digest: string,
): Promise<string> {
  const componentSignature =
    `Client-Id:${clientId}\n` +
    `Request-Id:${requestId}\n` +
    `Request-Timestamp:${requestTimestamp}\n` +
    `Request-Target:${requestTarget}\n` +
    `Digest:${digest}`

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(componentSignature))
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
  return `HMACSHA256=${signatureBase64}`
}

export async function createDokuCheckout(
  clientId: string,
  secretKey: string,
  params: DokuCheckoutRequest,
  callbackUrl?: string,
): Promise<DokuCheckoutResponse> {
  const requestId = crypto.randomUUID()
  const requestTimestamp = new Date().toISOString()
  const requestTarget = "/checkout/v1/payment"

  const body = JSON.stringify({
    order: {
      amount: params.amount,
      invoice_number: params.orderId,
      currency: params.currency,
      callback_url: callbackUrl || "",
      line_items: [
        {
          name: params.itemName,
          price: params.amount,
          quantity: 1,
        },
      ],
    },
    payment: {
      payment_due_date: params.expiryMinutes || 60,
    },
    customer: {
      name: params.customerName,
      email: params.customerEmail,
    },
  })

  const digest = await generateDigest(body)
  const signature = await generateSignature(
    clientId,
    secretKey,
    requestId,
    requestTimestamp,
    requestTarget,
    digest,
  )

  const response = await fetch(`${DOKU_BASE_URL}${requestTarget}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Client-Id": clientId,
      "Request-Id": requestId,
      "Request-Timestamp": requestTimestamp,
      Signature: signature,
    },
    body,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`DOKU API error ${response.status}: ${errorText}`)
  }

  return response.json() as Promise<DokuCheckoutResponse>
}

export async function verifyDokuSignature(
  clientId: string,
  secretKey: string,
  requestId: string,
  requestTimestamp: string,
  requestTarget: string,
  body: string,
  receivedSignature: string,
): Promise<boolean> {
  const digest = await generateDigest(body)
  const expectedSignature = await generateSignature(
    clientId,
    secretKey,
    requestId,
    requestTimestamp,
    requestTarget,
    digest,
  )
  return expectedSignature === receivedSignature
}

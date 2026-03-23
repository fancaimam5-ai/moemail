import { NextResponse } from "next/server"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { checkPermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"
import { EMAIL_CONFIG } from "@/config"

interface EmailServiceConfig {
  enabled: boolean
  apiKey?: string
  roleLimits: {
    duke?: number
    knight?: number
  }
}

export async function GET() {
  const canAccess = await checkPermission(PERMISSIONS.MANAGE_CONFIG)

  if (!canAccess) {
    return NextResponse.json({
      error: "Insufficient permissions"
    }, { status: 403 })
  }

  try {
    const env = getCloudflareContext().env
    const [enabled, apiKey, roleLimits] = await Promise.all([
      env.SITE_CONFIG.get("EMAIL_SERVICE_ENABLED"),
      env.SITE_CONFIG.get("RESEND_API_KEY"),
      env.SITE_CONFIG.get("EMAIL_ROLE_LIMITS")
    ])

    const customLimits = roleLimits ? JSON.parse(roleLimits) : {}
    
    const finalLimits = {
      duke: customLimits.duke !== undefined ? customLimits.duke : EMAIL_CONFIG.DEFAULT_DAILY_SEND_LIMITS.duke,
      knight: customLimits.knight !== undefined ? customLimits.knight : EMAIL_CONFIG.DEFAULT_DAILY_SEND_LIMITS.knight,
    }

    return NextResponse.json({
      enabled: enabled === "true",
      hasApiKey: !!apiKey,
      roleLimits: finalLimits
    })
  } catch (error) {
    console.error("Failed to get email service config:", error)
    return NextResponse.json(
      { error: "Failed to get email service config" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const canAccess = await checkPermission(PERMISSIONS.MANAGE_CONFIG)

  if (!canAccess) {
    return NextResponse.json({
      error: "Insufficient permissions"
    }, { status: 403 })
  }

  try {
    const config = await request.json() as EmailServiceConfig

    const env = getCloudflareContext().env

    if (config.enabled && !config.apiKey) {
      const existingKey = await env.SITE_CONFIG.get("RESEND_API_KEY")
      if (!existingKey) {
        return NextResponse.json(
          { error: "API Key is required when enabling Resend" },
          { status: 400 }
        )
      }
    }


    const customLimits: { duke?: number; knight?: number } = {}
    if (config.roleLimits?.duke !== undefined) {
      customLimits.duke = config.roleLimits.duke
    }
    if (config.roleLimits?.knight !== undefined) {
      customLimits.knight = config.roleLimits.knight
    }

    const puts: Promise<void>[] = [
      env.SITE_CONFIG.put("EMAIL_SERVICE_ENABLED", config.enabled.toString()),
      env.SITE_CONFIG.put("EMAIL_ROLE_LIMITS", JSON.stringify(customLimits))
    ]
    if (config.apiKey) {
      puts.push(env.SITE_CONFIG.put("RESEND_API_KEY", config.apiKey))
    }

    await Promise.all(puts)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to save email service config:", error)
    return NextResponse.json(
      { error: "Failed to save email service config" },
      { status: 500 }
    )
  }
} 
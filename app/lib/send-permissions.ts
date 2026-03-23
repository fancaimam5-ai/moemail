import { createDb } from "@/lib/db"
import { userRoles, roles, messages, emails } from "@/lib/schema"
import { eq, and, gte } from "drizzle-orm"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { EMAIL_CONFIG } from "@/config"

export interface SendPermissionResult {
  canSend: boolean
  error?: string
  remainingEmails?: number
}

export async function checkSendPermission(
  userId: string,
  skipDailyLimitCheck = false
): Promise<SendPermissionResult> {
  try {
    const userDailyLimit = await getUserDailyLimit(userId)
    
    if (userDailyLimit === -1) {
      return {
        canSend: false,
        error: "Your role does not have send permission"
      }
    }

    if (skipDailyLimitCheck || userDailyLimit === 0) {
      return {
        canSend: true
      }
    }
    
    const db = createDb()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const sentToday = await db
      .select()
      .from(messages)
      .innerJoin(emails, eq(messages.emailId, emails.id))
      .where(
        and(
          eq(emails.userId, userId),
          eq(messages.type, "sent"),
          gte(messages.receivedAt, today)
        )
      )

    const remainingEmails = Math.max(0, userDailyLimit - sentToday.length)
    
    if (sentToday.length >= userDailyLimit) {
      return {
        canSend: false,
        error: `Daily send limit reached (${userDailyLimit} emails). Please try again tomorrow.`,
        remainingEmails: 0
      }
    }

    return {
      canSend: true,
      remainingEmails
    }
  } catch (error) {
    console.error('Failed to check send permission:', error)
    return {
      canSend: false,
      error: "Permission check failed"
    }
  }
}

async function getUserDailyLimit(userId: string): Promise<number> {
  try {
    const db = createDb()
    
    const userRoleData = await db
      .select({ roleName: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId))

    const userRoleNames = userRoleData.map(r => r.roleName)

    const env = getCloudflareContext().env
    const roleLimitsStr = await env.SITE_CONFIG.get("EMAIL_ROLE_LIMITS")
    
    const customLimits = roleLimitsStr ? JSON.parse(roleLimitsStr) : {}
    
    const finalLimits = {
      emperor: EMAIL_CONFIG.DEFAULT_DAILY_SEND_LIMITS.emperor,
      duke: customLimits.duke !== undefined ? customLimits.duke : EMAIL_CONFIG.DEFAULT_DAILY_SEND_LIMITS.duke,
      knight: customLimits.knight !== undefined ? customLimits.knight : EMAIL_CONFIG.DEFAULT_DAILY_SEND_LIMITS.knight,
      civilian: EMAIL_CONFIG.DEFAULT_DAILY_SEND_LIMITS.civilian,
    }

    if (userRoleNames.includes("emperor")) {
      return finalLimits.emperor
    } else if (userRoleNames.includes("duke")) {
      return finalLimits.duke
    } else if (userRoleNames.includes("knight")) {
      return finalLimits.knight
    } else if (userRoleNames.includes("civilian")) {
      return finalLimits.civilian
    }

    return -1
  } catch (error) {
    console.error('Failed to get user daily limit:', error)
    return -1
  }
}

export async function checkBasicSendPermission(userId: string): Promise<SendPermissionResult> {
  return checkSendPermission(userId, true)
} 
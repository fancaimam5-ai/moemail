interface Env {
  DB: D1Database
  WORKER_ORIGIN?: string
  CRON_SECRET?: string
}

const CLEANUP_CONFIG = {
  // Whether to delete expired emails
  DELETE_EXPIRED_EMAILS: true,
  
  // Batch processing size
  BATCH_SIZE: 100,
} as const 

const main = {
  async scheduled(_: ScheduledEvent, env: Env) {
    const now = Date.now()

    try {
      if (!CLEANUP_CONFIG.DELETE_EXPIRED_EMAILS) {
        console.log('Expired email deletion is disabled')
        return
      }

      const result = await env.DB
        .prepare(`
          DELETE FROM email 
          WHERE expires_at < ?
          LIMIT ?
        `)
        .bind(now, CLEANUP_CONFIG.BATCH_SIZE)
        .run()

      if (result.success) {
        console.log(`Deleted ${result?.meta?.changes ?? 0} expired emails and their associated messages`)
      } else {
        console.error('Failed to delete expired emails')
      }
    } catch (error) {
      console.error('Failed to cleanup:', error)
      throw error
    }

    // Mark expired pending payments as EXPIRED
    try {
      const reconcileResult = await env.DB
        .prepare(`UPDATE payment SET status = 'EXPIRED' WHERE status = 'PENDING' AND expires_at < ?`)
        .bind(now)
        .run()
      console.log(`Reconciled ${reconcileResult?.meta?.changes ?? 0} expired pending payments`)
    } catch (error) {
      console.error('Failed to reconcile payments:', error)
    }

    // Trigger plan expiry notifications via the Next.js app
    if (env.WORKER_ORIGIN) {
      try {
        await fetch(`${env.WORKER_ORIGIN}/api/cron/expiry-notifications`, {
          method: "POST",
          headers: { "X-Cron-Secret": env.CRON_SECRET || "" },
        })
        console.log("Expiry notification cron triggered")
      } catch (error) {
        console.error("Failed to trigger expiry notifications:", error)
      }
    }

    // Clean up expired authentication tokens
    try {
      const tokenResult = await env.DB
        .prepare(`DELETE FROM email_token WHERE expires_at < ?`)
        .bind(now)
        .run()
      console.log(`Deleted ${tokenResult?.meta?.changes ?? 0} expired email tokens`)
    } catch (error) {
      console.error("Failed to cleanup email tokens:", error)
    }

    // Clean up expired guest sessions
    try {
      const guestResult = await env.DB
        .prepare(`DELETE FROM guest_session WHERE expires_at < ?`)
        .bind(now)
        .run()
      console.log(`Deleted ${guestResult?.meta?.changes ?? 0} expired guest sessions`)
    } catch (error) {
      console.error("Failed to cleanup guest sessions:", error)
    }

    // Clean up expired share links
    try {
      const shareResult = await env.DB
        .prepare(`DELETE FROM email_share WHERE expires_at IS NOT NULL AND expires_at < ?`)
        .bind(now)
        .run()
      const msgShareResult = await env.DB
        .prepare(`DELETE FROM message_share WHERE expires_at IS NOT NULL AND expires_at < ?`)
        .bind(now)
        .run()
      console.log(`Deleted ${(shareResult?.meta?.changes ?? 0) + (msgShareResult?.meta?.changes ?? 0)} expired share links`)
    } catch (error) {
      console.error("Failed to cleanup share links:", error)
    }

    // Clean up stale rate limit windows (older than 48 hours)
    try {
      const twoDaysAgo = now - 48 * 60 * 60 * 1000
      const rateLimitResult = await env.DB
        .prepare(`DELETE FROM email_rate_limit WHERE window_start < ?`)
        .bind(twoDaysAgo)
        .run()
      console.log(`Deleted ${rateLimitResult?.meta?.changes ?? 0} stale rate limit records`)
    } catch (error) {
      console.error("Failed to cleanup rate limits:", error)
    }
  }
}

export default main

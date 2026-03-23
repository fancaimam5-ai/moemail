ALTER TABLE user ADD COLUMN total_emails_created INTEGER NOT NULL DEFAULT 0;--> statement-breakpoint

-- Backfill: count all emails ever created per user
UPDATE user SET total_emails_created = (
  SELECT COUNT(*) FROM email WHERE email.userId = user.id
);

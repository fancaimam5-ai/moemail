-- Email Outbound System Migration
-- Adds email provider management, token system, delivery logging, and rate limiting

-- Email Provider Configuration
CREATE TABLE `email_provider` (
  `id` text PRIMARY KEY NOT NULL,
  `label` text NOT NULL,
  `provider_type` text NOT NULL DEFAULT 'sendgrid',
  `encrypted_api_key` text,
  `from_email` text NOT NULL,
  `from_name` text NOT NULL DEFAULT 'IfMail',
  `reply_to` text,
  `priority` integer NOT NULL DEFAULT 0,
  `status` text NOT NULL DEFAULT 'draft',
  `is_default` integer NOT NULL DEFAULT 0,
  `last_tested_at` integer,
  `last_test_result` text,
  `total_sent` integer NOT NULL DEFAULT 0,
  `total_failed` integer NOT NULL DEFAULT 0,
  `relay_endpoint` text,
  `encrypted_relay_auth` text,
  `created_by` text REFERENCES `user`(`id`) ON DELETE SET NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);

CREATE INDEX `email_provider_status_idx` ON `email_provider` (`status`);
CREATE INDEX `email_provider_priority_idx` ON `email_provider` (`priority`);

-- Email Tokens (verification, password reset, magic link)
CREATE TABLE `email_token` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `user`(`id`) ON DELETE CASCADE,
  `token_hash` text NOT NULL,
  `type` text NOT NULL,
  `expires_at` integer NOT NULL,
  `used_at` integer,
  `created_at` integer NOT NULL
);

CREATE INDEX `email_token_user_id_idx` ON `email_token` (`user_id`);
CREATE INDEX `email_token_hash_idx` ON `email_token` (`token_hash`);
CREATE INDEX `email_token_type_expires_idx` ON `email_token` (`type`, `expires_at`);

-- Email Delivery Log
CREATE TABLE `email_delivery_log` (
  `id` text PRIMARY KEY NOT NULL,
  `provider_id` text REFERENCES `email_provider`(`id`) ON DELETE SET NULL,
  `provider_label` text,
  `email_type` text NOT NULL,
  `to_address` text NOT NULL,
  `subject` text,
  `status` text NOT NULL DEFAULT 'pending',
  `status_code` integer,
  `provider_message_id` text,
  `error_message` text,
  `attempt_number` integer NOT NULL DEFAULT 1,
  `created_at` integer NOT NULL
);

CREATE INDEX `email_delivery_log_type_idx` ON `email_delivery_log` (`email_type`);
CREATE INDEX `email_delivery_log_status_idx` ON `email_delivery_log` (`status`);
CREATE INDEX `email_delivery_log_created_at_idx` ON `email_delivery_log` (`created_at`);
CREATE INDEX `email_delivery_log_to_idx` ON `email_delivery_log` (`to_address`);

-- Rate Limiting
CREATE TABLE `email_rate_limit` (
  `id` text PRIMARY KEY NOT NULL,
  `key` text NOT NULL,
  `action` text NOT NULL,
  `count` integer NOT NULL DEFAULT 0,
  `window_start` integer NOT NULL
);

CREATE UNIQUE INDEX `email_rate_limit_key_action_idx` ON `email_rate_limit` (`key`, `action`);

-- Add locale and last_login_ip_hash to user table
ALTER TABLE `user` ADD COLUMN `locale` text DEFAULT 'en';
ALTER TABLE `user` ADD COLUMN `last_login_ip_hash` text;

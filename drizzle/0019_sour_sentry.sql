CREATE TABLE `email_credential` (
	`id` text PRIMARY KEY NOT NULL,
	`email_id` text NOT NULL,
	`credential_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`email_id`) REFERENCES `email`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_credential_email_id_idx` ON `email_credential` (`email_id`);--> statement-breakpoint
CREATE INDEX `email_credential_hash_idx` ON `email_credential` (`credential_hash`);--> statement-breakpoint
CREATE TABLE `guest_session` (
	`id` text PRIMARY KEY NOT NULL,
	`ip_hash` text NOT NULL,
	`fingerprint_hash` text,
	`email_id` text,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`email_id`) REFERENCES `email`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `guest_session_ip_hash_idx` ON `guest_session` (`ip_hash`);--> statement-breakpoint
CREATE INDEX `guest_session_fingerprint_idx` ON `guest_session` (`fingerprint_hash`);--> statement-breakpoint
CREATE INDEX `guest_session_expires_idx` ON `guest_session` (`expires_at`);--> statement-breakpoint
CREATE TABLE `plan` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`max_emails` integer DEFAULT 5 NOT NULL,
	`max_expiry_hours` integer DEFAULT 72,
	`price_cents` integer DEFAULT 0,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `plan_name_unique` ON `plan` (`name`);--> statement-breakpoint
CREATE TABLE `user_plan` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`plan_id` text NOT NULL,
	`started_at` integer NOT NULL,
	`expires_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`plan_id`) REFERENCES `plan`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_plan_user_id_idx` ON `user_plan` (`user_id`);--> statement-breakpoint
ALTER TABLE `email` ADD `guest_session_id` text;--> statement-breakpoint
CREATE INDEX `email_guest_session_idx` ON `email` (`guest_session_id`);
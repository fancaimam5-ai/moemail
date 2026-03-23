CREATE TABLE `payment` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL REFERENCES `user`(`id`) ON DELETE cascade,
	`plan_id` text NOT NULL REFERENCES `plan`(`id`),
	`invoice_number` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'IDR' NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`payment_method` text,
	`payment_url` text,
	`doku_request_id` text,
	`webhook_data` text,
	`created_at` integer NOT NULL,
	`paid_at` integer,
	`expires_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_invoice_number_unique` ON `payment` (`invoice_number`);
--> statement-breakpoint
CREATE INDEX `payment_user_id_idx` ON `payment` (`user_id`);
--> statement-breakpoint
CREATE INDEX `payment_status_idx` ON `payment` (`status`);
--> statement-breakpoint
CREATE INDEX `payment_invoice_idx` ON `payment` (`invoice_number`);

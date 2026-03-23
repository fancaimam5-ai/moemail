CREATE TABLE `admin_activity_log` (
	`id` text PRIMARY KEY NOT NULL,
	`admin_id` text NOT NULL,
	`action` text NOT NULL,
	`target_type` text,
	`target_id` text,
	`detail` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`admin_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `admin_activity_admin_id_idx` ON `admin_activity_log` (`admin_id`);--> statement-breakpoint
CREATE INDEX `admin_activity_action_idx` ON `admin_activity_log` (`action`);--> statement-breakpoint
CREATE INDEX `admin_activity_created_at_idx` ON `admin_activity_log` (`created_at`);--> statement-breakpoint
CREATE INDEX `admin_activity_target_idx` ON `admin_activity_log` (`target_type`,`target_id`);--> statement-breakpoint
CREATE TABLE `user_suspension` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`reason` text NOT NULL,
	`suspended_by` text NOT NULL,
	`suspended_at` integer NOT NULL,
	`expires_at` integer,
	`lifted_at` integer,
	`lifted_by` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`suspended_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lifted_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `user_suspension_user_id_idx` ON `user_suspension` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_suspension_suspended_at_idx` ON `user_suspension` (`suspended_at`);--> statement-breakpoint
CREATE INDEX `user_suspension_active_idx` ON `user_suspension` (`user_id`,`lifted_at`);
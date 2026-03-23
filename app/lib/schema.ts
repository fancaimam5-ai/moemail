import { integer, sqliteTable, text, primaryKey, uniqueIndex, index } from "drizzle-orm/sqlite-core"
import type { AdapterAccountType } from "next-auth/adapters"
import { relations, sql } from 'drizzle-orm';

// https://authjs.dev/getting-started/adapters/drizzle
export const users = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
  username: text("username").unique(),
  password: text("password"),
  totalEmailsCreated: integer("total_emails_created").notNull().default(0),
  locale: text("locale").default("en"),
  lastLoginIpHash: text("last_login_ip_hash"),
})
export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    userIdIdx: index("account_user_id_idx").on(account.userId),
  })
)

export const emails = sqliteTable("email", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  address: text("address").notNull().unique(),
  userId: text("userId").references(() => users.id, { onDelete: "cascade" }),
  guestSessionId: text("guest_session_id"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => ({
  expiresAtIdx: index("email_expires_at_idx").on(table.expiresAt),
  userIdIdx: index("email_user_id_idx").on(table.userId),
  addressLowerIdx: index("email_address_lower_idx").on(sql`LOWER(${table.address})`),
  guestSessionIdx: index("email_guest_session_idx").on(table.guestSessionId),
}))

export const messages = sqliteTable("message", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  emailId: text("emailId")
    .notNull()
    .references(() => emails.id, { onDelete: "cascade" }),
  fromAddress: text("from_address"),
  toAddress: text("to_address"),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  html: text("html"),
  type: text("type"),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  receivedAt: integer("received_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  sentAt: integer("sent_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  emailIdIdx: index("message_email_id_idx").on(table.emailId),
  emailIdReceivedAtTypeIdx: index("message_email_id_received_at_type_idx").on(table.emailId, table.receivedAt, table.type),
  isReadIdx: index("message_is_read_idx").on(table.isRead),
}))

export const webhooks = sqliteTable('webhook', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  url: text('url').notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  signingSecret: text('signing_secret').notNull().$defaultFn(() => crypto.randomUUID()),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  userIdIdx: index('webhook_user_id_idx').on(table.userId),
}))

export const roles = sqliteTable("role", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const userRoles = sqliteTable("user_role", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: text("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.roleId] }),
  userIdIdx: index("user_role_user_id_idx").on(table.userId),
}));

export const apiKeys = sqliteTable('api_keys', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  key: text('key').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
}, (table) => ({
  nameUserIdUnique: uniqueIndex('name_user_id_unique').on(table.name, table.userId),
  userIdIdx: index('api_keys_user_id_idx').on(table.userId),
}));

export const emailShares = sqliteTable('email_share', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  emailId: text('email_id')
    .notNull()
    .references(() => emails.id, { onDelete: "cascade" }),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }),
}, (table) => ({
  emailIdIdx: index('email_share_email_id_idx').on(table.emailId),
  tokenIdx: index('email_share_token_idx').on(table.token),
}));

export const messageShares = sqliteTable('message_share', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  messageId: text('message_id')
    .notNull()
    .references(() => messages.id, { onDelete: "cascade" }),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }),
}, (table) => ({
  messageIdIdx: index('message_share_message_id_idx').on(table.messageId),
  tokenIdx: index('message_share_token_idx').on(table.token),
}));



export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
  apiKeys: many(apiKeys),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
}));

export const emailSharesRelations = relations(emailShares, ({ one }) => ({
  email: one(emails, {
    fields: [emailShares.emailId],
    references: [emails.id],
  }),
}));

export const messageSharesRelations = relations(messageShares, ({ one }) => ({
  message: one(messages, {
    fields: [messageShares.messageId],
    references: [messages.id],
  }),
}));

// ============================================================
// Guest & Credential System
// ============================================================

export const emailCredentials = sqliteTable("email_credential", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  emailId: text("email_id")
    .notNull()
    .references(() => emails.id, { onDelete: "cascade" }),
  credentialHash: text("credential_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  emailIdIdx: uniqueIndex("email_credential_email_id_idx").on(table.emailId),
  credentialHashIdx: index("email_credential_hash_idx").on(table.credentialHash),
}));

export const guestSessions = sqliteTable("guest_session", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  ipHash: text("ip_hash").notNull(),
  fingerprintHash: text("fingerprint_hash"),
  emailId: text("email_id").references(() => emails.id, { onDelete: "set null" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => ({
  ipHashIdx: index("guest_session_ip_hash_idx").on(table.ipHash),
  fingerprintIdx: index("guest_session_fingerprint_idx").on(table.fingerprintHash),
  expiresIdx: index("guest_session_expires_idx").on(table.expiresAt),
}));

// ============================================================
// Plans & Subscriptions
// ============================================================

export const plans = sqliteTable("plan", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  maxEmails: integer("max_emails").notNull().default(5),
  maxExpiryHours: integer("max_expiry_hours").default(72),
  priceCents: integer("price_cents").default(0),
  durationDays: integer("duration_days").notNull().default(30),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const userPlans = sqliteTable("user_plan", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  planId: text("plan_id")
    .notNull()
    .references(() => plans.id),
  startedAt: integer("started_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
}, (table) => ({
  userIdIdx: uniqueIndex("user_plan_user_id_idx").on(table.userId),
}));

// ============================================================
// New Relations
// ============================================================

export const emailCredentialsRelations = relations(emailCredentials, ({ one }) => ({
  email: one(emails, {
    fields: [emailCredentials.emailId],
    references: [emails.id],
  }),
}));

export const guestSessionsRelations = relations(guestSessions, ({ one }) => ({
  email: one(emails, {
    fields: [guestSessions.emailId],
    references: [emails.id],
  }),
}));

export const plansRelations = relations(plans, ({ many }) => ({
  userPlans: many(userPlans),
}));

export const userPlansRelations = relations(userPlans, ({ one }) => ({
  user: one(users, {
    fields: [userPlans.userId],
    references: [users.id],
  }),
  plan: one(plans, {
    fields: [userPlans.planId],
    references: [plans.id],
  }),
}));

// ============================================================
// Payments (DOKU)
// ============================================================

export const payments = sqliteTable("payment", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  planId: text("plan_id")
    .notNull()
    .references(() => plans.id),
  invoiceNumber: text("invoice_number").notNull().unique(),
  amount: integer("amount").notNull(), // in smallest unit (cents/rupiah)
  currency: text("currency").notNull().default("IDR"),
  status: text("status").notNull().default("PENDING"), // PENDING | PAID | EXPIRED | FAILED
  paymentMethod: text("payment_method"), // QRIS, VIRTUAL_ACCOUNT, etc.
  paymentUrl: text("payment_url"), // DOKU checkout URL
  dokuRequestId: text("doku_request_id"),
  webhookData: text("webhook_data"), // raw JSON from DOKU notification
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  paidAt: integer("paid_at", { mode: "timestamp_ms" }),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
}, (table) => ({
  userIdIdx: index("payment_user_id_idx").on(table.userId),
  statusIdx: index("payment_status_idx").on(table.status),
  invoiceIdx: index("payment_invoice_idx").on(table.invoiceNumber),
  expiresAtIdx: index("payment_expires_at_idx").on(table.expiresAt),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  plan: one(plans, {
    fields: [payments.planId],
    references: [plans.id],
  }),
}));

// ============================================================
// Admin System
// ============================================================

export const adminActivityLog = sqliteTable("admin_activity_log", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  adminId: text("admin_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // e.g. "suspend_user", "delete_email", "update_plan", "update_config"
  targetType: text("target_type"), // "user" | "email" | "plan" | "config"
  targetId: text("target_id"),
  detail: text("detail"), // JSON string with action details
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  adminIdIdx: index("admin_activity_admin_id_idx").on(table.adminId),
  actionIdx: index("admin_activity_action_idx").on(table.action),
  createdAtIdx: index("admin_activity_created_at_idx").on(table.createdAt),
  targetIdx: index("admin_activity_target_idx").on(table.targetType, table.targetId),
}));

export const userSuspensions = sqliteTable("user_suspension", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  suspendedBy: text("suspended_by")
    .notNull()
    .references(() => users.id),
  suspendedAt: integer("suspended_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }), // null = permanent
  liftedAt: integer("lifted_at", { mode: "timestamp_ms" }),
  liftedBy: text("lifted_by").references(() => users.id),
}, (table) => ({
  userIdIdx: index("user_suspension_user_id_idx").on(table.userId),
  suspendedAtIdx: index("user_suspension_suspended_at_idx").on(table.suspendedAt),
  activeIdx: index("user_suspension_active_idx").on(table.userId, table.liftedAt),
}));

// ============================================================
// Email Outbound System
// ============================================================

export const emailProviders = sqliteTable("email_provider", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  label: text("label").notNull(),
  providerType: text("provider_type").notNull().default("sendgrid"), // 'sendgrid' | 'http_relay'
  encryptedApiKey: text("encrypted_api_key"),
  fromEmail: text("from_email").notNull(),
  fromName: text("from_name").notNull().default("IfMail"),
  replyTo: text("reply_to"),
  priority: integer("priority").notNull().default(0),
  status: text("status").notNull().default("draft"), // draft | tested | active | disabled | failed
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  lastTestedAt: integer("last_tested_at", { mode: "timestamp_ms" }),
  lastTestResult: text("last_test_result"),
  totalSent: integer("total_sent").notNull().default(0),
  totalFailed: integer("total_failed").notNull().default(0),
  relayEndpoint: text("relay_endpoint"),
  encryptedRelayAuth: text("encrypted_relay_auth"),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  statusIdx: index("email_provider_status_idx").on(table.status),
  priorityIdx: index("email_provider_priority_idx").on(table.priority),
}));

export const emailTokens = sqliteTable("email_token", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  type: text("type").notNull(), // 'verify' | 'reset' | 'magic_link'
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  usedAt: integer("used_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  userIdIdx: index("email_token_user_id_idx").on(table.userId),
  hashIdx: index("email_token_hash_idx").on(table.tokenHash),
  typeExpiresIdx: index("email_token_type_expires_idx").on(table.type, table.expiresAt),
}));

export const emailDeliveryLogs = sqliteTable("email_delivery_log", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  providerId: text("provider_id").references(() => emailProviders.id, { onDelete: "set null" }),
  providerLabel: text("provider_label"),
  emailType: text("email_type").notNull(), // 'verify' | 'reset' | 'magic_link' | 'notif_quota' | 'notif_security' | 'notif_premium' | 'test'
  toAddress: text("to_address").notNull(),
  subject: text("subject"),
  status: text("status").notNull().default("pending"), // 'pending' | 'sent' | 'failed' | 'bounced'
  statusCode: integer("status_code"),
  providerMessageId: text("provider_message_id"),
  errorMessage: text("error_message"),
  attemptNumber: integer("attempt_number").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  typeIdx: index("email_delivery_log_type_idx").on(table.emailType),
  statusIdx: index("email_delivery_log_status_idx").on(table.status),
  createdAtIdx: index("email_delivery_log_created_at_idx").on(table.createdAt),
  toIdx: index("email_delivery_log_to_idx").on(table.toAddress),
}));

export const emailRateLimits = sqliteTable("email_rate_limit", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  key: text("key").notNull(),
  action: text("action").notNull(),
  count: integer("count").notNull().default(0),
  windowStart: integer("window_start", { mode: "timestamp_ms" }).notNull(),
}, (table) => ({
  keyActionIdx: uniqueIndex("email_rate_limit_key_action_idx").on(table.key, table.action),
}));

export const adminActivityLogRelations = relations(adminActivityLog, ({ one }) => ({
  admin: one(users, {
    fields: [adminActivityLog.adminId],
    references: [users.id],
  }),
}));

export const userSuspensionsRelations = relations(userSuspensions, ({ one }) => ({
  user: one(users, {
    fields: [userSuspensions.userId],
    references: [users.id],
  }),
  suspender: one(users, {
    fields: [userSuspensions.suspendedBy],
    references: [users.id],
  }),
}));

// Email Outbound Relations

export const emailProvidersRelations = relations(emailProviders, ({ one, many }) => ({
  creator: one(users, {
    fields: [emailProviders.createdBy],
    references: [users.id],
  }),
  deliveryLogs: many(emailDeliveryLogs),
}));

export const emailTokensRelations = relations(emailTokens, ({ one }) => ({
  user: one(users, {
    fields: [emailTokens.userId],
    references: [users.id],
  }),
}));

export const emailDeliveryLogsRelations = relations(emailDeliveryLogs, ({ one }) => ({
  provider: one(emailProviders, {
    fields: [emailDeliveryLogs.providerId],
    references: [emailProviders.id],
  }),
}));
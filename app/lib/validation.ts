import { z } from "zod"

export const authSchema = z.object({
  username: z.string()
    .min(1, "用户名不能为空")
    .max(20, "用户名不能超过20个字符")
    .regex(/^[a-zA-Z0-9_-]+$/, "用户名只能包含字母、数字、下划线和横杠")
    .refine(val => !val.includes('@'), "用户名不能是邮箱格式"),
  password: z.string()
    .min(8, "密码长度必须大于等于8位"),
  turnstileToken: z.string().optional()
})

export type AuthSchema = z.infer<typeof authSchema>

export const registerSchema = z.object({
  username: z.string()
    .min(1, "Username is required")
    .max(20, "Username max 20 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscore and dash"),
  email: z.string()
    .email("Invalid email address")
    .max(254, "Email too long"),
  name: z.string()
    .min(1, "Name is required")
    .max(50, "Name max 50 characters")
    .regex(/^[a-zA-Z0-9\s\-'.]+$/, "Name contains invalid characters"),
  password: z.string()
    .min(8, "Password must be at least 8 characters"),
  turnstileToken: z.string().optional()
})

export type RegisterSchema = z.infer<typeof registerSchema>

// Default allowed email domains for registration
export const DEFAULT_ALLOWED_EMAIL_DOMAINS = [
  "gmail.com", "outlook.com", "hotmail.com", "live.com", "msn.com",
  "yahoo.com", "yahoo.co.id", "ymail.com",
  "icloud.com", "me.com", "mac.com",
  "proton.me", "protonmail.com", "pm.me",
  "aol.com", "zoho.com", "gmx.com", "gmx.net",
  "mail.com", "fastmail.com",
  "tutanota.com", "tuta.com",
  "yandex.com",
]

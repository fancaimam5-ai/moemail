import NextAuth from "next-auth"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { createDb, Db } from "./db"
import { accounts, users, roles, userRoles, plans, userPlans } from "./schema"
import { eq } from "drizzle-orm"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { Permission, hasPermission, ROLES, Role } from "./permissions"
import CredentialsProvider from "next-auth/providers/credentials"
import { hashPassword, comparePassword } from "@/lib/utils"
import { authSchema, AuthSchema } from "@/lib/validation"
import { generateAvatarUrl } from "./avatar"
import { getUserId } from "./apiKey"
import { verifyTurnstileToken } from "./turnstile"
import { sendSecurityNotification } from "@/lib/email/notifications"
import { verifyToken } from "@/lib/email/tokens"

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  [ROLES.EMPEROR]: "Emperor (Site Owner)",
  [ROLES.DUKE]: "Duke (Super User)",
  [ROLES.KNIGHT]: "Knight (Advanced User)",
  [ROLES.CIVILIAN]: "Civilian (Regular User)",
}

function resolveAuthSecret(): string | undefined {
  try {
    const { env } = getCloudflareContext()
    if (env.AUTH_SECRET) return env.AUTH_SECRET
  } catch {
    // Fallback to process env for local/dev compatibility.
  }

  return process.env.AUTH_SECRET
}

const getDefaultRole = async (): Promise<Role> => {
  const { env } = getCloudflareContext()
  const defaultRole = await env.SITE_CONFIG.get("DEFAULT_ROLE")

  if (
    defaultRole === ROLES.DUKE ||
    defaultRole === ROLES.KNIGHT ||
    defaultRole === ROLES.CIVILIAN
  ) {
    return defaultRole as Role
  }

  return ROLES.CIVILIAN
}

async function findOrCreateRole(db: Db, roleName: Role) {
  let role = await db.query.roles.findFirst({
    where: eq(roles.name, roleName),
  })

  if (!role) {
    const [newRole] = await db.insert(roles)
      .values({
        name: roleName,
        description: ROLE_DESCRIPTIONS[roleName],
      })
      .returning()
    role = newRole
  }

  return role
}

export async function assignRoleToUser(db: Db, userId: string, roleId: string) {
  await db.delete(userRoles)
    .where(eq(userRoles.userId, userId))

  await db.insert(userRoles)
    .values({
      userId,
      roleId,
    })
}

export async function getUserRole(userId: string) {
  const db = createDb()
  const userRoleRecords = await db.query.userRoles.findMany({
    where: eq(userRoles.userId, userId),
    with: { role: true },
  })
  // Return the highest-priority role (emperor > duke > knight > civilian)
  const ROLE_PRIORITY = ['emperor', 'duke', 'knight', 'civilian']
  const roleNames = userRoleRecords.map(ur => ur.role.name)
  for (const role of ROLE_PRIORITY) {
    if (roleNames.includes(role)) return role
  }
  return userRoleRecords[0]?.role.name ?? 'civilian'
}

export async function checkPermission(permission: Permission) {
  const userId = await getUserId()

  if (!userId) return false

  const db = createDb()
  const userRoleRecords = await db.query.userRoles.findMany({
    where: eq(userRoles.userId, userId),
    with: { role: true },
  })

  const userRoleNames = userRoleRecords.map(ur => ur.role.name)
  return hasPermission(userRoleNames as Role[], permission)
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut
} = NextAuth(() => ({
  trustHost: true,
  secret: resolveAuthSecret(),
  adapter: DrizzleAdapter(createDb(), {
    usersTable: users,
    accountsTable: accounts,
  }),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "Enter username" },
        password: { label: "Password", type: "password", placeholder: "Enter password" },
      },
      async authorize(credentials) {
        if (!credentials) {
          throw new Error("Please enter username and password")
        }

        const { username, password, turnstileToken } = credentials as Record<string, string | undefined>

        let parsedCredentials: AuthSchema
        try {
          parsedCredentials = authSchema.parse({ username, password, turnstileToken })
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          throw new Error("Invalid input format")
        }

        const verification = await verifyTurnstileToken(parsedCredentials.turnstileToken)
        if (!verification.success) {
          if (verification.reason === "missing-token") {
            throw new Error("Please complete security verification")
          }
          throw new Error("Security verification failed")
        }

        const db = createDb()

        const user = await db.query.users.findFirst({
          where: eq(users.username, parsedCredentials.username),
        })

        if (!user) {
          throw new Error("Invalid username or password")
        }

        const isValid = await comparePassword(parsedCredentials.password, user.password as string)
        if (!isValid) {
          throw new Error("Invalid username or password")
        }

        return {
          ...user,
          password: undefined,
        }
      },
    }),
    CredentialsProvider({
      id: "magic-link",
      name: "Magic Link",
      credentials: {
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials) return null
        const code = (credentials as Record<string, string>).code
        if (!code) return null

        const result = await verifyToken(code, "magic_session")
        if (!result.valid || !result.userId) return null

        const db = createDb()
        const user = await db.query.users.findFirst({
          where: eq(users.id, result.userId),
        })
        if (!user) return null

        return { ...user, password: undefined }
      },
    }),
  ],
  events: {
    async signIn({ user }) {
      if (!user.id) return

      try {
        const db = createDb()
        const existingRole = await db.query.userRoles.findFirst({
          where: eq(userRoles.userId, user.id),
        })

        if (!existingRole) {
          const defaultRole = await getDefaultRole()
          const role = await findOrCreateRole(db, defaultRole)
          await assignRoleToUser(db, user.id, role.id)
        }

        // Auto-assign Free plan if user has no plan
        const existingPlan = await db.query.userPlans.findFirst({
          where: eq(userPlans.userId, user.id),
        })

        if (!existingPlan) {
          let freePlan = await db.query.plans.findFirst({
            where: eq(plans.name, "Free"),
          })

          if (!freePlan) {
            const [created] = await db.insert(plans).values({
              name: "Free",
              maxEmails: 3,
              maxExpiryHours: 72,
              priceCents: 0,
            }).returning()
            freePlan = created
          }

          await db.insert(userPlans).values({
            userId: user.id,
            planId: freePlan.id,
          })
        }
        // Send security notification (non-blocking)
        sendSecurityNotification(
          user.id,
          crypto.randomUUID().slice(0, 8)
        ).catch(e => console.error('Security notification error:', e))
      } catch (error) {
        console.error('Error assigning role/plan:', error)
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.name = user.name || user.username
        token.username = user.username
        token.image = user.image || generateAvatarUrl(token.name as string)
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user && token.id) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.username = token.username as string
        session.user.image = token.image as string

        try {
          const db = createDb()
          let userRoleRecords = await db.query.userRoles.findMany({
            where: eq(userRoles.userId, session.user.id),
            with: { role: true },
          })

          if (!userRoleRecords.length) {
            const defaultRole = await getDefaultRole()
            const role = await findOrCreateRole(db, defaultRole)
            await assignRoleToUser(db, session.user.id, role.id)
            userRoleRecords = [{
              userId: session.user.id,
              roleId: role.id,
              createdAt: new Date(),
              role: role
            }]
          }

          session.user.roles = userRoleRecords.map(ur => ({
            name: ur.role.name,
          }))

          const userAccounts = await db.query.accounts.findMany({
            where: eq(accounts.userId, session.user.id),
          })

          session.user.providers = userAccounts.map(account => account.provider)
        } catch (error) {
          console.error('Error in session callback:', error)
        }
      }

      return session
    },
  },
  session: {
    strategy: "jwt",
  },
}))

export async function register(username: string, password: string, email: string, name: string) {
  const db = createDb()

  const existingUsername = await db.query.users.findFirst({
    where: eq(users.username, username)
  })

  if (existingUsername) {
    throw new Error("Username already exists")
  }

  const existingEmail = await db.query.users.findFirst({
    where: eq(users.email, email)
  })

  if (existingEmail) {
    throw new Error("Email already registered")
  }

  const hashedPassword = await hashPassword(password)

  const [user] = await db.insert(users)
    .values({
      username,
      password: hashedPassword,
      email: email.toLowerCase(),
      name,
    })
    .returning()

  return user
}

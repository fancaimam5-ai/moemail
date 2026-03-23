import { createDb } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { PERMISSIONS } from "@/lib/permissions"
import { checkPermission } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const canPromote = await checkPermission(PERMISSIONS.PROMOTE_USER)
    if (!canPromote) {
      return Response.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const json = await request.json()
    const { searchText } = json as { searchText: string }

    if (!searchText) {
      return Response.json({ error: "Please provide a username or email address" }, { status: 400 })
    }

    const db = createDb()

    const user = await db.query.users.findFirst({
      where: searchText.includes('@') ? eq(users.email, searchText) : eq(users.username, searchText),
      with: {
        userRoles: {
          with: {
            role: true
          }
        }
      }
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    return Response.json({
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.userRoles[0]?.role.name
      }
    })
  } catch (error) {
    console.error("Failed to find user:", error)
    return Response.json(
      { error: "Failed to find user" },
      { status: 500 }
    )
  }
} 
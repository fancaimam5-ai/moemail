import { createDb } from "@/lib/db";
import { roles, userRoles } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { PERMISSIONS, ROLES } from "@/lib/permissions";
import { assignRoleToUser, checkPermission } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const canPromote = await checkPermission(PERMISSIONS.PROMOTE_USER)
    if (!canPromote) {
      return Response.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const { userId, roleName } = await request.json() as { 
      userId: string, 
      roleName: typeof ROLES.DUKE | typeof ROLES.KNIGHT | typeof ROLES.CIVILIAN 
    };
    if (!userId || !roleName) {
      return Response.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    if (![ROLES.DUKE, ROLES.KNIGHT, ROLES.CIVILIAN].includes(roleName)) {
      return Response.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    const db = createDb();

    const currentUserRole = await db.query.userRoles.findFirst({
      where: eq(userRoles.userId, userId),
      with: {
        role: true,
      },
    });

    if (currentUserRole?.role.name === ROLES.EMPEROR) {
      return Response.json(
        { error: "Cannot demote Emperor" },
        { status: 400 }
      );
    }

    let targetRole = await db.query.roles.findFirst({
      where: eq(roles.name, roleName),
    });

    if (!targetRole) {
      const description = {
        [ROLES.DUKE]: "Super user",
        [ROLES.KNIGHT]: "Premium user",
        [ROLES.CIVILIAN]: "Regular user",
      }[roleName];

      const [newRole] = await db.insert(roles)
        .values({
          name: roleName,
          description,
        })
        .returning();
      targetRole = newRole;
    }

    await assignRoleToUser(db, userId, targetRole.id);

    return Response.json({ 
      success: true,
    });
  } catch (error) {
    console.error("Failed to change user role:", error);
    return Response.json(
      { error: "Operation failed" },
      { status: 500 }
    );
  }
}
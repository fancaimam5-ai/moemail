import { auth, assignRoleToUser } from "@/lib/auth";
import { createDb, Db } from "@/lib/db";
import { roles, userRoles } from "@/lib/schema";
import { ROLES } from "@/lib/permissions";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createDb();

  try {
    let message = ""

    await db.transaction(async (tx) => {
      // All checks and writes inside a single transaction to prevent race conditions
      const emperorRole = await tx.query.roles.findFirst({
        where: eq(roles.name, ROLES.EMPEROR),
        with: { userRoles: true },
      });

      if (emperorRole && emperorRole.userRoles.length > 0) {
        throw Object.assign(new Error("Emperor already exists"), { status: 400 });
      }

      const userCountResult = await tx
        .select({ count: sql<number>`count(*)` })
        .from(userRoles);
      if (Number(userCountResult[0]?.count ?? 0) > 0) {
        throw Object.assign(new Error("Role system already initialized"), { status: 403 });
      }

      let roleId = emperorRole?.id;
      if (!roleId) {
        const [newRole] = await tx
          .insert(roles)
          .values({ name: ROLES.EMPEROR, description: "Emperor (site owner)" })
          .returning({ id: roles.id });
        roleId = newRole.id;
      }

      await assignRoleToUser(tx as unknown as Db, session.user.id, roleId);
      message = "You are now Emperor";
    });

    return Response.json({ message });
  } catch (error) {
    const status = (error as { status?: number }).status;
    const msg = error instanceof Error ? error.message : "Failed to initialize Emperor";
    return Response.json({ error: msg }, { status: status ?? 500 });
  }
}
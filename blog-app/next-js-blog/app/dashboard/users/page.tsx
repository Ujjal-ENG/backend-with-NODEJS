import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UserRolePermissionForm } from "@/components/dashboard/user-role-permission-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { canManageUsers } from "@/lib/abac";
import { getSession } from "@/lib/auth";
import {
  getRolePermissionCatalog,
  getUsersWithRolePermissions,
  type UserRolePermissionRecord,
} from "@/lib/api/role-permissions";
import { UserRole, type PermissionKey } from "@/types/entities";

export const metadata: Metadata = { title: "Role Permissions" };

export default async function UsersRolePermissionPage() {
  const session = await getSession();
  if (!canManageUsers(session)) {
    redirect("/dashboard?forbidden=true");
  }

  let users: UserRolePermissionRecord[] = [];
  let roles: string[] = [];
  let permissions: PermissionKey[] = [];

  try {
    const [catalog, userList] = await Promise.all([
      getRolePermissionCatalog(),
      getUsersWithRolePermissions(),
    ]);
    users = userList;
    roles = Array.from(new Set([...Object.values(UserRole), ...catalog.roles]));
    permissions = catalog.permissions as PermissionKey[];
  } catch {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <p>Failed to load role permissions. Make sure API is running.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Role Permissions</h1>
        <p className="text-sm text-muted-foreground">
          Set role and permissions per user from the admin panel.
        </p>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <CardTitle className="text-base">
                {user.firstName} {user.lastName}
              </CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <UserRolePermissionForm
                user={user}
                roles={roles}
                permissions={permissions}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

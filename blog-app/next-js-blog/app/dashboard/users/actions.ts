"use server";

import { updateTag } from "next/cache";
import { canManageUsers } from "@/lib/abac";
import { getSession } from "@/lib/auth";
import { updateUserRolePermissions } from "@/lib/api/role-permissions";
import type { PermissionKey } from "@/types/entities";
import { UserRole } from "@/types/entities";

export type UserRolePermissionActionState = {
  error?: string;
  success?: string;
};

export async function updateUserRolePermissionsAction(
  _prevState: UserRolePermissionActionState,
  formData: FormData,
): Promise<UserRolePermissionActionState> {
  const session = await getSession();

  if (!canManageUsers(session)) {
    return { error: "You are not allowed to manage user permissions" };
  }

  const userIdRaw = formData.get("userId");
  const roleRaw = formData.get("role");
  const permissions = formData
    .getAll("permissions")
    .filter((permission): permission is string => typeof permission === "string");

  const userId = Number(userIdRaw);
  if (!Number.isFinite(userId) || userId <= 0) {
    return { error: "Invalid user id" };
  }

  if (typeof roleRaw !== "string") {
    return { error: "Role is required" };
  }

  if (!Object.values(UserRole).includes(roleRaw as UserRole)) {
    return { error: "Invalid role" };
  }

  try {
    await updateUserRolePermissions(userId, {
      role: roleRaw as UserRole,
      permissions: permissions as PermissionKey[],
    });
    updateTag("role-permissions-users");
    return { success: "Permissions updated" };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "Failed to update permissions" };
  }
}

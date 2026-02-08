import { apiFetch } from "@/lib/api-client";
import type { RolePermissionCatalog } from "@/types/api";
import type { PermissionKey, UserRole } from "@/types/entities";

export interface UserRolePermissionRecord {
  id: number;
  firstName: string;
  lastName?: string;
  email: string;
  role: UserRole;
  permissions: PermissionKey[];
  effectivePermissions: PermissionKey[];
}

export interface UpdateUserRolePermissionsPayload {
  role?: UserRole;
  permissions?: PermissionKey[];
}

export async function getRolePermissionCatalog() {
  return apiFetch<RolePermissionCatalog>("/role-permissions/catalog", {
    cache: "no-store",
    tags: ["role-permissions-catalog"],
  });
}

export async function getUsersWithRolePermissions() {
  return apiFetch<UserRolePermissionRecord[]>("/role-permissions/users", {
    cache: "no-store",
    tags: ["role-permissions-users"],
  });
}

export async function updateUserRolePermissions(
  userId: number,
  payload: UpdateUserRolePermissionsPayload,
) {
  return apiFetch<UserRolePermissionRecord>(`/role-permissions/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

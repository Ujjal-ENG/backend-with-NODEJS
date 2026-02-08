"use client";

import { useActionState } from "react";
import {
  updateUserRolePermissionsAction,
  type UserRolePermissionActionState,
} from "@/app/dashboard/users/actions";
import { Button } from "@/components/ui/button";
import type { UserRolePermissionRecord } from "@/lib/api/role-permissions";
import type { PermissionKey } from "@/types/entities";

interface UserRolePermissionFormProps {
  user: UserRolePermissionRecord;
  roles: string[];
  permissions: PermissionKey[];
}

export function UserRolePermissionForm({
  user,
  roles,
  permissions,
}: UserRolePermissionFormProps) {
  const [state, formAction, isPending] = useActionState<
    UserRolePermissionActionState,
    FormData
  >(
    updateUserRolePermissionsAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="userId" value={user.id} />

      <div className="grid gap-2">
        <label htmlFor={`role-${user.id}`} className="text-sm font-medium">
          Role
        </label>
        <select
          id={`role-${user.id}`}
          name="role"
          defaultValue={user.role}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          {roles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Permissions</p>
        <div className="grid max-h-52 gap-2 overflow-y-auto rounded-md border p-3 md:grid-cols-2">
          {permissions.map((permission) => (
            <label
              key={permission}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <input
                type="checkbox"
                name="permissions"
                value={permission}
                defaultChecked={user.effectivePermissions.includes(permission)}
                className="h-4 w-4"
              />
              <span>{permission}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          If none are checked, role default permissions will be used.
        </p>
      </div>

      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-green-600">{state.success}</p>
      ) : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save Permissions"}
      </Button>
    </form>
  );
}

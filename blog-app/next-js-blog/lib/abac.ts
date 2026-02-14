import type { SessionUser } from "@/lib/auth";
import type { Post } from "@/types/entities";
import {
  UserPlan,
  UserRole,
  type PermissionAction,
  type PermissionResource,
} from "@/types/entities";

type Resource = PermissionResource;
type Action = PermissionAction;
type Possession = "any" | "own";

interface PolicyInput {
  resource: Resource;
  action: Action;
  possession?: Possession;
  ownerId?: number;
}

export function can(
  session: SessionUser | null,
  { resource, action, possession = "any", ownerId }: PolicyInput,
): boolean {
  if (!session) return false;

  const permissions = session.permissions ?? [];

  // Backward compatibility for old access tokens that may not contain permissions.
  if (permissions.length === 0 && session.role === UserRole.ADMIN) {
    return true;
  }

  if (permissions.includes(`${resource}:${action}:any`)) {
    return true;
  }

  if (possession !== "own" || !permissions.includes(`${resource}:${action}:own`)) {
    return false;
  }

  return typeof ownerId === "number" && ownerId === session.id;
}

export function canCreatePost(session: SessionUser | null): boolean {
  return can(session, { resource: "post", action: "create" });
}

export function canEditPost(
  session: SessionUser | null,
  post: Pick<Post, "author">,
): boolean {
  if (session?.role === UserRole.USER && session.plan === UserPlan.FREE) {
    return false;
  }

  return can(session, {
    resource: "post",
    action: "update",
    possession: "own",
    ownerId: post.author.id,
  });
}

export function canDeletePost(
  session: SessionUser | null,
  post: Pick<Post, "author">,
): boolean {
  if (session?.role === UserRole.USER && session.plan === UserPlan.FREE) {
    return false;
  }

  return can(session, {
    resource: "post",
    action: "delete",
    possession: "own",
    ownerId: post.author.id,
  });
}

export function canManageTags(session: SessionUser | null): boolean {
  return can(session, { resource: "tag", action: "create" });
}

export function canManageUsers(session: SessionUser | null): boolean {
  return (
    can(session, { resource: "user", action: "read", possession: "any" }) &&
    can(session, { resource: "user", action: "update", possession: "any" })
  );
}

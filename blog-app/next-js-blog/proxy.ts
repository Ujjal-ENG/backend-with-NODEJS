import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

const protectedPaths = ["/dashboard"];
const authPaths = ["/sign-in", "/sign-up"];
const adminRole = "admin";
const tagPermission = "tag:create:any";
const rolePermissionPagePermissions = ["user:read:any", "user:update:any"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("accessToken")?.value;

  let isAuthenticated = false;
  let role = "user";
  let permissions: string[] = [];
  if (accessToken) {
    try {
      const decoded = jwtDecode<{
        exp: number;
        role?: string;
        permissions?: string[];
      }>(accessToken);
      isAuthenticated = decoded.exp * 1000 > Date.now();
      role = decoded.role ?? "user";
      permissions = decoded.permissions ?? [];
    } catch {
      isAuthenticated = false;
    }
  }

  if (protectedPaths.some((p) => pathname.startsWith(p)) && !isAuthenticated) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (authPaths.some((p) => pathname.startsWith(p)) && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (
    pathname.startsWith("/dashboard/tags") &&
    isAuthenticated &&
    role !== adminRole &&
    !permissions.includes(tagPermission)
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const needsUserManagementAccess =
    pathname.startsWith("/dashboard/users") ||
    pathname.startsWith("/dashboard/presence");

  if (needsUserManagementAccess && isAuthenticated) {
    const hasUserManagementAccess =
      role === adminRole ||
      rolePermissionPagePermissions.every((permission) =>
        permissions.includes(permission),
      );

    if (!hasUserManagementAccess) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/sign-in", "/sign-up"],
};

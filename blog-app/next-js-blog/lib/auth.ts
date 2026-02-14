import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { PermissionKey, UserPlan, UserRole } from "@/types/entities";

interface JwtPayload {
  id: number;
  email: string;
  role: UserRole;
  plan?: UserPlan;
  permissions: PermissionKey[];
  iat: number;
  exp: number;
}

export type SessionUser = JwtPayload;

export async function setAuthCookies(
  accessToken: string,
  refreshToken: string,
) {
  const cookieStore = await cookies();

  const decoded = jwtDecode<JwtPayload>(accessToken);
  const accessExpiry = new Date(decoded.exp * 1000);

  cookieStore.set("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: accessExpiry,
  });

  cookieStore.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) return null;
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    if (decoded.exp * 1000 < Date.now()) return null;
    return {
      ...decoded,
      role: decoded.role ?? UserRole.USER,
      plan: decoded.plan ?? UserPlan.FREE,
      permissions: decoded.permissions ?? [],
    };
  } catch {
    return null;
  }
}

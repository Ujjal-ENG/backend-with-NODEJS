import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

const protectedPaths = ["/dashboard"];
const authPaths = ["/sign-in", "/sign-up"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("accessToken")?.value;

  let isAuthenticated = false;
  if (accessToken) {
    try {
      const decoded = jwtDecode<{ exp: number }>(accessToken);
      isAuthenticated = decoded.exp * 1000 > Date.now();
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/sign-in", "/sign-up"],
};

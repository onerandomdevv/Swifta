import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * UTILITY: Decode JWT Payload without verification
 * JWT structure: header.payload.signature
 */
function decodeJwt(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Base64URL to Base64
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

    // Decode and Parse
    const payload = JSON.parse(atob(base64));
    return payload;
  } catch (error) {
    console.error("Middleware JWT decode error:", error);
    return null;
  }
}

// Route Configurations
const PUBLIC_PREFIXES = [
  "/",
  "/explore",
  "/p/",
  "/@",
  "/merchants",
  "/c/",
  "/about",
  "/terms",
  "/privacy",
  "/help",
  "/contact",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/api/",
  "/_next/",
  "/favicon.ico",
  "/manifest.json",
];

const AUTH_PAGES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

const ROLE_DASHBOARDS = {
  BUYER: "/buyer/feed",
  MERCHANT: "/merchant/dashboard",
  SUPER_ADMIN: "/admin/dashboard",
};

type Role = keyof typeof ROLE_DASHBOARDS;

export function middleware(request: NextRequest) {
  const { nextUrl, cookies } = request;
  const path = nextUrl.pathname;

  // 1. Check if the route is public
  const isPublic = PUBLIC_PREFIXES.some((prefix) =>
    prefix === "/" ? path === "/" : path.startsWith(prefix),
  );

  // 2. Auth State
  const token = cookies.get("hwos_access_token")?.value;
  const payload = token ? decodeJwt(token) : null;
  const userRole = payload?.role as Role | undefined;

  // 3. Logic: Unauthenticated User
  if (!token) {
    const isProtected = ["/buyer", "/merchant", "/admin"].some((p) =>
      path.startsWith(p),
    );

    if (isProtected) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", path);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 4. Logic: Authenticated User
  // Redirect away from login/register if already authenticated
  if (AUTH_PAGES.some((p) => path.startsWith(p))) {
    const dashboard =
      userRole && ROLE_DASHBOARDS[userRole] ? ROLE_DASHBOARDS[userRole] : "/";
    return NextResponse.redirect(new URL(dashboard, request.url));
  }

  // Role Gate: Ensure role matches path prefix
  if (path.startsWith("/buyer") && userRole !== "BUYER") {
    return NextResponse.redirect(
      new URL(ROLE_DASHBOARDS[userRole!] || "/", request.url),
    );
  }

  if (path.startsWith("/merchant") && userRole !== "MERCHANT") {
    return NextResponse.redirect(
      new URL(ROLE_DASHBOARDS[userRole!] || "/", request.url),
    );
  }

  if (path.startsWith("/admin") && userRole !== "SUPER_ADMIN") {
    return NextResponse.redirect(
      new URL(ROLE_DASHBOARDS[userRole!] || "/", request.url),
    );
  }

  return NextResponse.next();
}

// Next.js Middleware Config
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (manifest file)
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json).*)",
  ],
};

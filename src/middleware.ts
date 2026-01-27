import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";
import rbacConfig from "./config/rbac.json";

const { auth } = NextAuth(authConfig);

type Role = "ADMIN" | "MANAGER" | "STAFF" | "WATCHER";

// Helper to check if a route pattern matches the current path
// Handles simple exact match and Next.js style dynamic segments [id]
function matchRoute(pattern: string, pathname: string): boolean {
  if (pattern === pathname) return true;

  // Convert pattern like /events/[id]/edit to regex: ^/events/[^/]+/edit$
  const regexStr = pattern
    .replace(/\[\.\.\.[^\]]+\]/g, ".*") // Catch-all [...slug] -> .*
    .replace(/\[[^\]]+\]/g, "[^/]+") // Dynamic segment [id] -> [^/]+
    .replace(/\//g, "\\/"); // Escape slashes

  const regex = new RegExp(`^${regexStr}$`);
  return regex.test(pathname);
}

function getAllowedRoles(pathname: string): string[] | null {
  // 1. Check strict page rules from rbac.json
  // Sort patterns by length descending to match most specific first
  const patterns = Object.keys(rbacConfig.pages).sort(
    (a, b) => b.length - a.length,
  );

  for (const pattern of patterns) {
    if (matchRoute(pattern, pathname)) {
      // Found a match
      return (rbacConfig.pages as any)[pattern];
    }
  }

  return null;
}

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const user = req.auth?.user as any;
  const role = user?.role as Role | undefined;
  const isLoggedIn = !!user;

  // Skip public routes and assets
  const isPublicRoute =
    pathname === "/login" ||
    pathname === "/setup" ||
    pathname === "/unauthorized" ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/api/auth"); // Allow auth APIs unconditionally

  if (
    isPublicRoute ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static")
  ) {
    return NextResponse.next();
  }

  // Not logged in - redirect to login
  if (!isLoggedIn) {
    // For API routes, return 401
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Check role-based access
  const allowedRoles = getAllowedRoles(pathname);

  if (allowedRoles === null) {
    // Unknown route logic

    // Allow API routes to pass through (rely on handler security)
    if (pathname.startsWith("/api/")) {
      return NextResponse.next();
    }

    // Default to ADMIN only for unknown UI routes
    if (role !== "ADMIN") {
      console.log(
        `[Middleware] Blocking access to ${pathname} for ${role} (No Rule)`,
      );
      return NextResponse.redirect(new URL("/unauthorized", nextUrl));
    }
  } else {
    // Rule found, check if role is allowed
    // @ts-ignore
    if (!allowedRoles.includes(role)) {
      console.log(
        `[Middleware] Blocking access to ${pathname} for ${role} (Allowed: ${allowedRoles})`,
      );
      return NextResponse.redirect(new URL("/unauthorized", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};

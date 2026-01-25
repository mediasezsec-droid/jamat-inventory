import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

// Centralized Page Access Rules
// ADMIN: Can do everything
// MANAGER: Can view/create events, view logs, ledger
// STAFF: Can only access inventory and lost items
// WATCHER: Can view inventory and events (no edit/create)

type Role = "ADMIN" | "MANAGER" | "STAFF" | "WATCHER";

const PAGE_ACCESS: Record<string, Role[]> = {
  // Dashboard - Everyone
  "/": ["ADMIN", "MANAGER", "STAFF", "WATCHER"],

  // Events
  "/events": ["ADMIN", "MANAGER", "WATCHER"],
  "/events/new": ["ADMIN", "MANAGER"],

  // Inventory - Everyone can view
  "/inventory": ["ADMIN", "MANAGER", "STAFF", "WATCHER"],

  // Ledger - Financial data
  "/ledger": ["ADMIN", "MANAGER"],

  // System Logs
  "/logs": ["ADMIN", "MANAGER"],

  // Lost Items
  "/lost-items": ["ADMIN", "MANAGER", "STAFF"],

  // Settings - Admin only
  "/settings": ["ADMIN"],
  "/settings/venues": ["ADMIN"],
  "/settings/caterers": ["ADMIN"],
  "/settings/data": ["ADMIN"],

  // Profile - Everyone
  "/profile": ["ADMIN", "MANAGER", "STAFF", "WATCHER"],
  "/complete-profile": ["ADMIN", "MANAGER", "STAFF", "WATCHER"],

  // Users - Admin only
  "/users": ["ADMIN"],
};

// Dynamic route patterns
const DYNAMIC_ROUTES: Array<{ pattern: RegExp; roles: Role[] }> = [
  // /events/[id] - View event details
  { pattern: /^\/events\/[^/]+$/, roles: ["ADMIN", "MANAGER", "WATCHER"] },
  // /events/[id]/inventory - Manage event inventory
  { pattern: /^\/events\/[^/]+\/inventory$/, roles: ["ADMIN", "MANAGER"] },
  // /events/[id]/edit - Edit event
  { pattern: /^\/events\/[^/]+\/edit$/, roles: ["ADMIN", "MANAGER"] },
  // /inventory/[id] - View/edit inventory item
  { pattern: /^\/inventory\/[^/]+$/, roles: ["ADMIN", "MANAGER", "STAFF"] },
];

function getAllowedRoles(pathname: string): Role[] | null {
  // Check static routes first
  if (PAGE_ACCESS[pathname]) {
    return PAGE_ACCESS[pathname];
  }

  // Check dynamic routes
  for (const route of DYNAMIC_ROUTES) {
    if (route.pattern.test(pathname)) {
      return route.roles;
    }
  }

  // If route starts with known prefixes, apply parent rules
  if (pathname.startsWith("/settings/")) return ["ADMIN"];
  if (pathname.startsWith("/events/")) return ["ADMIN", "MANAGER", "WATCHER"];
  if (pathname.startsWith("/inventory/"))
    return ["ADMIN", "MANAGER", "STAFF", "WATCHER"];

  // Unknown routes default to ADMIN only
  return null;
}

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const user = req.auth?.user as any;
  const role = user?.role as Role | undefined;
  const isLoggedIn = !!user;

  // Skip public routes
  const isPublicRoute =
    pathname === "/login" ||
    pathname === "/setup" ||
    pathname === "/unauthorized" ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/api/");

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Not logged in - redirect to login
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Check role-based access
  const allowedRoles = getAllowedRoles(pathname);

  if (allowedRoles === null) {
    // Unknown route - only allow ADMIN
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", nextUrl));
    }
  } else if (!allowedRoles.includes(role!)) {
    // User role not in allowed list
    return NextResponse.redirect(new URL("/unauthorized", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};

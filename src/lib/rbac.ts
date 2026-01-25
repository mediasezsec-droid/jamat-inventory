import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Role } from "@/types";

// Define page access rules
// ADMIN: Can do everything
// MANAGER: Can view and create events, view logs, ledger
// STAFF: Can only access inventory and lost items
// WATCHER: Can view inventory and events (no edit)

type PageAccess = {
  allowedRoles: Role[];
};

const PAGE_ACCESS: Record<string, PageAccess> = {
  // Dashboard - Everyone
  "/": { allowedRoles: ["ADMIN", "MANAGER", "STAFF", "WATCHER"] },

  // Events
  "/events": { allowedRoles: ["ADMIN", "MANAGER", "WATCHER"] },
  "/events/new": { allowedRoles: ["ADMIN", "MANAGER"] },
  "/events/[id]": { allowedRoles: ["ADMIN", "MANAGER", "WATCHER"] },
  "/events/[id]/inventory": { allowedRoles: ["ADMIN", "MANAGER"] },

  // Inventory - Everyone can view, but edit is restricted in component
  "/inventory": { allowedRoles: ["ADMIN", "MANAGER", "STAFF", "WATCHER"] },

  // Ledger - Financial data
  "/ledger": { allowedRoles: ["ADMIN", "MANAGER"] },

  // System Logs
  "/logs": { allowedRoles: ["ADMIN", "MANAGER"] },

  // Lost Items
  "/lost-items": { allowedRoles: ["ADMIN", "MANAGER", "STAFF"] },

  // Settings - Admin only
  "/settings": { allowedRoles: ["ADMIN"] },
  "/settings/venues": { allowedRoles: ["ADMIN"] },
  "/settings/caterers": { allowedRoles: ["ADMIN"] },
  "/settings/data": { allowedRoles: ["ADMIN"] },

  // Profile - Everyone
  "/profile": { allowedRoles: ["ADMIN", "MANAGER", "STAFF", "WATCHER"] },
  "/complete-profile": {
    allowedRoles: ["ADMIN", "MANAGER", "STAFF", "WATCHER"],
  },

  // Users - Admin only
  "/users": { allowedRoles: ["ADMIN"] },
};

/**
 * Server-side role verification. Call this at the top of Server Components.
 * Redirects to /unauthorized if user doesn't have access.
 *
 * @param pagePath - The page path to check access for (e.g., "/settings")
 * @returns The session with user data if authorized
 */
export async function requireAccess(pagePath: string) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as any;
  const role = user.role as Role;

  // Normalize path for dynamic routes
  let normalizedPath = pagePath;

  // Handle dynamic routes like /events/[id]
  if (pagePath.match(/^\/events\/[^/]+$/)) {
    normalizedPath = "/events/[id]";
  } else if (pagePath.match(/^\/events\/[^/]+\/inventory$/)) {
    normalizedPath = "/events/[id]/inventory";
  }

  const access = PAGE_ACCESS[normalizedPath];

  // If page not defined, default to ADMIN only
  if (!access) {
    if (role !== "ADMIN") {
      redirect("/unauthorized");
    }
    return session;
  }

  // Check if user's role is allowed
  if (!access.allowedRoles.includes(role)) {
    redirect("/unauthorized");
  }

  return session;
}

/**
 * Check if user can edit (not just view) - for inventory pages etc.
 */
export function canEdit(role: Role): boolean {
  return role === "ADMIN" || role === "MANAGER" || role === "STAFF";
}

/**
 * Check if user can create events
 */
export function canCreateEvents(role: Role): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

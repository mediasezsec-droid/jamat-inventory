import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Role } from "@/types";
import rbacConfig from "@/config/rbac.json";

type PagePath = keyof typeof rbacConfig.pages;

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

  // Find matching rule
  let allowedRoles: Role[] | undefined;

  // 1. Exact match
  if (pagePath in rbacConfig.pages) {
    allowedRoles = rbacConfig.pages[pagePath as PagePath] as Role[];
  } else {
    // 2. Dynamic match
    const patterns = Object.keys(rbacConfig.pages).sort(
      (a, b) => b.length - a.length,
    );
    for (const pattern of patterns) {
      const regexStr = pattern
        .replace(/\[\.\.\.[^\]]+\]/g, ".*")
        .replace(/\[[^\]]+\]/g, "[^/]+")
        .replace(/\//g, "\\/");

      if (new RegExp(`^${regexStr}$`).test(pagePath)) {
        allowedRoles = rbacConfig.pages[pattern as PagePath] as Role[];
        break;
      }
    }
  }

  // If page not defined, default to ADMIN only
  if (!allowedRoles) {
    if (role !== "ADMIN") {
      redirect("/unauthorized");
    }
    return session;
  }

  // Check if user's role is allowed
  if (!allowedRoles.includes(role)) {
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

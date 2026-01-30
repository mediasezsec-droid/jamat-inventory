import { auth } from "@/lib/auth";
import rbacConfig from "@/config/rbac.json";
import { Role } from "@/generated/prisma/client";

type PagePath = keyof typeof rbacConfig.pages;

export async function checkPageAccess(path: string): Promise<boolean> {
  const session = await auth();
  const userRole = (session?.user as any)?.role as Role;

  if (!userRole) return false;
  if (userRole === "ADMIN") return true;

  // Find matching rule
  let allowedRoles: Role[] | undefined;

  // 1. Exact match
  if (path in rbacConfig.pages) {
    allowedRoles = rbacConfig.pages[path as PagePath] as Role[];
  } else {
    // 2. Dynamic match (similar to middleware)
    const patterns = Object.keys(rbacConfig.pages).sort(
      (a, b) => b.length - a.length,
    );
    for (const pattern of patterns) {
      // Convert pattern like /events/[id] to regex
      const regexStr = pattern
        .replace(/\[\.\.\.[^\]]+\]/g, ".*")
        .replace(/\[[^\]]+\]/g, "[^/]+")
        .replace(/\//g, "\\/");

      if (new RegExp(`^${regexStr}$`).test(path)) {
        allowedRoles = rbacConfig.pages[pattern as PagePath] as Role[];
        break;
      }
    }
  }

  // Strict Security Policy: If page is not in config, DENY access.
  if (!allowedRoles) return false;

  return allowedRoles.includes(userRole);
}

export async function getCurrentRole(): Promise<Role | null> {
  const session = await auth();
  return (session?.user as any)?.role as Role | null;
}

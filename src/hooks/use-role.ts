"use client";

import { useSession } from "next-auth/react";
import { Role } from "@/types";

export function useRole() {
  const { data: session, status } = useSession();
  const role = (session?.user as any)?.role as Role | undefined;

  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER" || isAdmin;
  const isStaff = role === "STAFF" || isManager;
  const isWatcher = role === "WATCHER" || isStaff; // Watcher is lowest, but usually read-only access matches basic auth?

  // Actually, based on types.ts: ADMIN, MANAGER, STAFF, WATCHER
  // Hierarchy usually: ADMIN > MANAGER > STAFF > WATCHER

  return {
    role,
    isLoading: status === "loading",
    isAdmin,
    isManager,
    isStaff,
    isWatcher, // effectively isLoggedIn
    user: session?.user,
  };
}

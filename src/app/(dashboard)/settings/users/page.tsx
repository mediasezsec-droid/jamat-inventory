import { redirect } from "next/navigation";
import { checkPageAccess } from "@/lib/rbac-server";
import UsersPageClient from "./client";

export const dynamic = "force-dynamic";

export default async function UsersSettingsPage() {
    const hasAccess = await checkPageAccess("/settings/users");
    if (!hasAccess) {
        redirect("/unauthorized");
    }

    return <UsersPageClient />;
}

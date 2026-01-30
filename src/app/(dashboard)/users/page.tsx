import { redirect } from "next/navigation"; // ensure redirect is imported
import { checkPageAccess } from "@/lib/rbac-server";
import { UsersClient } from "./_components/users-client";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
    const hasAccess = await checkPageAccess("/users");
    if (!hasAccess) {
        redirect("/unauthorized");
    }
    return <UsersClient />;
}

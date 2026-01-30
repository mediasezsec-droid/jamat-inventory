import { redirect } from "next/navigation";
import { checkPageAccess } from "@/lib/rbac-server";
import DataManagementPageClient from "./client";

export const dynamic = "force-dynamic";

export default async function DataManagementPage() {
    const hasAccess = await checkPageAccess("/settings/data");
    if (!hasAccess) {
        redirect("/unauthorized");
    }

    return <DataManagementPageClient />;
}

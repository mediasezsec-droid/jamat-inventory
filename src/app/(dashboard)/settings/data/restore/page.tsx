import { Metadata } from "next";
import RestoreDataClient from "./client";

export const metadata: Metadata = {
    title: "Restore Data | Jamaat Inventory",
    description: "Restore system data.",
};

import { redirect } from "next/navigation";
import { checkPageAccess } from "@/lib/rbac-server";

export default async function RestoreDataPage() {
    const hasAccess = await checkPageAccess("/settings/data/restore");
    if (!hasAccess) {
        redirect("/unauthorized");
    }

    return <RestoreDataClient />;
}

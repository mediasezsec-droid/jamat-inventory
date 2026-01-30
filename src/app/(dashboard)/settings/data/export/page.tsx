import { Metadata } from "next";
import ExportDataClient from "./client";

export const metadata: Metadata = {
    title: "Export Data | Jamaat Inventory",
    description: "Export system data.",
};

import { redirect } from "next/navigation";
import { checkPageAccess } from "@/lib/rbac-server";

export default async function ExportDataPage() {
    const hasAccess = await checkPageAccess("/settings/data/export");
    if (!hasAccess) {
        redirect("/unauthorized");
    }

    return <ExportDataClient />;
}

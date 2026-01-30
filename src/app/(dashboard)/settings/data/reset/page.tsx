import { Metadata } from "next";
import ResetSystemClient from "./client";

export const metadata: Metadata = {
    title: "System Reset | Jamaat Inventory",
    description: "Danger - System Reset",
};

import { redirect } from "next/navigation";
import { checkPageAccess } from "@/lib/rbac-server";

export default async function ResetSystemPage() {
    const hasAccess = await checkPageAccess("/settings/data/reset");
    if (!hasAccess) {
        redirect("/unauthorized");
    }

    return <ResetSystemClient />;
}

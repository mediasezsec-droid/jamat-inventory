import { redirect } from "next/navigation";
import { rtdb } from "@/lib/firebase";
import { checkPageAccess } from "@/lib/rbac-server";
import { SettingsHubClient } from "./_components/settings-hub-client";

export const dynamic = "force-dynamic";

export default async function SettingsHubPage() {
    const hasAccess = await checkPageAccess("/settings");
    if (!hasAccess) {
        redirect("/unauthorized");
    }

    return <SettingsHubClient />;
}

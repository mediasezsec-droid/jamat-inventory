import { redirect } from "next/navigation";
import { checkPageAccess } from "@/lib/rbac-server";
import { LogsClient } from "./_components/logs-client";
import { rtdb } from "@/lib/firebase";

export const dynamic = "force-dynamic";

export default async function LogsPage() {
    const hasAccess = await checkPageAccess("/logs");
    if (!hasAccess) {
        redirect("/");
    }

    let initialLogs = [];
    try {
        const snapshot = await rtdb
            .ref("logs")
            .orderByChild("timestamp")
            .limitToLast(200) // Increased limit slightly for SSR
            .once("value");
        const logs = snapshot.val();

        initialLogs = logs
            ? Object.entries(logs)
                .map(([id, data]: [string, any]) => ({ id, ...data }))
                .reverse()
            : [];
    } catch (error) {
        console.error("Failed to fetch logs server-side:", error);
    }

    return <LogsClient initialLogs={initialLogs} />;
}

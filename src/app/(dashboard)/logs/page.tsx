import { requireAccess } from "@/lib/rbac";
import { LogsClient } from "./_components/logs-client";

export const dynamic = "force-dynamic";

export default async function LogsPage() {
    await requireAccess("/logs");
    return <LogsClient />;
}

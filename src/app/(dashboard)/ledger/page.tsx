import { redirect } from "next/navigation";
import { checkPageAccess } from "@/lib/rbac-server";
import { LedgerClient } from "./_components/ledger-client";
import { rtdb } from "@/lib/firebase";

export const dynamic = "force-dynamic";

const INVENTORY_ACTIONS = [
    "ISSUE",
    "RETURN",
    "REMOVED",
    "RETURNED",
    "STOCK_ADDED",
    "STOCK_UPDATED",
    "STOCK_ADJUSTED",
    "INVENTORY_ISSUED",
    "INVENTORY_RETURNED",
    "ITEM_CREATED",
    "ITEM_UPDATED",
    "ITEM_DELETED",
];

export default async function LedgerPage() {
    const hasAccess = await checkPageAccess("/ledger");
    if (!hasAccess) {
        redirect("/");
    }

    let initialLogs: any[] = [];
    try {
        const snapshot = await rtdb.ref("logs").limitToLast(1000).once("value");
        const logs: any[] = [];

        snapshot.forEach((child) => {
            const log = { id: child.key, ...child.val() };
            const action = log.action || "";
            const isInventoryAction = INVENTORY_ACTIONS.some(
                (invAction) =>
                    action.includes(invAction) ||
                    action.toUpperCase().includes(invAction)
            );
            if (isInventoryAction) {
                logs.push(log);
            }
        });

        logs.sort((a, b) => b.timestamp - a.timestamp);
        initialLogs = logs;
    } catch (error) {
        console.error("Failed to fetch ledger server-side", error);
    }

    return <LedgerClient initialLogs={initialLogs} />;
}

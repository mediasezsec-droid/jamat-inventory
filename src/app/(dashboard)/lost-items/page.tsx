import { redirect } from "next/navigation";
import { checkPageAccess } from "@/lib/rbac-server";
import LostItemsClient from "./_components/lost-items-client";
import { rtdb } from "@/lib/firebase";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LostItemsPage() {
    const hasAccess = await checkPageAccess("/lost-items");
    if (!hasAccess) {
        redirect("/");
    }

    let initialLogs: any[] = [];
    try {
        const logsRef = rtdb.ref("logs");
        const snapshot = await logsRef.limitToLast(500).once("value");

        if (snapshot.exists()) {
            const logs = snapshot.val();
            const lostItems: any[] = [];
            const eventIds = new Set<string>();

            Object.entries(logs).forEach(([key, log]: [string, any]) => {
                const originalQty = log.details?.quantity || 0;
                const recoveredQty = log.recoveredQuantity || 0;
                const remainingQty = originalQty - recoveredQty;

                if (log.action === "INVENTORY_LOSS" && remainingQty > 0) {
                    lostItems.push({
                        id: key,
                        ...log,
                        remainingQuantity: remainingQty,
                    });
                    if (log.details?.eventId) eventIds.add(log.details.eventId);
                }
            });

            const eventNames: Record<string, string> = {};
            if (eventIds.size > 0) {
                const events = await prisma.event.findMany({
                    where: {
                        id: { in: Array.from(eventIds) },
                    },
                    select: {
                        id: true,
                        name: true,
                    },
                });

                events.forEach((e) => (eventNames[e.id] = e.name));
            }

            initialLogs = lostItems.map((item) => ({
                ...item,
                eventName: item.details?.eventId
                    ? eventNames[item.details.eventId] || "Deleted/Unknown Event"
                    : "N/A",
            }));

            initialLogs.sort((a, b) => b.timestamp - a.timestamp);
        }
    } catch (error) {
        console.error("Failed to fetch lost items server-side", error);
    }

    return <LostItemsClient initialLogs={initialLogs} />;
}

import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentRole } from "@/lib/rbac-server";
import { Event, InventoryItem } from "@/types";
import EventDetailsClient from "./_components/event-details-client";
import { rtdb } from "@/lib/firebase"; // Keep RTDB for logs if available there

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EventDetailsPage({ params }: PageProps) {
    const { id: eventId } = await params;

    // Strict Server-Side Check
    const role = await getCurrentRole();
    if (!role) redirect("/login");

    try {
        // Fetch event and inventory from Prisma
        // Fetch logs? If we don't have a reliable source for logs yet, passing empty array is safer than breaking.
        // But let's try to simulate fetching logs if we can, or just wait for logs migration.
        // Given the instructions, we stick to safety.

        const [event, inventory] = await Promise.all([
            prisma.event.findUnique({ where: { id: eventId } }),
            prisma.inventoryItem.findMany(),
        ]);

        if (!event) {
            notFound();
        }

        // Transform for client to ensure serialization matches types
        const safeEvent = {
            ...event,
            occasionDate: event.occasionDate.toISOString(),
            createdAt: event.createdAt.toISOString(),
            updatedAt: event.updatedAt.toISOString(),
            // Ensure compatibility with Event type
        } as unknown as Event;

        const safeInventory = inventory.map(i => ({
            ...i,
        })) as unknown as InventoryItem[];

        // Fetch logs from 'event_logs/{eventId}'
        const logsRef = rtdb.ref(`event_logs/${eventId}`);
        const logsSnapshot = await logsRef.once("value");
        const safeLogs: any[] = [];
        logsSnapshot.forEach((child) => {
            safeLogs.push({ id: child.key, ...child.val() });
        });
        // Sort by timestamp desc
        safeLogs.sort((a, b) => b.timestamp - a.timestamp);

        return (
            <EventDetailsClient
                initialEvent={safeEvent}
                initialInventory={safeInventory}
                initialLogs={safeLogs}
            />
        );
    } catch (error) {
        console.error("Failed to fetch event data:", error);
        notFound();
    }
}

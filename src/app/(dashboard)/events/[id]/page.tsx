import { notFound } from "next/navigation";
import { db } from "@/lib/firebase";
import { Event, InventoryItem } from "@/types";
import EventDetailsClient from "./_components/event-details-client";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EventDetailsPage({ params }: PageProps) {
    const { id: eventId } = await params;

    // Fetch event, inventory, and logs in parallel
    let event: Event | null = null;
    let inventory: InventoryItem[] = [];
    let logs: any[] = [];

    try {
        const [eventDoc, inventorySnap, logsSnap] = await Promise.all([
            db.collection("events").doc(eventId).get(),
            db.collection("inventory").get(),
            db.collection("events").doc(eventId).collection("logs").orderBy("timestamp", "desc").get(),
        ]);

        if (!eventDoc.exists) {
            notFound();
        }

        event = { id: eventDoc.id, ...eventDoc.data() } as Event;
        inventory = inventorySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as InventoryItem[];
        logs = logsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Failed to fetch event data:", error);
        notFound();
    }

    return (
        <EventDetailsClient
            initialEvent={event}
            initialInventory={inventory}
            initialLogs={logs}
        />
    );
}

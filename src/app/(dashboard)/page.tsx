import { db } from "@/lib/firebase";
import { Event } from "@/types";
import DashboardClient from "./_components/dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    // Fetch today's events server-side
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    let initialEvents: Event[] = [];
    try {
        const snapshot = await db.collection("events")
            .where("occasionDate", ">=", startOfDay)
            .where("occasionDate", "<=", endOfDay)
            .orderBy("occasionDate", "asc")
            .get();

        initialEvents = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Event[];
    } catch (error) {
        console.error("Failed to fetch initial events:", error);
    }

    return <DashboardClient initialEvents={initialEvents} />;
}

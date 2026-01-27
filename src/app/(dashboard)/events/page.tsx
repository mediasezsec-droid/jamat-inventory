import { redirect } from "next/navigation";
import { checkPageAccess } from "@/lib/rbac-server";
import { prisma } from "@/lib/db";
import EventsClient from "./_components/events-client";
import { Event } from "@/types";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
    const hasAccess = await checkPageAccess("/events");
    if (!hasAccess) {
        redirect("/");
    }

    let initialEvents: Event[] = [];

    try {
        const events = await prisma.event.findMany({
            orderBy: { occasionDate: 'desc' }
        });

        initialEvents = events.map(event => ({
            ...event,
            occasionDate: event.occasionDate.toISOString(),
            createdAt: event.createdAt.toISOString(),
            updatedAt: event.updatedAt?.toISOString(),
            // Ensure type compatibility for any other fields if necessary
        })) as unknown as Event[];

    } catch (error) {
        console.error("Failed to fetch events:", error);
    }

    return <EventsClient initialEvents={initialEvents} />;
}

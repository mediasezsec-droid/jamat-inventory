import { requireAccess } from "@/lib/rbac";
import EventsClient from "./_components/events-client";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
    await requireAccess("/events");
    return <EventsClient />;
}

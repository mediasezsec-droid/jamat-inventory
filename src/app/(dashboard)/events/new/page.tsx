import { requireAccess } from "@/lib/rbac";
import NewEventClient from "./_components/new-event-client";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
    await requireAccess("/events/new");
    return <NewEventClient />;
}

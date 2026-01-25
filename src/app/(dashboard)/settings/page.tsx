import { redirect } from "next/navigation";
import { rtdb } from "@/lib/firebase";
import { auth } from "@/lib/auth";
import { SettingsHubClient } from "./_components/settings-hub-client";

export const dynamic = "force-dynamic";

export default async function SettingsHubPage() {
    const session = await auth();
    const user = session?.user as any;

    if (!user || user.role !== "ADMIN") {
        redirect("/unauthorized");
    }

    let bookingWindow = 60;
    try {
        const snapshot = await rtdb.ref("config/bookingWindow").once("value");
        const val = snapshot.val();
        if (typeof val === "number") bookingWindow = val;
    } catch (error) {
        console.error("Failed to fetch booking config:", error);
    }

    return <SettingsHubClient initialBookingWindow={bookingWindow} />;
}

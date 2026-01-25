import { redirect } from "next/navigation";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/auth";
import { VenuesClient } from "./_components/venues-client";

export const dynamic = "force-dynamic";

export default async function VenuesPage() {
    const session = await auth();
    const user = session?.user as any;

    if (!user || user.role !== "ADMIN") {
        redirect("/unauthorized");
    }

    let venues: any[] = [];
    try {
        const snapshot = await db.collection("settings").doc("masterData").get();
        if (snapshot.exists) {
            const data = snapshot.data();
            const rawVenues = data?.halls || [];

            // Normalize data (handle legacy strings vs objects)
            venues = rawVenues.map((v: any) => {
                if (typeof v === "string") return { id: v, name: v }; // Legacy: use name as ID
                return v;
            });
        }
    } catch (error) {
        console.error("Failed to fetch venues:", error);
    }

    return <VenuesClient initialVenues={venues} />;
}

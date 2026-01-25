import { redirect } from "next/navigation";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/auth";
import { CaterersClient } from "./_components/caterers-client";

export const dynamic = "force-dynamic";

export default async function CaterersPage() {
    const session = await auth();
    const user = session?.user as any;

    if (!user || user.role !== "ADMIN") {
        redirect("/unauthorized");
    }

    let caterers: any[] = [];
    try {
        const snapshot = await db.collection("settings").doc("masterData").get();
        if (snapshot.exists) {
            const data = snapshot.data();
            const rawCaterers = data?.caterers || [];

            // Normalize data (handle legacy strings vs objects)
            caterers = rawCaterers.map((c: any) => {
                if (typeof c === "string") return { id: c, name: c, phone: "" }; // Legacy
                return { id: c.id || c.name, name: c.name, phone: c.phone || "" };
            });
        }
    } catch (error) {
        console.error("Failed to fetch caterers:", error);
    }

    return <CaterersClient initialCaterers={caterers} />;
}

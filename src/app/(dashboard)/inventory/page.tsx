import { db } from "@/lib/firebase";
import { InventoryItem } from "@/types";
import InventoryClient from "./_components/inventory-client";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
    let initialItems: InventoryItem[] = [];

    try {
        const snapshot = await db.collection("inventory").orderBy("name", "asc").get();
        initialItems = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as InventoryItem[];
    } catch (error) {
        console.error("Failed to fetch inventory:", error);
    }

    return <InventoryClient initialItems={initialItems} />;
}

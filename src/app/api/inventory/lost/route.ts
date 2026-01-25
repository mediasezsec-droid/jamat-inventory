import { NextResponse } from "next/server";
import { rtdb, db } from "@/lib/firebase";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch logs - Fallback to fetching latest 500 and filtering in-memory to avoid index issues
    const logsRef = rtdb.ref("logs");
    const snapshot = await logsRef.limitToLast(500).get();

    if (!snapshot.exists()) {
      return NextResponse.json([]);
    }

    const logs = snapshot.val();
    const lostItems: any[] = [];
    const eventIds = new Set<string>();

    // Process logs
    Object.entries(logs).forEach(([key, log]: [string, any]) => {
      // Check for partial recovery
      const originalQty = log.details?.quantity || 0;
      const recoveredQty = log.recoveredQuantity || 0;
      const remainingQty = originalQty - recoveredQty;

      // Filter: Must be LOSS action and have remaining items
      if (log.action === "INVENTORY_LOSS" && remainingQty > 0) {
        lostItems.push({
          id: key,
          ...log,
          remainingQuantity: remainingQty,
        });
        if (log.details?.eventId) eventIds.add(log.details.eventId);
      }
    });

    console.log(
      `[API] Found ${lostItems.length} lost items. Fetching details for ${eventIds.size} events.`,
    );

    // Fetch Event Names
    const eventNames: Record<string, string> = {};
    if (eventIds.size > 0) {
      // Firestore `in` query only supports 10 items.
      // If many events, this is tricky.
      // We'll fetch all needed events individually or via batches.
      // For MVP, concurrent fetching.

      const eventPromises = Array.from(eventIds).map(async (eid) => {
        const doc = await db.collection("events").doc(eid).get();
        if (doc.exists) {
          return { id: eid, name: doc.data()?.name || "Unknown Event" };
        }
        return { id: eid, name: "Deleted Event" };
      });

      const events = await Promise.all(eventPromises);
      events.forEach((e) => (eventNames[e.id] = e.name));
    }

    // Attach event names
    const enrichedItems = lostItems.map((item) => ({
      ...item,
      eventName: item.details?.eventId
        ? eventNames[item.details.eventId]
        : "N/A",
    }));

    // Sort by timestamp desc
    enrichedItems.sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json(enrichedItems);
  } catch (error) {
    console.error("Fetch lost items error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

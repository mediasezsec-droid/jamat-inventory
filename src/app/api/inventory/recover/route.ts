import { NextResponse } from "next/server";
import { db, rtdb } from "@/lib/firebase";
import { auth } from "@/lib/auth";
import { logAction } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId, quantity, eventId, logId } = await req.json();

    if (!itemId || !quantity || !logId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Ref to item
    const itemRef = db.collection("inventory").doc(itemId);
    const itemDoc = await itemRef.get();

    if (!itemDoc.exists) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // 1. Update Firestore Inventory (Add back stock)
    await db.runTransaction(async (t) => {
      const doc = await t.get(itemRef);
      const data = doc.data()!;

      const newTotal = (data.totalQuantity || 0) + quantity;
      const newAvailable = (data.availableQuantity || 0) + quantity;

      t.update(itemRef, {
        totalQuantity: newTotal,
        availableQuantity: newAvailable,
      });
    });

    // 2. Update RTDB Log (Handle Partial Recovery)
    const logRef = rtdb.ref(`logs/${logId}`);

    await logRef.transaction((currentLog) => {
      if (currentLog) {
        const originalQty = currentLog.details?.quantity || 0;
        const previousRecovered = currentLog.recoveredQuantity || 0;
        const newRecovered = previousRecovered + quantity;

        // Update recovered count
        currentLog.recoveredQuantity = newRecovered;

        // Check if fully recovered
        if (newRecovered >= originalQty) {
          currentLog.isRecovered = true;
        } else {
          // Ensure isRecovered is false if still partial
          currentLog.isRecovered = false;
        }

        return currentLog;
      }
      return currentLog; // Abort if log doesn't exist
    });

    // 3. Log the recovery action
    await logAction(
      "INVENTORY_RETURNED",
      {
        eventId: eventId || "manual_recovery",
        itemId,
        itemName: itemDoc.data()?.name,
        quantity,
        recoveredFromLogId: logId,
        note: `Recovered ${quantity} from Lost Items`,
      },
      {
        id: session.user.id || "unknown",
        name: session.user.name || "Unknown User",
      },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Recovery error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

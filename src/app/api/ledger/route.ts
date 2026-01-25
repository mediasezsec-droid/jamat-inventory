import { NextResponse } from "next/server";
import { rtdb } from "@/lib/firebase";

export const dynamic = "force-dynamic";

// Inventory-related action types to include in ledger
const INVENTORY_ACTIONS = [
  "ISSUE",
  "RETURN",
  "REMOVED",
  "RETURNED",
  "STOCK_ADDED",
  "STOCK_UPDATED",
  "STOCK_ADJUSTED",
  "INVENTORY_ISSUED",
  "INVENTORY_RETURNED",
  "ITEM_CREATED",
  "ITEM_UPDATED",
  "ITEM_DELETED",
];

export async function GET() {
  try {
    // Fetch logs from RTDB
    const logsRef = rtdb.ref("logs");
    const snapshot = await logsRef.limitToLast(1000).once("value");

    const logs: any[] = [];
    snapshot.forEach((child) => {
      const log = { id: child.key, ...child.val() };
      // Only include inventory-related actions
      const action = log.action || "";
      const isInventoryAction = INVENTORY_ACTIONS.some(
        (invAction) =>
          action.includes(invAction) ||
          action.toUpperCase().includes(invAction),
      );
      if (isInventoryAction) {
        logs.push(log);
      }
    });

    // Sort by timestamp desc (newest first)
    logs.sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Failed to fetch ledger:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

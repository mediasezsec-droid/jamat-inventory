import { NextResponse } from "next/server";
import { db, rtdb } from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: {
    firestore: {
      status: "connected" | "error";
      latencyMs: number;
      error?: string;
    };
    rtdb: { status: "connected" | "error"; latencyMs: number; error?: string };
  } = {
    firestore: { status: "error", latencyMs: 0 },
    rtdb: { status: "error", latencyMs: 0 },
  };

  // Test Firestore connectivity
  try {
    const startFs = Date.now();
    await db.collection("_health_check").limit(1).get();
    results.firestore = {
      status: "connected",
      latencyMs: Date.now() - startFs,
    };
  } catch (error: any) {
    results.firestore = {
      status: "error",
      latencyMs: 0,
      error: error.message || "Connection failed",
    };
  }

  // Test RTDB connectivity
  try {
    const startRtdb = Date.now();
    await rtdb.ref("_health_check").once("value");
    results.rtdb = {
      status: "connected",
      latencyMs: Date.now() - startRtdb,
    };
  } catch (error: any) {
    results.rtdb = {
      status: "error",
      latencyMs: 0,
      error: error.message || "Connection failed",
    };
  }

  return NextResponse.json(results);
}

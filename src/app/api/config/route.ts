import { NextResponse } from "next/server";
import { rtdb } from "@/lib/firebase";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const snapshot = await rtdb.ref("config/bookingWindow").once("value");
    const window = snapshot.val() || 60; // Default 60 minutes
    return NextResponse.json({ bookingWindow: window });
  } catch (error) {
    console.error("Config fetch error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { bookingWindow } = body;

    if (typeof bookingWindow !== "number") {
      return NextResponse.json(
        { error: "Invalid window value" },
        { status: 400 },
      );
    }

    await rtdb.ref("config/bookingWindow").set(bookingWindow);
    return NextResponse.json({ success: true, bookingWindow });
  } catch (error) {
    console.error("Config update error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

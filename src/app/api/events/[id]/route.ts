import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { Event } from "@/types";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const params = await props.params;
    const eventId = params.id;

    const docRef = db.collection("events").doc(eventId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const eventData = {
      id: docSnap.id,
      ...docSnap.data(),
    } as Event;

    return NextResponse.json(eventData);
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const params = await props.params;
    const eventId = params.id;
    const body = await req.json();

    // Remove id from body if present
    delete body.id;
    delete body.createdAt;

    const updateData = {
      ...body,
      updatedAt: new Date().toISOString(),
    };

    await db.collection("events").doc(eventId).update(updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const params = await props.params;
    const eventId = params.id;
    const { searchParams } = new URL(req.url);
    const force = searchParams.get("force") === "true";

    // Check for inventory logs
    const logsSnap = await db
      .collection("inventory_logs")
      .where("eventId", "==", eventId)
      .get();

    if (!logsSnap.empty && !force) {
      return NextResponse.json(
        {
          error: "Related data exists",
          related: ["Inventory Logs"],
          count: logsSnap.size,
        },
        { status: 409 },
      );
    }

    // Delete logs if they exist (cascading delete)
    if (!logsSnap.empty) {
      const batch = db.batch();
      logsSnap.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }

    // Delete the event
    await db.collection("events").doc(eventId).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

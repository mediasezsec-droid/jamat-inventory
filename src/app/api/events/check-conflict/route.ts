import { NextResponse } from "next/server";
import { db, rtdb } from "@/lib/firebase";
import { Event } from "@/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { occasionDate, occasionTime, hall } = body; // hall is string | string[]

    if (!occasionDate || !occasionTime || !hall) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 1. Get Config & Master Data
    const [configSnapshot, masterDataDoc] = await Promise.all([
      rtdb.ref("config/bookingWindow").once("value"),
      db.collection("settings").doc("masterData").get(),
    ]);

    // Default duration window (length of event) - default 60 mins if not set
    // Note: This is the assumed DURATION of the event itself.
    const eventDurationMinutes = configSnapshot.val() || 60;

    // Requested Buffer Time (2 Hours before event)
    const BUFFER_MINUTES = 120;

    // Get All Halls
    const masterData = masterDataDoc.exists
      ? masterDataDoc.data()
      : { halls: [] };
    const allHalls: string[] = masterData?.halls || [
      "Maimoon Hall",
      "Qutbi Hall",
      "Fakhri Hall",
      "Najmi Hall",
    ];

    // 2. Parse Proposed Time
    const proposedDate = new Date(occasionDate);
    const [hours, minutes] = occasionTime.split(":").map(Number);
    const proposedStart = new Date(proposedDate);
    proposedStart.setHours(hours, minutes, 0, 0);

    const proposedEnd = new Date(
      proposedStart.getTime() + eventDurationMinutes * 60000,
    );

    // Effective Range including Buffer (Start - 2h)
    const proposedEffectiveStart = new Date(
      proposedStart.getTime() - BUFFER_MINUTES * 60000,
    );

    // 3. Query Events for the same day (and previous day to catch adjacent buffer overlaps)
    // To be safe, look at a wider range.
    // If I start at 00:30, 2h buffer starts previous day 22:30.
    const queryStart = new Date(proposedEffectiveStart);
    queryStart.setHours(0, 0, 0, 0); // Start of effective day (or just day of buffer start)

    const queryEnd = new Date(proposedEnd);
    queryEnd.setHours(23, 59, 59, 999);

    const snapshot = await db
      .collection("events")
      .where("occasionDate", ">=", queryStart.toISOString()) // Approximate query, refining in-memory
      .get();

    const events = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Event[];

    // 4. Check Conflicts
    let conflictType: "none" | "hard" | "soft" = "none";
    let conflictMessage = "";

    // Track occupied halls to suggest alternatives
    const occupiedHalls = new Set<string>();

    for (const event of events) {
      if (event.status === "CANCELLED") continue;

      // Parse Existing Event Time
      const eventDate = new Date(event.occasionDate);
      const [eHours, eMinutes] = event.occasionTime.split(":").map(Number);

      // Construct event start time on its correct date
      const eventStart = new Date(eventDate);
      eventStart.setHours(eHours, eMinutes, 0, 0);
      const eventEnd = new Date(
        eventStart.getTime() + eventDurationMinutes * 60000,
      );

      // Effective Range for Existing Event
      const eventEffectiveStart = new Date(
        eventStart.getTime() - BUFFER_MINUTES * 60000,
      );

      // --- CHECK 1: HARD CONFLICT (Actual Event Overlap) ---
      // (StartA < EndB) and (EndA > StartB)
      const isHardOverlap =
        proposedStart < eventEnd && proposedEnd > eventStart;

      // --- CHECK 2: BUFFER CONFLICT (Overlap including buffers) ---
      // We check if the occupied time (including buffer) overlaps.
      // Logic:
      // A collision occurs if the "Exclusive Zone" of one event overlaps with the "Exclusive Zone" of another.
      // Exclusive Zone = [Start - 2h, End] (assuming buffer is pre-event exclusive)
      // Wait, usually buffer means "Time needed to prepare".
      // So if Event A is [14:00, 16:00], it needs [12:00, 14:00] for prep.
      // If Event B is [13:00, 15:00], it needs [11:00, 13:00] for prep.
      // Do they clash?
      // B needs Hall at 11:00. A needs Hall at 12:00.
      // A's event starts 14:00.
      // B's event is running [13:00, 15:00] (Actual).
      // A needs prep at 12:00-14:00.
      // B occupies 13:00-15:00. They OVERLAP in [13:00, 14:00].

      // So yes, we check overlap of [Start - Buffer, End] vs [Start - Buffer, End].
      // Actually, stricter: The "Footprint" of an event is [Start-Buffer, End].
      // If Footprints overlap, it's a conflict.

      const isBufferOverlap =
        proposedEffectiveStart < eventEnd && proposedEnd > eventEffectiveStart;

      if (isBufferOverlap) {
        const proposedHallsList = Array.isArray(hall) ? hall : [hall];
        const eventHallsList = Array.isArray(event.hall)
          ? event.hall
          : [event.hall];

        const commonHalls = proposedHallsList.filter((h) =>
          eventHallsList.includes(h),
        );

        if (commonHalls.length > 0) {
          // Add to occupied list
          commonHalls.forEach((h) => occupiedHalls.add(h));

          // Determine Severity
          if (isHardOverlap) {
            // Actual Event Overlap -> HARD
            conflictType = "hard";
            conflictMessage = `HARD CONFLICT: ${commonHalls.join(", ")} is booked by "${event.name}" (${event.occasionTime}).`;
            // We can break on hard conflict usually, but let's gather all occupied halls first?
            // Actually usually hard conflict stops the flow.
          } else {
            // Buffer Only Overlap -> SOFT
            if (conflictType !== "hard") {
              conflictType = "soft";
              conflictMessage = `BUFFER ALERT: "${event.name}" is scheduled at ${event.occasionTime}. 2-hour buffer required.`;
            }
          }
        }
      }
    }

    const availableHalls = allHalls.filter((h) => !occupiedHalls.has(h));

    return NextResponse.json({
      conflictType,
      conflictMessage,
      occupiedHalls: Array.from(occupiedHalls),
      availableHalls,
    });
  } catch (error) {
    console.error("Conflict check error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

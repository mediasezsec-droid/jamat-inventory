import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rtdb } from "@/lib/firebase";
import { Event } from "@/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { occasionDate, occasionTime, hall } = body; // hall is string | string[]

    if (!occasionDate || !occasionTime || !hall) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Bypass check for specific "virtual" locations where conflicts don't matter
    const bypassHalls = ["na", "others", "house", "self"];
    const hallsToCheck = Array.isArray(hall) ? hall : [hall]; // Ensure array
    const isBypassHall = hallsToCheck.some((h) =>
      bypassHalls.includes(h.toLowerCase().trim()),
    );

    if (isBypassHall) {
      return NextResponse.json({
        conflictType: "none",
        conflictMessage: "",
        occupiedHalls: [],
        availableHalls: [],
      });
    }

    // 1. Get Config & Halls
    const [configSnapshot, halls] = await Promise.all([
      rtdb.ref("config/bookingWindow").once("value"),
      prisma.hall.findMany({ select: { name: true } }),
    ]);

    // Default duration window (length of event) - default 60 mins if not set
    const eventDurationMinutes = configSnapshot.val() || 60;

    // Requested Buffer Time (2 Hours before event)
    const BUFFER_MINUTES = 120;

    // Get All Halls
    const allHalls = halls.map((h) => h.name);
    if (allHalls.length === 0) {
      // Fallback defaults if DB empty? Or just empty.
      // allHalls.push("Maimoon Hall", "Qutbi Hall"...);
    }

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
    const queryStart = new Date(proposedEffectiveStart);
    queryStart.setHours(0, 0, 0, 0);

    const queryEnd = new Date(proposedEnd);
    queryEnd.setHours(23, 59, 59, 999);

    const events = await prisma.event.findMany({
      where: {
        occasionDate: {
          gte: queryStart,
          lte: queryEnd,
        },
        status: { not: "CANCELLED" },
        // Exclude current event if updating
        ...(body.excludeEventId ? { id: { not: body.excludeEventId } } : {}),
      },
    });

    // 4. Check Conflicts
    let conflictType: "none" | "hard" | "soft" = "none";
    let conflictMessage = "";

    // Track occupied halls to suggest alternatives
    const occupiedHalls = new Set<string>();

    for (const event of events) {
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
      const isHardOverlap =
        proposedStart < eventEnd && proposedEnd > eventStart;

      // --- CHECK 2: BUFFER CONFLICT (Overlap including buffers) ---
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

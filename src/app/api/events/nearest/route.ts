import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { startOfDay } from "date-fns";

export async function GET() {
  try {
    const today = startOfDay(new Date());

    // 1. Try to find the nearest UPCOMING event (including today)
    const upcomingEvent = await prisma.event.findFirst({
      where: {
        occasionDate: { gte: today },
        status: { not: "CANCELLED" },
      },
      orderBy: { occasionDate: "asc" },
      select: {
        id: true,
        menu: true,
        thaalCount: true,
        eventType: true,
        hallCounts: true,
        name: true,
        occasionDate: true,
      },
    });

    if (upcomingEvent) {
      return NextResponse.json(upcomingEvent);
    }

    // 2. If no upcoming event, find the nearest PAST event
    const pastEvent = await prisma.event.findFirst({
      where: {
        occasionDate: { lt: today },
        status: { not: "CANCELLED" },
      },
      orderBy: { occasionDate: "desc" },
      select: {
        id: true,
        menu: true,
        thaalCount: true,
        eventType: true,
        hallCounts: true,
        name: true,
        occasionDate: true,
      },
    });

    if (pastEvent) {
      return NextResponse.json(pastEvent);
    }

    // 3. No events found at all
    return NextResponse.json({ message: "No events found" }, { status: 404 });
  } catch (error) {
    console.error("Error fetching nearest event:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

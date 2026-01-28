import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { CrockeryStatus } from "@/generated/prisma/client";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    let whereClause = {};

    if (date) {
      const targetDate = new Date(date);
      // Assume 'date' parameter is the intended day.
      // We want the full day range in IST for that specific date.
      // But 'date' from client usually comes as ISO string or YYYY-MM-DD?
      // If client sends YYYY-MM-DD, `new Date(date)` might be UTC midnight.

      // Let's parse strictly.
      // If date is "2026-01-27T00:00:00.000Z", we might just want to use it as anchor.

      // Robust extraction of Y/M/D from the input date object (assuming it represents the target day properly)
      // Actually, let's treat the input `date` as ANY time within the target IST day.
      const options: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "numeric",
        day: "numeric",
      };
      const formatter = new Intl.DateTimeFormat([], options);
      const parts = formatter.formatToParts(targetDate);
      const year = parseInt(parts.find((p) => p.type === "year")?.value || "0");
      const month =
        parseInt(parts.find((p) => p.type === "month")?.value || "0") - 1;
      const day = parseInt(parts.find((p) => p.type === "day")?.value || "0");

      // Construct Start of IST Day in UTC
      const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      startOfDay.setHours(startOfDay.getHours() - 5);
      startOfDay.setMinutes(startOfDay.getMinutes() - 30);

      const endOfDay = new Date(startOfDay);
      endOfDay.setHours(endOfDay.getHours() + 24);
      endOfDay.setMilliseconds(-1);

      whereClause = {
        occasionDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      };
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      orderBy: { occasionDate: "asc" },
    });

    // Transform dates to ISO strings for compatibility
    const formattedEvents = events.map((event) => ({
      ...event,
      occasionDate: event.occasionDate.toISOString(),
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    }));

    return NextResponse.json(formattedEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  // RBAC: Only ADMIN and MANAGER can create events
  const session = await auth();
  const user = session?.user as any;
  const role = user?.role;

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json(
      { error: "Forbidden - Insufficient permissions" },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const {
      mobile,
      name,
      email,
      occasionDate,
      occasionTime,
      description,
      hall,
      catererName,
      catererPhone,
      thaalCount,
      sarkariThaalSet,
      extraChilamchiLota,
      tablesAndChairs,
      bhaiSaabIzzan,
      benSaabIzzan,
      mic,
      crockeryRequired,
      thaalForDevri,
      paat,
      masjidLight,
      acStartTime,
      partyTime,
      decorations,
      gasCount,
      menu,
      eventType,
      hallCounts,
    } = body;

    // Basic validation
    if (!mobile || !name || !occasionDate || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const parsedDate = new Date(occasionDate);

    const newEvent = await prisma.event.create({
      data: {
        mobile,
        name,
        email: email || null,
        occasionDate: parsedDate,
        occasionDay: parsedDate.toLocaleDateString("en-US", {
          weekday: "long",
        }),
        occasionTime: occasionTime || "",
        description,
        hall: Array.isArray(hall) ? hall : [hall],
        catererName: catererName || "",
        catererPhone: catererPhone || "",
        thaalCount: Number(thaalCount) || 0,
        sarkariThaalSet: Number(sarkariThaalSet) || 0,
        extraChilamchiLota: Number(extraChilamchiLota) || 0,
        tablesAndChairs: Number(tablesAndChairs) || 0,
        bhaiSaabIzzan: Boolean(bhaiSaabIzzan),
        benSaabIzzan: Boolean(benSaabIzzan),
        mic: Boolean(mic),
        crockeryRequired: Boolean(crockeryRequired),
        crockeryStatus: crockeryRequired
          ? ("PENDING" as CrockeryStatus)
          : ("NOT_REQUIRED" as CrockeryStatus),
        thaalForDevri: Boolean(thaalForDevri),
        paat: Boolean(paat),
        masjidLight: Boolean(masjidLight),
        acStartTime: acStartTime || null,
        partyTime: partyTime || null,
        decorations: Boolean(decorations),
        gasCount: gasCount ? Number(gasCount) : null,
        menu: menu || null,
        eventType: eventType || "PRIVATE",
        hallCounts: hallCounts || null,
        createdById: user.id || null,
      },
    });

    // Send email to admins and booker
    try {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { email: true },
      });
      const adminEmails = admins
        .map((a) => a.email)
        .filter((e): e is string => !!e);

      if (adminEmails.length > 0 || email) {
        const { newEventTemplate, sendEmail } = await import("@/lib/email");
        const { generatePdf, eventPdfTemplate } = await import("@/lib/pdf");

        // Prepare event data for PDF
        const eventDataForPdf = {
          ...newEvent,
          occasionDate: newEvent.occasionDate.toISOString(),
          createdAt: newEvent.createdAt.toISOString(),
          updatedAt: newEvent.updatedAt.toISOString(),
        };

        // Generate PDF
        let pdfBuffer: Buffer | undefined;
        try {
          const pdfHtml = eventPdfTemplate(eventDataForPdf as any);
          pdfBuffer = await generatePdf(pdfHtml);
        } catch (pdfError) {
          console.error("Failed to generate PDF:", pdfError);
        }

        const attachments = pdfBuffer
          ? [
              {
                filename: `Event_${name.replace(/\s+/g, "_")}_${occasionDate}.pdf`,
                content: pdfBuffer,
              },
            ]
          : undefined;

        // Send to Admins
        if (adminEmails.length > 0) {
          await sendEmail({
            to: adminEmails,
            subject: `New Event: ${name}`,
            html: newEventTemplate({
              name,
              mobile,
              occasionDate,
              occasionTime,
              hall: Array.isArray(hall) ? hall.join(", ") : hall,
              thaalCount: Number(thaalCount),
            }),
            attachments,
          });
        }

        // Send to Booker
        if (email) {
          await sendEmail({
            to: email,
            subject: `Booking Confirmation: ${name}`,
            html: newEventTemplate({
              name,
              mobile,
              occasionDate,
              occasionTime,
              hall: Array.isArray(hall) ? hall.join(", ") : hall,
              thaalCount: Number(thaalCount),
            }),
            attachments,
          });
        }
      }
    } catch (emailError) {
      console.error("Failed to send new event email:", emailError);
    }

    // Return with formatted dates
    return NextResponse.json(
      {
        ...newEvent,
        occasionDate: newEvent.occasionDate.toISOString(),
        createdAt: newEvent.createdAt.toISOString(),
        updatedAt: newEvent.updatedAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

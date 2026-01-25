import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { Event } from "@/types";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date"); // ISO string

    let query: FirebaseFirestore.Query = db.collection("events");

    if (date) {
      // Filter by date (exact match on occasionDate string or range?)
      // Assuming occasionDate is stored as ISO string, we might need to match the day.
      // For simplicity, let's assume the client sends the start and end of the day, or we filter in memory (not ideal for large datasets).
      // Better: Store 'occasionDay' as 'YYYY-MM-DD' for easy querying.
      // Let's check the Event type again.

      // The Event type has `occasionDate: string` (ISO) and `occasionDay: string` (Day name e.g. Friday).
      // It doesn't seem to have a simple YYYY-MM-DD field.
      // I'll try to query by range for the given date.
      const targetDate = new Date(date);
      const startOfDay = new Date(
        targetDate.setHours(0, 0, 0, 0),
      ).toISOString();
      const endOfDay = new Date(
        targetDate.setHours(23, 59, 59, 999),
      ).toISOString();

      query = query
        .where("occasionDate", ">=", startOfDay)
        .where("occasionDate", "<=", endOfDay);
    }

    const snapshot = await query.orderBy("occasionDate", "asc").get();
    const events = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Event[];

    return NextResponse.json(events);
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
    } = body;

    // Basic validation
    if (!mobile || !name || !occasionDate || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const eventData: Omit<Event, "id"> = {
      mobile,
      name,
      email,
      occasionDate, // Assuming client sends ISO string
      occasionDay: new Date(occasionDate).toLocaleDateString("en-US", {
        weekday: "long",
      }),
      occasionTime,
      description,
      hall,
      catererName,
      catererPhone,
      thaalCount: Number(thaalCount),
      sarkariThaalSet: Number(sarkariThaalSet),
      extraChilamchiLota: Number(extraChilamchiLota),
      tablesAndChairs: Number(tablesAndChairs),
      bhaiSaabIzzan,
      benSaabIzzan,
      mic,
      crockeryRequired,
      crockeryStatus: crockeryRequired ? "PENDING" : "NOT_REQUIRED",
      thaalForDevri,
      paat,
      masjidLight,
      acStartTime,
      partyTime,
      decorations,
      gasCount,
      menu,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection("events").add(eventData);

    // Send email to admins and booker
    try {
      const adminsSnapshot = await db
        .collection("users")
        .where("role", "==", "ADMIN")
        .get();
      const adminEmails = adminsSnapshot.docs
        .map((doc) => doc.data().email)
        .filter((email) => email);

      if (adminEmails.length > 0 || email) {
        const { newEventTemplate, sendEmail } = await import("@/lib/email");
        const { generatePdf, eventPdfTemplate } = await import("@/lib/pdf");

        // Generate PDF
        let pdfBuffer: Buffer | undefined;
        try {
          const pdfHtml = eventPdfTemplate(eventData);
          pdfBuffer = await generatePdf(pdfHtml);
        } catch (pdfError) {
          console.error("Failed to generate PDF:", pdfError);
        }

        const attachments = pdfBuffer
          ? [
              {
                filename: `Event_${name.replace(
                  /\s+/g,
                  "_",
                )}_${occasionDate}.pdf`,
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
              hall,
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
              hall,
              thaalCount: Number(thaalCount),
            }),
            attachments,
          });
        }
      }
    } catch (emailError) {
      console.error("Failed to send new event email:", emailError);
    }

    return NextResponse.json({ id: docRef.id, ...eventData }, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

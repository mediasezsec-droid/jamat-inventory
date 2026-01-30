import { NextResponse } from "next/server";
import { getMisriDate } from "@/lib/misri-calendar";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date") || searchParams.get("gDate");

  let date: Date;
  if (dateParam) {
    // Parse "YYYY-MM-DD" as UTC Midnight
    date = new Date(dateParam);
  } else {
    // Default to Today IST
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    // Create UTC date mirroring the IST components
    date = new Date(
      Date.UTC(
        istTime.getUTCFullYear(),
        istTime.getUTCMonth(),
        istTime.getUTCDate(),
        12,
        0,
        0,
      ),
    );
  }

  try {
    const hijri = await fetch(
      "https://hijricalendar.alaqmar.dev/api/hijri?gdate=" + date,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    const data = await hijri.json();

    return NextResponse.json({
      hijri: data.formattedEn,
      arabic: data.formattedAr,
    });
  } catch (error) {
    console.error("Hijri Date Error:", error);
    return NextResponse.json(
      { error: "Failed to load Hijri date" },
      { status: 500 },
    );
  }
}

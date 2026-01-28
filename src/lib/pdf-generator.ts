import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { Event, InventoryLog } from "@/types";

const format12Hour = (timeStr: string | undefined | null) => {
  if (!timeStr || timeStr === "NA") return "NA";
  try {
    const [hours, minutes] = timeStr.split(":");
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    if (isNaN(date.getTime())) return timeStr;
    return format(date, "h:mm a");
  } catch (e) {
    return timeStr;
  }
};

export const generateEventManifest = async (
  event: Event,
  logs: InventoryLog[],
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // -- Colors --
  const PRIMARY_COLOR = [22, 163, 74]; // Emerald-600
  const TEXT_COLOR = [30, 41, 59]; // Slate-800
  const SECONDARY_TEXT_COLOR = [100, 116, 139]; // Slate-500

  // -- Helper: Load Image --
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
    });
  };

  // -- Header Image --
  let headerHeight = 0;
  try {
    const headerImg = await loadImage("/manifest_thumbnail.png");
    // Edge to edge full width
    const imgWidth = pageWidth;
    const imgHeight = (headerImg.height / headerImg.width) * imgWidth;

    doc.addImage(headerImg, "PNG", 0, 0, imgWidth, imgHeight);
    headerHeight = imgHeight;
  } catch (e) {
    console.warn("Manifest thumbnail not found, skipping.");
  }

  // -- Header Text --
  // Moved to Footer as per request.

  // -- Event Details Section --
  const detailsY = headerHeight + 14;
  doc.setFontSize(14);
  doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
  doc.setFont("helvetica", "bold");
  doc.text(event.name, 14, detailsY);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);

  const leftColX = 14;
  const rightColX = pageWidth / 2 + 10;
  let yPos = detailsY + 8;

  doc.text(
    `Date: ${format(new Date(event.occasionDate), "PPP")}`,
    leftColX,
    yPos,
  );
  doc.text(
    `Hall: ${Array.isArray(event.hall) ? event.hall.join(", ") : event.hall}`,
    rightColX,
    yPos,
  );
  yPos += 6;
  doc.text(`Time: ${event.occasionTime}`, leftColX, yPos);
  doc.text(`Caterer: ${event.catererName || "N/A"}`, rightColX, yPos);
  yPos += 6;
  doc.text(`Contact: ${event.mobile}`, leftColX, yPos);
  doc.text(`Thaal Count: ${event.thaalCount}`, rightColX, yPos);

  // -- Summary Stats --
  const itemStats = itemsFromLogs(logs);
  const totalItems = itemStats.length;
  const totalIssued = itemStats.reduce((sum, i) => sum + i.issued, 0);
  const totalReturned = itemStats.reduce((sum, i) => sum + i.returned, 0);
  const isSettled = totalIssued === totalReturned;

  yPos += 14;

  // Draw Summary Box
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.roundedRect(14, yPos, pageWidth - 28, 24, 2, 2, "F");

  const boxY = yPos + 16;
  doc.setFontSize(10);
  doc.setTextColor(
    SECONDARY_TEXT_COLOR[0],
    SECONDARY_TEXT_COLOR[1],
    SECONDARY_TEXT_COLOR[2],
  );

  doc.text("TOTAL ITEMS", 30, yPos + 8, { align: "center" });
  doc.text("TOTAL ISSUED", 80, yPos + 8, { align: "center" });
  doc.text("TOTAL RETURNED", 130, yPos + 8, { align: "center" });
  doc.text("STATUS", 180, yPos + 8, { align: "center" });

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);

  doc.text(totalItems.toString(), 30, boxY, { align: "center" });
  doc.text(totalIssued.toString(), 80, boxY, { align: "center" });
  doc.text(totalReturned.toString(), 130, boxY, { align: "center" });

  if (isSettled) {
    doc.setTextColor(22, 163, 74); // Green
    doc.text("SETTLED", 180, boxY, { align: "center" });
  } else {
    doc.setTextColor(234, 88, 12); // Orange
    doc.text("PENDING", 180, boxY, { align: "center" });
  }

  // -- Inventory Table --
  doc.setFontSize(12);
  doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
  doc.text("Item Details", 14, yPos + 36);

  const tableData = itemStats.map((stat) => {
    let status = "";
    if (stat.deficit > 0) status = formatDeficit(stat.deficit);
    else if (stat.lost > 0) status = "Loss Recorded";
    else if (stat.deficit < 0) status = formatDeficit(stat.deficit);
    else status = "Settled";

    return [
      stat.name,
      stat.issued > 0 ? stat.issued.toString() : "-",
      stat.returned > 0 ? stat.returned.toString() : "-",
      status,
    ];
  });

  // Calculate Ref ID for Footer
  const refId = `INV-${format(new Date(event.occasionDate), "yyyy")}-${event.id.slice(0, 6).toUpperCase()}`;

  autoTable(doc, {
    startY: yPos + 40,
    head: [["Item Name", "Issued", "Returned", "Variance"]],
    body: tableData,
    theme: "plain",
    headStyles: {
      fillColor: [241, 245, 249], // Slate-100
      textColor: [71, 85, 105], // Slate-600
      fontStyle: "bold",
      fontSize: 9,
      cellPadding: 4,
    },
    bodyStyles: {
      textColor: [51, 65, 85], // Slate-700
      fontSize: 10,
      cellPadding: 4,
      lineColor: [226, 232, 240],
      lineWidth: { bottom: 0.1 },
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 30, halign: "center" },
      2: { cellWidth: 30, halign: "center" },
      3: { cellWidth: 40, halign: "center", fontStyle: "bold" },
    },
    didParseCell: function (data) {
      if (data.section === "body" && data.column.index === 3) {
        const text = data.cell.raw as string;
        if (text === "Settled") data.cell.styles.textColor = [22, 163, 74];
        else if (text === "Loss Recorded")
          data.cell.styles.textColor = [185, 28, 28];
        else if (text.startsWith("Pending"))
          data.cell.styles.textColor = [220, 38, 38];
        else data.cell.styles.textColor = [37, 99, 235];
      }
    },
    // Footer / Page Numbers
    didDrawPage: (data) => {
      // Footer branding
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height;

      doc.setDrawColor(226, 232, 240);
      doc.line(14, pageHeight - 22, pageSize.width - 14, pageHeight - 22);

      // Left: Title
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "bold");
      doc.text("INVENTORY MANIFEST", 14, pageHeight - 14);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("Official Inventory Control Document", 14, pageHeight - 10);

      // Right: Metadata
      doc.text(`Ref: ${refId}`, pageSize.width - 14, pageHeight - 14, {
        align: "right",
      });
      doc.text(
        `Generated: ${format(new Date(), "PPP p")}`,
        pageSize.width - 14,
        pageHeight - 10,
        { align: "right" },
      );

      // Bottom Center: Page Number
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${pageCount}`, pageSize.width / 2, pageHeight - 5, {
        align: "center",
      });
    },
  });

  let currentY = (doc as any).lastAutoTable?.finalY || 150;

  // -- Lost Items Section --
  const lostItems = itemStats.filter((i) => i.lost > 0);

  if (lostItems.length > 0) {
    currentY += 14;
    doc.setFontSize(12);
    doc.setTextColor(185, 28, 28); // Red-700
    doc.setFont("helvetica", "bold");
    doc.text("LOST / DAMAGED ITEMS", 14, currentY);

    const lostTableData = lostItems.map((item) => [
      item.name,
      item.lost.toString(),
    ]);

    autoTable(doc, {
      startY: currentY + 4,
      head: [["Item Name", "Quantity Lost"]],
      body: lostTableData,
      theme: "plain",
      headStyles: {
        fillColor: [254, 242, 242], // Red-50
        textColor: [185, 28, 28], // Red-700
        fontStyle: "bold",
        fontSize: 9,
        cellPadding: 4,
      },
      bodyStyles: {
        textColor: [60, 60, 60],
        fontSize: 10,
        cellPadding: 4,
        lineColor: [226, 232, 240],
        lineWidth: { bottom: 0.1 },
      },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 40, halign: "center", fontStyle: "bold" },
      },
      didDrawPage: (data) => {
        // Footer loop for subsequent pages if needed (autoTable adds to current page)
        // Note: autoTable only triggers didDrawPage for pages where the table is drawn.
        // We already have a hook in the main table. If this splits to new page, the hook there might not fire?
        // Actually hooks are per table.
      },
    });

    currentY = (doc as any).lastAutoTable?.finalY || currentY + 20;
  }

  // -- Signatures --
  const signatureY = currentY + 40;

  if (signatureY < pageHeight - 40) {
    drawSignatures(doc, signatureY, pageWidth);
  } else {
    doc.addPage();
    drawSignatures(doc, 40, pageWidth);
  }

  // Save
  const fileName = `Manifest_${event.name.replace(/\s+/g, "_")}_${format(new Date(), "yyyyMMdd")}.pdf`;
  doc.save(fileName);
};

function drawSignatures(doc: jsPDF, y: number, pageWidth: number) {
  doc.setDrawColor(203, 213, 225); // Slate-300
  doc.setLineWidth(0.5);

  // Left Sig
  doc.line(14, y, 80, y);
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // Slate-400
  doc.text("AUTHORIZED SIGNATURE", 14, y + 5);
  doc.text("Store Manager / Dispatcher", 14, y + 9);

  // Right Sig
  doc.line(pageWidth - 80, y, pageWidth - 14, y);
  doc.text("RECEIVER SIGNATURE", pageWidth - 80, y + 5);
  doc.text("Event Representative", pageWidth - 80, y + 9);
}

function formatDeficit(deficit: number) {
  if (deficit > 0) return `Pending (-${deficit})`;
  return `Surplus (+${Math.abs(deficit)})`;
}

function itemsFromLogs(logs: InventoryLog[]) {
  const itemMap = new Map<
    string,
    { name: string; issued: number; returned: number; lost: number }
  >();

  logs.forEach((log) => {
    // Robust Access
    const itemId = log.itemId || (log as any).details?.itemId;
    const itemName =
      log.itemName || (log as any).details?.itemName || "Unknown Item";
    const quantity = Number(
      log.quantity || (log as any).details?.quantity || 0,
    );

    if (!itemId) return;

    if (!itemMap.has(itemId)) {
      itemMap.set(itemId, {
        name: itemName,
        issued: 0,
        returned: 0,
        lost: 0,
      });
    }
    const entry = itemMap.get(itemId)!;

    const action = log.action || "";
    if (action.includes("ISSUE") || action.includes("REMOVED"))
      entry.issued += quantity;
    else if (action.includes("RETURN") || action.includes("RETURNED"))
      entry.returned += quantity;
    else if (action.includes("LOSS")) entry.lost += quantity;
  });

  // Sort by name
  return Array.from(itemMap.values())
    .map((entry) => ({
      ...entry,
      deficit: entry.issued - entry.returned - entry.lost,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const generateMiqaatBookingForm = async (
  event: Event,
  hijriDate?: string | null,
  hijriDateAr?: string | null,
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 14;

  // -- Helper: Load Image --
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = (err) => resolve(err as any);
    });
  };

  const loadFont = async (url: string): Promise<string> => {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    // Convert ArrayBuffer to Binary String
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Load Font
  try {
    const fontBase64 = await loadFont("/kanz-marjaan.ttf");
    doc.addFileToVFS("KanzMarjaan.ttf", fontBase64);
    doc.addFont("KanzMarjaan.ttf", "KanzMarjaan", "normal");
  } catch (e) {
    console.warn("Failed to load custom font", e);
  }

  // -- Header Image --
  let headerHeight = 0;
  // Assuming 190mm width for image to fit within margins or full width
  // Full width header logic
  const imgWidth = pageWidth;
  const imgHeight = 50; // Approximated aspect ratio
  try {
    const headerImg = await loadImage("/miqaat_thumbnail.png");
    if (headerImg instanceof HTMLImageElement) {
      doc.addImage(headerImg, "PNG", 0, 0, imgWidth, imgHeight);
      headerHeight = imgHeight;
    }
  } catch (e) {
    console.warn("Miqaat thumbnail not found, skipping.");
  }

  // Start content below header
  let currentY = headerHeight + 10;

  // -- Section 1: Booker & Event --
  // 2 Columns
  const col1X = margin;
  const col2X = pageWidth / 2 + 5;

  // Column 1: Booker
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // Slate-400
  doc.text("BOOKER", col1X, currentY); // Label

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text(event.name, col1X, currentY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(event.mobile, col1X, currentY + 11);
  if (event.email) doc.text(event.email, col1X, currentY + 16);

  // Column 2: Occasion
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text("OCCASION", col2X, currentY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(event.description, col2X, currentY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `${format(new Date(event.occasionDate), "PPP")}   ${format12Hour(event.occasionTime)}`,
    col2X,
    currentY + 11,
  );

  if (hijriDate) {
    doc.setFontSize(9);
    doc.setTextColor(67, 56, 202); // Indigo-700
    doc.text(`Hijri: ${hijriDate}`, col2X, currentY + 16);

    // Arabic Date (Render Right Aligned if possible, or simple placement)
    if (hijriDateAr) {
      doc.setFont("KanzMarjaan", "normal");
      doc.setFontSize(14);
      doc.text(hijriDateAr, col2X, currentY + 21);
      // Reset Font
      doc.setFont("helvetica", "normal");
    }
  }

  currentY += 24;

  // -- Section 2: Venue & Catering Box --
  const boxWidth = pageWidth - margin * 2;
  const hallColWidth = boxWidth / 2 - 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);

  // Robust Hall Extraction
  let halls = "Not Selected";
  const rawHall = event.hall;

  if (Array.isArray(rawHall)) {
    // Filter out empty/null values and join
    const validHalls = rawHall.filter((h) => h);
    if (validHalls.length > 0) halls = validHalls.join(", ");
  } else if (typeof rawHall === "string" && rawHall.trim().length > 0) {
    halls = rawHall;
  } else if (rawHall) {
    // Fallback for other types
    halls = String(rawHall);
  }

  const splitHalls = doc.splitTextToSize(halls, hallColWidth);
  const hallTextHeight = splitHalls.length * 5; // Approx 5 units per line

  const boxHeight = Math.max(22, 14 + hallTextHeight); // Min 22, or header + text

  doc.setFillColor(248, 250, 252); // Slate-50
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.roundedRect(margin, currentY, boxWidth, boxHeight, 2, 2, "FD");

  const boxInnerY = currentY + 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text("VENUE & CATERING", margin + 4, boxInnerY);

  const hallLabelY = boxInnerY + 6;
  const hallValueY = boxInnerY + 11;

  // Halls
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("HALL(S)", margin + 4, hallLabelY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(splitHalls, margin + 4, hallValueY);

  // Caterer
  const catX = pageWidth / 2 + 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("CATERER", catX, hallLabelY);

  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  let catText = event.catererName || "Not Specified";
  if (event.catererPhone) catText += ` (${event.catererPhone})`;
  // Wrap caterer text too just in case
  const splitCaterer = doc.splitTextToSize(catText, hallColWidth);
  doc.text(splitCaterer, catX, hallValueY);

  currentY += boxHeight + 6;

  // -- Section 3: Requirements --
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text("REQUIREMENTS", margin, currentY);
  currentY += 5;

  // Requirements Grid (Manual)
  const reqY = currentY;
  const colWidth = (pageWidth - margin * 2) / 2 - 10;

  const drawReqRow = (label: string, val: any, x: number, y: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(label, x, y);

    doc.setFont("helvetica", "bold");
    doc.text(String(val), x + colWidth - 5, y, { align: "right" });

    // Dotted line
    doc.setDrawColor(226, 232, 240);
    (doc as any).setLineDash([1, 2], 0);
    doc.line(x, y + 2, x + colWidth, y + 2);
    (doc as any).setLineDash([], 0); // Reset
  };

  drawReqRow("Thaal Count", event.thaalCount, margin, reqY);
  drawReqRow("Sarkari Sets", event.sarkariThaalSet, col2X, reqY);

  drawReqRow("Tables & Chairs", event.tablesAndChairs, margin, reqY + 7);
  drawReqRow("Extra Chilamchi", event.extraChilamchiLota, col2X, reqY + 7);

  // New Fields: AC Time, Party Time, Gas Count
  drawReqRow(
    "AC Start Time",
    format12Hour(event.acStartTime) || "NA",
    margin,
    reqY + 14,
  );
  drawReqRow(
    "Party Time",
    format12Hour(event.partyTime) || "NA",
    col2X,
    reqY + 14,
  );

  drawReqRow("Gas Count", event.gasCount || 0, margin, reqY + 21);

  currentY += 28;

  // Additional Items Checkbox style
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  const items = [
    { l: "Bhai Saab Izzan", v: event.bhaiSaabIzzan },
    { l: "Ben Saab Izzan", v: event.benSaabIzzan },
    { l: "Mic", v: event.mic },
    { l: "Crockery", v: event.crockeryRequired },
    { l: "Devri Thaal", v: event.thaalForDevri },
    { l: "PAAT", v: event.paat },
    { l: "Masjid Light", v: event.masjidLight },
    { l: "Decorations", v: event.decorations },
  ].filter((i) => i.v);

  if (items.length > 0) {
    let itemX = margin;
    const pageWidth = doc.internal.pageSize.width;

    items.forEach((item) => {
      const itemWidth = doc.getTextWidth(item.l) + 14;

      // Check if exceeds page width
      if (itemX + itemWidth > pageWidth - margin) {
        itemX = margin;
        currentY += 6;
      }

      doc.setFillColor(240, 253, 244); // Green-50
      doc.setDrawColor(22, 163, 74); // Green-600
      doc.rect(itemX, currentY, 4, 4, "DF");
      // Checkmark approximation
      doc.setDrawColor(22, 163, 74);
      doc.line(itemX + 1, currentY + 2, itemX + 2, currentY + 3);
      doc.line(itemX + 2, currentY + 3, itemX + 3, currentY + 1);

      doc.text(item.l, itemX + 6, currentY + 3);
      itemX += itemWidth;
    });
    currentY += 8;
  } else {
    doc.text("No additional items.", margin, currentY + 3);
    currentY += 8;
  }

  // -- Section 4: Menu --
  currentY += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text("MENU", margin, currentY);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, currentY + 2, pageWidth - margin * 2, 14, 2, 2, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  const menuText = doc.splitTextToSize(
    event.menu || "No menu specified.",
    pageWidth - margin * 2 - 8,
  );
  doc.text(menuText, margin + 4, currentY + 7);

  currentY += 20;

  // -- Section 5: Lagat Table --
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text("LAGAT & DEPOSITS", margin, currentY);

  // Lagat Rows Logic
  const lagatLabels = [
    { label: "Rs. Per Thaal", value: "" },
    { label: "Rs. Sarkari", value: "" },
    { label: "Rs. Kitchen", value: "" },
    { label: "Decoration", value: event.decorations ? "Yes" : "No" },
    { label: "Other", value: "" },
  ];

  // Prepare Halls for Table
  let tableHalls: string[] = [];
  if (Array.isArray(event.hall)) {
    tableHalls = event.hall.filter((h) => h && h.trim().length > 0);
  } else if (event.hall && typeof event.hall === "string") {
    tableHalls = [event.hall];
  }

  const maxRows = Math.max(lagatLabels.length, tableHalls.length);
  const bodyRows = [];

  for (let i = 0; i < maxRows; i++) {
    const labelItem = lagatLabels[i] || { label: "", value: "" };
    const hallName = tableHalls[i] || "";

    // Col 0: Label, Col 1: Empty, Col 2: Empty, Col 3: Hall Name, Col 4: Empty
    bodyRows.push([labelItem.label, "", "", hallName, ""]);
  }

  // Add TOTAL Row
  bodyRows.push(["Others", "", "", "TOTAL", ""]);

  autoTable(doc, {
    startY: currentY + 2,
    head: [],
    body: bodyRows,
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 2, // Compact
      lineColor: [226, 232, 240], // Slate-200
      lineWidth: 0.1,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 35 },
      1: { cellWidth: 25 },
      2: { cellWidth: 25 },
      3: { fontStyle: "bold", cellWidth: "auto" },
      4: { cellWidth: 25 },
    },
    didParseCell: (data) => {
      // Bold the last row ("TOTAL" row)
      if (
        data.row.index === bodyRows.length - 1 &&
        (data.column.index === 0 || data.column.index === 3)
      ) {
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  // Deposit Box
  const finalY = (doc as any).lastAutoTable?.finalY || currentY + 40;
  const depositX = pageWidth - margin - 40;
  const depositY = currentY + 2;
  // If we want the deposit box next to table, we need to know table width.
  // Instead, let's just place a box for "Returnable Deposit" somewhere or skip complex layout for now to be safe.
  // The screenshot shows it next to the table. AutoTable takes full width by default.
  // We can restrict AutoTable width.

  // Actually, easiest is just Draw the signatures below.

  // -- Footer / Signatures --
  const signY = finalY + 12; // Compact

  if (signY > pageHeight - 35) doc.addPage();

  const finalSignY = signY > pageHeight - 35 ? 40 : signY;

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(margin, finalSignY, margin + 60, finalSignY); // Left
  doc.line(pageWidth - margin - 60, finalSignY, pageWidth - margin, finalSignY); // Right

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("BOOKER SIGNATURE", margin, finalSignY + 5);
  doc.text("OFFICE SIGNATURE", pageWidth - margin - 60, finalSignY + 5);

  // -- Standard Footer (Manifest Style) --
  const refId = `INV-${format(new Date(event.occasionDate), "yyyy")}-${event.id.slice(0, 6).toUpperCase()}`;

  // We attach this to didDrawPage in a cleaner way if we used it above, but here we can just draw it on current page (and assuming single page for now).
  // Ideally use didDrawPage hook if multi-page.
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 22, pageWidth - 14, pageHeight - 22);

    // Left
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.text("MIQAAT BOOKING FORM", 14, pageHeight - 14);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Official Event Documentation", 14, pageHeight - 10);

    // Right
    doc.text(`Ref: ${refId}`, pageWidth - 14, pageHeight - 14, {
      align: "right",
    });
    doc.text(
      `Generated: ${format(new Date(), "PPP p")}`,
      pageWidth - 14,
      pageHeight - 10,
      { align: "right" },
    );

    // Center Page Num
    doc.text(`Page ${i}`, pageWidth / 2, pageHeight - 5, { align: "center" });
  }

  const fileName = `MiqaatForm_${event.name.replace(/\s+/g, "_")}.pdf`;
  doc.save(fileName);
};

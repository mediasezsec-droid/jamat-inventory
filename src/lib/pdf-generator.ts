import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { Event } from "@/types";

// Type for database-backed inventory allocations
interface EventInventoryAllocation {
  id: string;
  eventId: string;
  itemId: string;
  itemName: string;
  issuedQty: number;
  returnedQty: number;
  lostQty: number;
  recoveredQty: number;
}

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
  allocations: EventInventoryAllocation[],
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

  // -- Summary Stats (from database-backed allocations) --
  const itemStats = itemsFromAllocations(allocations);
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
  // Calculate Ref ID for Footer
  const refId = `${format(new Date(event.occasionDate), "ddMMyyyy")}-${event.mobile}`;

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
      doc.text("ANJUMAN-E-MOHAMMEDI", 14, pageHeight - 14);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("Inventory Documentation", 14, pageHeight - 10);

      // Right: Metadata
      doc.text(`Ref: ${refId}`, pageSize.width - 14, pageHeight - 14, {
        align: "right",
      });
      doc.text(
        `Digitally generated by Secunderabad Jamaat on ${format(new Date(), "PPP p")}`,
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

// New function: Transform database allocations to stats for PDF
function itemsFromAllocations(allocations: EventInventoryAllocation[]) {
  return allocations
    .map((alloc) => {
      const effectiveReturned = alloc.returnedQty + alloc.recoveredQty;
      const effectiveLost = Math.max(0, alloc.lostQty - alloc.recoveredQty);
      const deficit = alloc.issuedQty - effectiveReturned - effectiveLost;
      return {
        name: alloc.itemName,
        issued: alloc.issuedQty,
        returned: effectiveReturned,
        lost: effectiveLost,
        deficit: Math.max(0, deficit),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const generateMiqaatBookingForm = async (
  event: Event,
  hijriDate?: string | null,
  hijriDateAr?: string | null,
  pdfData?: {
    items: { label: string; quantity: string; rate: string; total: string }[];
    grandTotal: string;
    deposit?: string;
    paymentMode?: string;
    transactionId?: string;
  },
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
  // Start content below header
  let currentY = headerHeight + 10; // Relaxed top gap

  // -- Section 1: Booker & Event --
  // 2 Columns
  const col1X = margin;
  const col2X = pageWidth / 2 + 5;

  // Darker Colors for Print
  const LABEL_COLOR = [70, 70, 70]; // Dark Gray
  const VALUE_COLOR = [0, 0, 0]; // Black

  // Column 1: Booker
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8); // Reduced size
  doc.setTextColor(LABEL_COLOR[0], LABEL_COLOR[1], LABEL_COLOR[2]);
  doc.text("BOOKER", col1X, currentY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(VALUE_COLOR[0], VALUE_COLOR[1], VALUE_COLOR[2]);
  doc.text(event.name, col1X, currentY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(event.mobile, col1X, currentY + 9);
  if (event.email) doc.text(event.email, col1X, currentY + 13);

  // Column 2: Occasion
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(LABEL_COLOR[0], LABEL_COLOR[1], LABEL_COLOR[2]);
  doc.text("OCCASION", col2X, currentY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(VALUE_COLOR[0], VALUE_COLOR[1], VALUE_COLOR[2]);
  doc.text(event.description, col2X, currentY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `${format(new Date(event.occasionDate), "PPP")}   ${format12Hour(event.occasionTime)}`,
    col2X,
    currentY + 9,
  );

  if (hijriDate) {
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50); // Darker
    doc.text(`Hijri: ${hijriDate}`, col2X, currentY + 13);

    // Arabic Date
    if (hijriDateAr) {
      doc.setFont("KanzMarjaan", "normal");
      doc.setFontSize(12);
      doc.text(hijriDateAr, col2X, currentY + 18);
      doc.setFont("helvetica", "normal");
    }
  }

  currentY += 25; // Moderate gap

  // -- Section 2: Venue & Catering Box --
  const boxWidth = pageWidth - margin * 2;
  const hallColWidth = boxWidth / 2 - 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);

  // Robust Hall Extraction
  let halls = "Not Selected";
  const rawHall = event.hall;

  if (Array.isArray(rawHall)) {
    const validHalls = rawHall.filter((h) => h);
    if (validHalls.length > 0) halls = validHalls.join(", ");
  } else if (typeof rawHall === "string" && rawHall.trim().length > 0) {
    halls = rawHall;
  } else if (rawHall) {
    halls = String(rawHall);
  }

  const splitHalls = doc.splitTextToSize(halls, hallColWidth);
  const hallTextHeight = splitHalls.length * 4;

  const boxHeight = Math.max(18, 12 + hallTextHeight);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(200, 200, 200);
  doc.roundedRect(margin, currentY, boxWidth, boxHeight, 1, 1, "FD");

  const boxInnerY = currentY + 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(LABEL_COLOR[0], LABEL_COLOR[1], LABEL_COLOR[2]);
  doc.text("VENUE & CATERING", margin + 4, boxInnerY);

  const hallLabelY = boxInnerY + 5;
  const hallValueY = boxInnerY + 9;

  // Halls
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(LABEL_COLOR[0], LABEL_COLOR[1], LABEL_COLOR[2]);
  doc.text("HALL(S)", margin + 4, hallLabelY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(VALUE_COLOR[0], VALUE_COLOR[1], VALUE_COLOR[2]);
  doc.text(splitHalls, margin + 4, hallValueY);

  // Caterer
  const catX = pageWidth / 2 + 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(LABEL_COLOR[0], LABEL_COLOR[1], LABEL_COLOR[2]);
  doc.text("CATERER", catX, hallLabelY);

  doc.setFontSize(9);
  doc.setTextColor(VALUE_COLOR[0], VALUE_COLOR[1], VALUE_COLOR[2]);
  let catText = event.catererName || "Not Specified";
  if (event.catererPhone) catText += ` (${event.catererPhone})`;
  const splitCaterer = doc.splitTextToSize(catText, hallColWidth);
  doc.text(splitCaterer, catX, hallValueY);

  currentY += boxHeight + 8;

  // -- Section 3: Requirements --
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9); // Size 9
  doc.setTextColor(LABEL_COLOR[0], LABEL_COLOR[1], LABEL_COLOR[2]);
  doc.text("REQUIREMENTS", margin, currentY);
  currentY += 6;

  const reqY = currentY;
  const colWidth = (pageWidth - margin * 2) / 2 - 10;
  const rowHeight = 7; // Relaxed from 5

  const drawReqRow = (label: string, val: any, x: number, y: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9); // Size 9
    doc.setTextColor(60, 60, 60);
    doc.text(label, x, y);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(String(val), x + colWidth - 5, y, { align: "right" });

    // Dotted line
    doc.setDrawColor(200, 200, 200);
    (doc as any).setLineDash([1, 1], 0);
    doc.line(x, y + 1, x + colWidth, y + 1);
    (doc as any).setLineDash([], 0);
  };

  drawReqRow("Thaal Count", event.thaalCount, margin, reqY);
  drawReqRow("Sarkari Sets", event.sarkariThaalSet, col2X, reqY);

  drawReqRow(
    "Tables & Chairs",
    event.tablesAndChairs,
    margin,
    reqY + rowHeight,
  );
  drawReqRow(
    "Extra Chilamchi",
    event.extraChilamchiLota,
    col2X,
    reqY + rowHeight,
  );

  drawReqRow(
    "AC Start Time",
    format12Hour(event.acStartTime) || "NA",
    margin,
    reqY + rowHeight * 2,
  );
  drawReqRow(
    "Party Time",
    format12Hour(event.partyTime) || "NA",
    col2X,
    reqY + rowHeight * 2,
  );

  drawReqRow("Gas Count", event.gasCount || 0, margin, reqY + rowHeight * 3);

  currentY += rowHeight * 4 + 4;

  // -- Additional Items (Inline / Compact) --
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
    let itemX = col2X; // Start from 2nd col space if gas count uses col1, or duplicate line?
    // Let's use a new line but very compact

    // Check if we can fit on the same line as "Gas Count"?
    // Gas count is at [rowHeight * 3], col1. Col2 is empty there.
    // Let's put items in Col2 of the last row first?
    // Too risky for overlapping. Let's do a compact single line below.

    let lineY = currentY + 2;
    let currentX = margin;

    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0); // Black

    items.forEach((item) => {
      const itemWidth = doc.getTextWidth(item.l) + 8;

      // Simple Checkbox Icon [x]
      doc.setDrawColor(0, 0, 0);
      doc.rect(currentX, lineY - 2.5, 3, 3);
      // Tick
      doc.line(currentX + 0.5, lineY - 1, currentX + 1.5, lineY);
      doc.line(currentX + 1.5, lineY, currentX + 2.5, lineY - 2);

      doc.text(item.l, currentX + 4, lineY);
      currentX += itemWidth;
    });
    currentY += 6;
  } else {
    doc.text("No additional items.", margin, currentY + 3);
    currentY += 8;
  }

  // -- Section 4: Menu --
  currentY += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9); // Size 9
  doc.setTextColor(LABEL_COLOR[0], LABEL_COLOR[1], LABEL_COLOR[2]);
  doc.text("MENU", margin, currentY);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, currentY + 3, pageWidth - margin * 2, 10, 1, 1, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9); // Size 9
  doc.setTextColor(0, 0, 0);
  const menuText = doc.splitTextToSize(
    event.menu || "No menu specified.",
    pageWidth - margin * 2 - 4,
  );
  doc.text(menuText, margin + 4, currentY + 8);

  currentY += 20;

  // -- Section 5: Lagat Table & Deposit --
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(LABEL_COLOR[0], LABEL_COLOR[1], LABEL_COLOR[2]);
  doc.text("LAGAT DETAILS", margin, currentY);

  let finalY = currentY;

  if (pdfData && pdfData.items.length > 0) {
    // Split items
    const generalLabels = [
      "Thaal Amount",
      "Sarkari Amount",
      "Kitchen Charge",
      "Decoration",
      "Other Misc",
    ];
    const generalItems = pdfData.items.filter((i) =>
      generalLabels.includes(i.label),
    );
    const hallItems = pdfData.items.filter(
      (i) => !generalLabels.includes(i.label),
    );

    // Table 1: General Items (Left)
    const genRows = generalItems.map((i) => [
      i.label,
      i.quantity,
      i.rate,
      i.total,
    ]);
    // If no general items, add a placeholder or skip? Better to consistency.

    const leftTableWidth_Percentage = 0.55;
    // Available width for tables = PageWidth - Margin*2 - DepositBoxWidth - Gaps
    const depositBoxSpace = 40;
    const availableWidth = pageWidth - margin * 2 - depositBoxSpace;
    const leftWidth = availableWidth * 0.55;
    const rightWidth = availableWidth * 0.43; // Gap is leftover

    autoTable(doc, {
      startY: currentY + 2,
      head: [["General Item", "Qty", "Rate", "Amount"]],
      body: genRows,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2,
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
        textColor: [51, 65, 85],
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: "auto" },
        1: { cellWidth: 10, halign: "center" },
        2: { cellWidth: 18, halign: "center" },
        3: { fontStyle: "bold", cellWidth: 20, halign: "right" },
      },
      margin: { right: pageWidth - margin - leftWidth },
    });

    const leftFinalY = (doc as any).lastAutoTable?.finalY;

    // Table 2: Hall Items (Right) - Simplified Columns
    const hallRows = hallItems.map((i) => [i.label, i.total]);

    if (hallRows.length > 0) {
      autoTable(doc, {
        startY: currentY + 2,
        head: [["Hall Charges", "Amount"]],
        body: hallRows,
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 2,
          lineColor: [226, 232, 240],
          lineWidth: 0.1,
          textColor: [51, 65, 85],
        },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: "auto" },
          1: { fontStyle: "bold", cellWidth: 20, halign: "right" },
        },
        margin: {
          left: margin + leftWidth + 5,
          right: margin + depositBoxSpace,
        },
      });
    }

    const rightFinalY = (doc as any).lastAutoTable?.finalY || currentY;
    finalY = Math.max(leftFinalY, rightFinalY);

    // Grand Total Row (Full Width spanning tables space)
    doc.setFillColor(241, 245, 249); // Slate-100 header style
    doc.rect(margin, finalY, availableWidth, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(
      "TOTAL ESTIMATE (Excl. Deposit)",
      margin + availableWidth - 30,
      finalY + 5,
      {
        align: "right",
      },
    );
    doc.text(pdfData.grandTotal, margin + availableWidth - 2, finalY + 5, {
      align: "right",
    });
    // Payment Details Box (Below Grand Total)
    if (pdfData.paymentMode) {
      const paymentY = finalY + 12;
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(70, 70, 70);
      doc.text("Payment Details:", margin, paymentY);

      doc.setFont("helvetica", "normal");
      let paymentText = `Mode: ${pdfData.paymentMode}`;
      if (pdfData.transactionId)
        paymentText += ` | Tx Ref: ${pdfData.transactionId}`;

      doc.setTextColor(30, 41, 59);
      doc.text(paymentText, margin + 25, paymentY);
    }
  } else {
    // Fallback normal table if no items
    const lagatLabels = [
      { label: "Rs. Per Thaal", value: "" },
      { label: "Rs. Sarkari", value: "" },
      { label: "Rs. Kitchen", value: "" },
      { label: "Decoration", value: (event as any).decorations ? "Yes" : "No" },
      { label: "Other", value: "" },
    ];
    const bodyRows = lagatLabels.map((l) => [l.label, "", "", l.value]);
    bodyRows.push(["TOTAL", "", "", "-"]);

    autoTable(doc, {
      startY: currentY + 2,
      head: [["Item", "Qty", "Rate", "Amount"]],
      body: bodyRows,
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 3,
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
        textColor: [51, 65, 85],
      },
      margin: { right: 45 },
    });
    finalY = (doc as any).lastAutoTable?.finalY;
  }

  // -- Deposit Box (Manual Draw) --
  // Drawn to the right
  const boxWidthForDep = 35;
  const boxX = pageWidth - 42;
  const boxY = currentY + 2;
  const tableHeight = finalY - boxY;
  const boxH = Math.max(tableHeight, 30);

  doc.setDrawColor(30, 41, 59); // Slate-800
  doc.setLineWidth(0.5);
  doc.rect(boxX, boxY, boxWidthForDep, boxH); // Outer Border

  // Inner Content
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.text("REFUNDABLE", boxX + boxWidthForDep / 2, boxY + boxH / 2 - 4, {
    align: "center",
  });
  doc.text("DEPOSIT", boxX + boxWidthForDep / 2, boxY + boxH / 2, {
    align: "center",
  });

  if (pdfData?.deposit) {
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(pdfData.deposit, boxX + boxWidthForDep / 2, boxY + boxH / 2 + 6, {
      align: "center",
    });
  }

  // -- Footer / Signatures --
  const signY = pageHeight - 35; // Fixed position at bottom

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, signY, margin + 60, signY);
  doc.line(pageWidth - margin - 60, signY, pageWidth - margin, signY);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("BOOKER SIGNATURE", margin, signY + 5);
  doc.text("OFFICE SIGNATURE", pageWidth - margin - 60, signY + 5);

  // -- Standard Footer (Manifest Style) --
  // -- Standard Footer (Manifest Style) --
  const refId = `${format(new Date(event.occasionDate), "ddMMyyyy")}-${event.mobile}`;

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
    doc.text("ANJUMAN-E-MOHAMMEDI", 14, pageHeight - 14);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Miqaat Documentation", 14, pageHeight - 10);

    // Right
    doc.text(`Ref: ${refId}`, pageWidth - 14, pageHeight - 14, {
      align: "right",
    });
    doc.text(
      `Digitally generated by Secunderabad Jamaat on ${format(new Date(), "PPP p")}`,
      pageWidth - 14,
      pageHeight - 10,
      { align: "right" },
    );

    // Center Page Num
    doc.text(`Page ${i}`, pageWidth / 2, pageHeight - 5, { align: "center" });
  }

  // Open in new tab instead of auto-downloading
  try {
    const pdfBlob = doc.output("blob");
    const blobUrl = URL.createObjectURL(pdfBlob);
    window.open(blobUrl, "_blank");
  } catch (e) {
    console.error("Failed to open PDF tab", e);
    // Fallback?
    // doc.save(fileName);
  }
};

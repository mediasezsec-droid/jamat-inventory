import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { Event, InventoryLog } from "@/types";

export const generateEventManifest = (event: Event, logs: InventoryLog[]) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // -- Colors --
  const PRIMARY_COLOR = [22, 163, 74]; // Emerald-600
  const TEXT_COLOR = [30, 41, 59]; // Slate-800
  const SECONDARY_TEXT_COLOR = [100, 116, 139]; // Slate-500

  // -- Header --
  doc.setFontSize(24);
  doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
  doc.setFont("helvetica", "bold");
  doc.text("INVENTORY MANIFEST", 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(
    SECONDARY_TEXT_COLOR[0],
    SECONDARY_TEXT_COLOR[1],
    SECONDARY_TEXT_COLOR[2],
  );
  doc.setFont("helvetica", "normal");
  doc.text("Official Inventory Control Document", 14, 26);

  // Right Header
  doc.setFontSize(10);
  doc.text(`Generated: ${format(new Date(), "PP p")}`, pageWidth - 14, 20, {
    align: "right",
  });
  doc.text(`Ref: ${event.id.slice(0, 8).toUpperCase()}`, pageWidth - 14, 26, {
    align: "right",
  });

  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.line(14, 32, pageWidth - 14, 32);

  // -- Event Details Section --
  doc.setFontSize(12);
  doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
  doc.setFont("helvetica", "bold");
  doc.text(event.name, 14, 42);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);

  const leftColX = 14;
  const rightColX = pageWidth / 2 + 10;
  let yPos = 50;

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
      // Color the Variance column
      if (data.section === "body" && data.column.index === 3) {
        const text = data.cell.raw as string;
        if (text === "Settled") {
          data.cell.styles.textColor = [22, 163, 74]; // Green
        } else if (text === "Loss Recorded") {
          data.cell.styles.textColor = [185, 28, 28]; // Red
        } else if (text.startsWith("Pending")) {
          data.cell.styles.textColor = [220, 38, 38]; // Red
        } else {
          // Surplus
          data.cell.styles.textColor = [37, 99, 235]; // Blue
        }
      }
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
    });

    currentY = (doc as any).lastAutoTable?.finalY || currentY + 20;
  }

  // -- Signatures --
  const signatureY = currentY + 40;

  if (signatureY < doc.internal.pageSize.height - 40) {
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

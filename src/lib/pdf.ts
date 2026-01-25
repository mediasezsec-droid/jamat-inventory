import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

export async function generatePdf(html: string): Promise<Buffer> {
  let browser;
  try {
    const isLocal =
      process.env.NODE_ENV === "development" ||
      process.env.VERCEL_ENV === undefined;

    if (isLocal) {
      // Local development: Use full puppeteer
      const puppeteerLocal = await import("puppeteer");
      browser = await puppeteerLocal.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    } else {
      // Production (Vercel): Use @sparticuz/chromium-min
      browser = await puppeteer.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(
          "https://github.com/Sparticuz/chromium/releases/download/v119.0.2/chromium-v119.0.2-pack.tar",
        ),
        headless: true,
      });
    }

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({ format: "A4", printBackground: true });

    await browser.close();
    return Buffer.from(pdf);
  } catch (error) {
    console.error("PDF Generation Error:", error);
    if (browser) await browser.close();
    throw error;
  }
}

export const eventPdfTemplate = (event: any) => {
  // Reusing the print page layout styles inline for the PDF
  // Note: External stylesheets might not load in time, so inline styles are safer.
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: sans-serif; padding: 40px; color: #000; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; text-transform: uppercase; }
            .subtitle { font-size: 14px; color: #555; margin-top: 5px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 12px; }
            .row { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 5px; }
            .label { font-weight: bold; color: #666; text-transform: uppercase; font-size: 10px; }
            .value { font-weight: 600; font-size: 14px; }
            .section-title { font-size: 14px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 5px; margin: 20px 0 10px 0; text-transform: uppercase; }
            .requirements { display: flex; justify-content: space-between; gap: 10px; }
            .req-box { border: 1px solid #ccc; padding: 10px; text-align: center; flex: 1; border-radius: 4px; }
            .checkboxes { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; margin-top: 15px; font-size: 10px; }
            .checkbox-item { display: flex; align-items: center; gap: 5px; }
            .box { width: 12px; height: 12px; border: 1px solid #333; display: flex; align-items: center; justify-content: center; font-size: 10px; }
            .checked { background: #000; color: #fff; }
            .menu { background: #f9f9f9; border: 1px solid #eee; padding: 10px; min-height: 80px; white-space: pre-wrap; font-size: 12px; }
            .footer { margin-top: 40px; display: flex; justify-content: space-between; padding-top: 20px; border-top: 2px solid #000; }
            .sig-line { width: 150px; border-bottom: 1px solid #999; margin-bottom: 5px; }
            .sig-label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #666; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="title" style="font-family: serif;">Anjuman E Mohammedi, Secunderabad</div>
            <div style="margin-top: 10px;">
                <span class="subtitle" style="border: 2px solid #000; padding: 5px 15px; font-weight: bold; letter-spacing: 2px;">MIQAAT FORM</span>
            </div>
        </div>

        <div class="grid">
            <div class="row">
                <div>
                    <div class="label">Booker Name</div>
                    <div class="value">${event.name}</div>
                </div>
                <div style="text-align: right;">
                    <div class="label">Mobile</div>
                    <div class="value">${event.mobile}</div>
                    ${event.email ? `<div class="value" style="font-size: 10px; margin-top: 2px;">${event.email}</div>` : ""}
                </div>
            </div>
        </div>

        <div class="grid" style="margin-top: 10px;">
            <div>
                <div class="label">Occasion</div>
                <div class="value">${event.description}</div>
            </div>
            <div style="text-align: right;">
                <div class="label">Date & Time</div>
                <div class="value">${new Date(event.occasionDate).toDateString()} - ${event.occasionTime}</div>
            </div>
        </div>

        <div class="section-title">ADD-ONS & TIMINGS</div>
        <div class="requirements">
            <div class="req-box">
                <div class="label">AC Start</div>
                <div class="value">${event.acStartTime || "-"}</div>
            </div>
            <div class="req-box">
                <div class="label">Party Time</div>
                <div class="value">${event.partyTime || "-"}</div>
            </div>
            <div class="req-box">
                <div class="label">Gas Count</div>
                <div class="value">${event.gasCount}</div>
            </div>
            <div class="req-box">
                <div class="label">Decorations</div>
                <div class="value">${event.decorations ? "Yes" : "No"}</div>
            </div>
        </div>

        <div class="grid" style="margin-top: 10px;">
            <div>
                <div class="label">Hall</div>
                <div class="value">${
                  Array.isArray(event.hall) ? event.hall.join(", ") : event.hall
                }</div>
            </div>
            <div style="text-align: right;">
                <div class="label">Caterer</div>
                <div class="value">${event.catererName} (${
                  event.catererPhone
                })</div>
            </div>
        </div>

        <div class="section-title">Requirements</div>
        <div class="requirements">
            <div class="req-box">
                <div class="label">Thaal Count</div>
                <div class="value">${event.thaalCount}</div>
            </div>
            <div class="req-box">
                <div class="label">Sarkari Sets</div>
                <div class="value">${event.sarkariThaalSet}</div>
            </div>
            <div class="req-box">
                <div class="label">Extra Chilamchi</div>
                <div class="value">${event.extraChilamchiLota}</div>
            </div>
            <div class="req-box">
                <div class="label">Tables/Chairs</div>
                <div class="value">${event.tablesAndChairs}</div>
            </div>
        </div>

        <div class="checkboxes">
            <div class="checkbox-item">
                <div class="box ${event.bhaiSaabIzzan ? "checked" : ""}">${
                  event.bhaiSaabIzzan ? "✓" : ""
                }</div>
                <span>Bhai Saab Izzan</span>
            </div>
            <div class="checkbox-item">
                <div class="box ${event.benSaabIzzan ? "checked" : ""}">${
                  event.benSaabIzzan ? "✓" : ""
                }</div>
                <span>Ben Saab Izzan</span>
            </div>
            <div class="checkbox-item">
                <div class="box ${event.mic ? "checked" : ""}">${
                  event.mic ? "✓" : ""
                }</div>
                <span>Microphone</span>
            </div>
            <div class="checkbox-item">
                <div class="box ${event.crockeryRequired ? "checked" : ""}">${
                  event.crockeryRequired ? "✓" : ""
                }</div>
                <span>Crockery</span>
            </div>
            <div class="checkbox-item">
                <div class="box ${event.thaalForDevri ? "checked" : ""}">${
                  event.thaalForDevri ? "✓" : ""
                }</div>
                <span>Thaal for Devri</span>
            </div>
            <div class="checkbox-item">
                <div class="box ${event.paat ? "checked" : ""}">${
                  event.paat ? "✓" : ""
                }</div>
                <span>PAAT</span>
            </div>
            <div class="checkbox-item">
                <div class="box ${event.masjidLight ? "checked" : ""}">${
                  event.masjidLight ? "✓" : ""
                }</div>
                <span>Masjid Light</span>
            </div>
        </div>

        <div class="section-title">Menu</div>
        <div class="menu">
            ${event.menu || "No menu specified."}
        </div>

        <div class="section-title" style="margin-top: 30px;">LAGAT - DETAILS</div>
        <div style="display: flex; gap: 20px;">
            <table style="border-collapse: collapse; flex: 2; font-size: 11px;">
                <tr>
                    <td style="border: 1px solid #333; padding: 6px 10px; width: 100px;">₹ Per Thaal</td>
                    <td style="border: 1px solid #333; padding: 6px 10px; width: 50px; text-align: center;">${event.thaalCount > 0 ? event.thaalCount : ""}</td>
                    <td style="border: 1px solid #333; padding: 6px 10px; width: 80px;"></td>
                    
                    ${/* Dynamic Hall 1 */ ""}
                    <td style="border: 1px solid #333; padding: 6px 10px; width: 100px;">
                        ${Array.isArray(event.hall) && event.hall[0] ? event.hall[0] : typeof event.hall === "string" ? event.hall : ""}
                    </td>
                    <td style="border: 1px solid #333; padding: 6px 10px; width: 80px;"></td>
                </tr>
                <tr>
                    <td style="border: 1px solid #333; padding: 6px 10px;">₹ Sarkari</td>
                    <td style="border: 1px solid #333; padding: 6px 10px; text-align: center;">${event.sarkariThaalSet > 0 ? event.sarkariThaalSet : ""}</td>
                    <td style="border: 1px solid #333; padding: 6px 10px;"></td>

                    ${/* Dynamic Hall 2 */ ""}
                     <td style="border: 1px solid #333; padding: 6px 10px; width: 100px;">
                        ${Array.isArray(event.hall) && event.hall[1] ? event.hall[1] : ""}
                    </td>
                    <td style="border: 1px solid #333; padding: 6px 10px;"></td>
                </tr>
                
                ${
                  /* Loop for remaining halls if any, or just show rows. 
                   Actually, let's just show rows for the halls we have. 
                   If we have more than 2 halls, we need more rows.
                   Use a cleaner approach: Create rows for Halls and fill the left side with standard items.
                */ ""
                }

                ${(() => {
                  const halls = Array.isArray(event.hall)
                    ? event.hall
                    : [event.hall];
                  // Skip first 2 as they are handled above
                  const remainingHalls = halls.slice(2);

                  // Standard items for left side
                  const leftItems = [
                    {
                      label: "₹ GAS",
                      value: event.gasCount ? event.gasCount : "",
                    },
                    { label: "Kitchen :-", value: "" },
                    {
                      label: "Decoration :-",
                      value: event.decorations ? "Yes" : "No",
                    },
                    { label: "Others :-", value: "" },
                  ];

                  let rows = "";

                  // We need to iterate enough times to cover both lists
                  const maxRows = Math.max(
                    leftItems.length,
                    remainingHalls.length,
                  );

                  for (let i = 0; i < maxRows; i++) {
                    const left = leftItems[i] || { label: "", value: "" };
                    const hall = remainingHalls[i] || "";

                    rows += `
                         <tr>
                            <td style="border: 1px solid #333; padding: 6px 10px;">${left.label}</td>
                            <td style="border: 1px solid #333; padding: 6px 10px; text-align: center;">${left.value}</td>
                            <td style="border: 1px solid #333; padding: 6px 10px;"></td>
                            <td style="border: 1px solid #333; padding: 6px 10px;">${hall}</td>
                            <td style="border: 1px solid #333; padding: 6px 10px;"></td>
                         </tr>
                         `;
                  }
                  return rows;
                })()}

                <tr>
                    <td style="border: 1px solid #333; padding: 6px 10px;"></td>
                    <td style="border: 1px solid #333; padding: 6px 10px;"></td>
                    <td style="border: 1px solid #333; padding: 6px 10px;"></td>
                    <td style="border: 1px solid #333; padding: 6px 10px; font-weight: bold;">TOTAL ₹ :-</td>
                    <td style="border: 1px solid #333; padding: 6px 10px;"></td>
                </tr>
            </table>
            <div style="border: 2px solid #333; padding: 15px 20px; text-align: center; flex: 1; display: flex; flex-direction: column; justify-content: center;">
                <div style="font-weight: bold; font-size: 12px; margin-bottom: 10px;">RETURNABLE<br/>DEPOSIT :-</div>
                <div style="font-size: 16px; font-weight: bold; min-height: 30px;"></div>
            </div>
        </div>

        <div class="footer">
            <div style="text-align: center;">
                <div class="sig-line"></div>
                <div class="sig-label">Booker Signature</div>
            </div>
            <div style="text-align: center;">
                <div class="sig-line"></div>
                <div class="sig-label">Manager Signature</div>
            </div>
        </div>
    </body>
    </html>
    `;
};

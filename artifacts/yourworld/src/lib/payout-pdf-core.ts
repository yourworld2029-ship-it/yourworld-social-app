import { jsPDF } from "jspdf";
import { inr, type PayoutBreakdown } from "./payout-math";

export type StatementInfo = {
  statementId: string;
  date: string;
  creatorName: string;
  username: string;
  email: string;
  pan: string;
  billingPeriod?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  payoutReference?: string;
};

export type PayoutPdfOptions = {
  samplePreview?: boolean;
};

type Rgb = [number, number, number];

const NAVY: Rgb = [15, 28, 49];
const CHARCOAL: Rgb = [37, 45, 57];
const MUTED: Rgb = [94, 105, 120];
const BORDER: Rgb = [205, 213, 222];
const PALE: Rgb = [243, 246, 250];
const GREEN: Rgb = [21, 112, 65];
const SAMPLE: Rgb = [255, 243, 205];
const SAMPLE_INK: Rgb = [126, 75, 0];

function applyTextColor(doc: jsPDF, color: Rgb) {
  doc.setTextColor(...color);
}

function applyFillColor(doc: jsPDF, color: Rgb) {
  doc.setFillColor(...color);
}

function applyDrawColor(doc: jsPDF, color: Rgb) {
  doc.setDrawColor(...color);
}

function addAmount(
  doc: jsPDF,
  value: string,
  x: number,
  y: number,
  align: "left" | "right" = "left",
) {
  doc.setFont("DejaVuSans", "normal");
  doc.setFontSize(9.5);
  doc.text(value, x, y, { align });
  doc.setFont("helvetica", "normal");
}

function drawField(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  valueWidth: number,
  options: { bold?: boolean; rupee?: boolean } = {},
) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.6);
  applyTextColor(doc, MUTED);
  doc.text(label, x, y);

  if (options.rupee) {
    addAmount(doc, value, x + valueWidth, y + 1, "right");
  } else {
    doc.setFont("helvetica", options.bold ? "bold" : "normal");
    doc.setFontSize(8.8);
    applyTextColor(doc, CHARCOAL);
    doc.text(value || "—", x + valueWidth, y, { align: "right", maxWidth: valueWidth });
  }
}

function maskAccountNumber(accountNumber?: string) {
  const digits = String(accountNumber ?? "").replace(/\D/g, "");
  if (!digits) return "—";
  const lastFour = digits.slice(-4);
  return `${"•".repeat(Math.max(8, digits.length - lastFour.length))}${lastFour}`;
}

function drawRoundedPanel(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: Rgb = [255, 255, 255],
) {
  applyFillColor(doc, fill);
  applyDrawColor(doc, BORDER);
  doc.setLineWidth(0.65);
  doc.roundedRect(x, y, width, height, 8, 8, "FD");
}

/** Builds the "Payout Statement & Tax Invoice" using vector text and shapes. */
export function renderPayoutPdf(
  info: StatementInfo,
  breakdown: PayoutBreakdown,
  fontBase64: string,
  options: PayoutPdfOptions = {},
) {
  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true, precision: 2 });
  doc.addFileToVFS("DejaVuSans.ttf", fontBase64);
  doc.addFont("DejaVuSans.ttf", "DejaVuSans", "normal");
  doc.setProperties({
    title: "YourWorld Social Creator Payout Statement & Tax Invoice",
    subject: `Payout statement ${info.statementId}`,
    creator: "YourWorld Social",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 38;
  const contentWidth = pageWidth - margin * 2;
  const headerY = 28;
  const headerHeight = 88;
  const right = pageWidth - margin;

  applyFillColor(doc, NAVY);
  doc.roundedRect(margin, headerY, contentWidth, headerHeight, 10, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text("YourWorld Social Platform", margin + 18, headerY + 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(221, 228, 237);
  doc.text("Creator Payout Statement & Tax Invoice", margin + 18, headerY + 49);
  doc.setFontSize(8);
  doc.setTextColor(192, 203, 218);
  doc.text("YourWorld Creator Payouts · support: Yourworld2029@gmail.com", margin + 18, headerY + 67);

  const statusWidth = 190;
  const statusX = right - statusWidth - 16;
  applyFillColor(doc, GREEN);
  doc.roundedRect(statusX, headerY + 20, statusWidth, 25, 12, 12, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.6);
  doc.setTextColor(255, 255, 255);
  doc.text(info.paymentStatus ?? "PAID / TRANSFERRED", statusX + statusWidth / 2, headerY + 36, {
    align: "center",
  });

  if (options.samplePreview) {
    applyFillColor(doc, SAMPLE);
    doc.roundedRect(statusX, headerY + 54, statusWidth, 19, 8, 8, "F");
    doc.setFontSize(6.6);
    doc.setTextColor(...SAMPLE_INK);
    doc.text("SAMPLE PREVIEW · NOT A PAYMENT RECORD", statusX + statusWidth / 2, headerY + 66, {
      align: "center",
    });
  }

  const metadataY = 130;
  const metadataHeight = 78;
  drawRoundedPanel(doc, margin, metadataY, contentWidth, metadataHeight);
  const metadataColumns = [margin + 14, margin + contentWidth / 3 + 2, margin + (contentWidth * 2) / 3 - 8];
  const metadataLabels = ["Statement / Invoice No", "Issue Date", "Billing Period / Payout Cycle"];
  const metadataValues = [
    info.statementId,
    info.date,
    info.billingPeriod ?? "—",
  ];
  for (let index = 0; index < metadataColumns.length; index += 1) {
    const x = metadataColumns[index]!;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.7);
    applyTextColor(doc, MUTED);
    doc.text(metadataLabels[index]!, x, metadataY + 23);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(index === 2 ? 8.7 : 9.2);
    applyTextColor(doc, CHARCOAL);
    doc.text(metadataValues[index]!, x, metadataY + 43, {
      maxWidth: contentWidth / 3 - 20,
    });
  }

  const cardsY = 222;
  const cardGap = 12;
  const cardWidth = (contentWidth - cardGap) / 2;
  const cardHeight = 170;
  const leftX = margin;
  const rightX = margin + cardWidth + cardGap;
  drawRoundedPanel(doc, leftX, cardsY, cardWidth, cardHeight, [255, 255, 255]);
  drawRoundedPanel(doc, rightX, cardsY, cardWidth, cardHeight, [255, 255, 255]);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  applyTextColor(doc, NAVY);
  doc.text("Creator Details", leftX + 14, cardsY + 23);
  doc.text("Payout Destination", rightX + 14, cardsY + 23);

  const fieldRows = [cardsY + 48, cardsY + 76, cardsY + 104, cardsY + 132];
  const labelWidth = cardWidth - 30;
  const leftFields: Array<[string, string, boolean?]> = [
    ["Creator Name", info.creatorName, false],
    ["Username", info.username, false],
    ["Registered Email", info.email, false],
    ["PAN Card Number", info.pan || "—", true],
  ];
  const rightFields: Array<[string, string, boolean?]> = [
    ["Payment Method", info.paymentMethod ?? "Direct Bank Transfer (IMPS/NEFT)", false],
    ["Bank Account", maskAccountNumber(info.bankAccountNumber), true],
    ["IFSC Code", info.ifscCode ?? "—", true],
    ["Payout Reference / Statement ID", info.payoutReference ?? info.statementId, true],
  ];

  for (let index = 0; index < fieldRows.length; index += 1) {
    const y = fieldRows[index]!;
    drawField(doc, leftFields[index]![0], leftFields[index]![1], leftX + 14, y, labelWidth, {
      bold: leftFields[index]![2],
    });
    drawField(doc, rightFields[index]![0], rightFields[index]![1], rightX + 14, y, labelWidth, {
      bold: rightFields[index]![2],
    });
  }

  const financialTitleY = 415;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  applyTextColor(doc, NAVY);
  doc.text("Financial Breakdown", margin, financialTitleY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  applyTextColor(doc, MUTED);
  doc.text("All amounts in INR", right, financialTitleY, { align: "right" });

  const tableX = margin;
  const tableY = 430;
  const tableWidth = contentWidth;
  const headerRowHeight = 25;
  const rowHeight = 27;
  applyFillColor(doc, CHARCOAL);
  doc.rect(tableX, tableY, tableWidth, headerRowHeight, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("DESCRIPTION", tableX + 12, tableY + 16);
  doc.text("AMOUNT", tableX + tableWidth - 12, tableY + 16, { align: "right" });

  const rows: Array<{ label: string; amount: number; bold?: boolean; net?: boolean }> = [
    { label: "Ad Revenue Share (Videos 90s+)", amount: breakdown.creatorBySource.ads },
    { label: "Course / Creator Content Sales", amount: breakdown.creatorBySource.course },
    { label: "VIP Subscriptions", amount: breakdown.creatorBySource.vip },
    { label: "Gross Platform Earnings", amount: breakdown.creatorShare, bold: true },
    { label: "TDS Deducted @ 1% (u/s 194-O Income Tax Act)", amount: -breakdown.tds },
    { label: "Total Net Payout Credited", amount: breakdown.net, bold: true, net: true },
  ];

  rows.forEach((row, index) => {
    const y = tableY + headerRowHeight + index * rowHeight;
    if (row.net) {
      applyFillColor(doc, [225, 241, 232]);
      doc.rect(tableX, y, tableWidth, rowHeight, "F");
    } else if (index % 2 === 1) {
      applyFillColor(doc, PALE);
      doc.rect(tableX, y, tableWidth, rowHeight, "F");
    }
    applyDrawColor(doc, BORDER);
    doc.setLineWidth(0.55);
    doc.line(tableX, y + rowHeight, tableX + tableWidth, y + rowHeight);
    doc.setFont("helvetica", row.bold ? "bold" : "normal");
    doc.setFontSize(8.8);
    applyTextColor(doc, row.net ? GREEN : CHARCOAL);
    doc.text(row.label, tableX + 12, y + 17);
    addAmount(doc, `${row.amount < 0 ? "−" : ""}${inr(Math.abs(row.amount))}`, tableX + tableWidth - 12, y + 18, "right");
  });

  const noteY = tableY + headerRowHeight + rows.length * rowHeight + 17;
  const noteText = `Tax Compliance Note: TDS of ${inr(breakdown.tds)} has been credited against PAN ${info.pan || "—"} under Section 194-O. Form 16A TDS Certificate will be issued quarterly as per Indian Income Tax guidelines.`;
  const noteLines = doc.splitTextToSize(noteText, contentWidth - 28);
  const noteHeight = Math.max(56, noteLines.length * 13 + 22);
  applyFillColor(doc, [239, 243, 248]);
  applyDrawColor(doc, BORDER);
  doc.setLineWidth(0.6);
  doc.roundedRect(margin, noteY, contentWidth, noteHeight, 7, 7, "FD");
  doc.setFont("DejaVuSans", "normal");
  doc.setFontSize(8.1);
  applyTextColor(doc, CHARCOAL);
  doc.text(noteLines, margin + 13, noteY + 18);

  const footerY = noteY + noteHeight + 23;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.9);
  applyTextColor(doc, CHARCOAL);
  doc.text(
    "This is an official system-verified financial document by YourWorld Social. No physical signature required.",
    margin,
    footerY,
    { maxWidth: contentWidth },
  );

  if (options.samplePreview) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    applyTextColor(doc, SAMPLE_INK);
    doc.text(
      "Sample preview only; figures are illustrative and do not confirm an actual transfer or tax deposit.",
      margin,
      footerY + 15,
      { maxWidth: contentWidth },
    );
  }

  return doc;
}

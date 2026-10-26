import { jsPDF } from "jspdf";
import dejavuSansUrl from "./assets/DejaVuSans.ttf?url";
import { renderPayoutPdf, type PayoutPdfOptions, type StatementInfo } from "./payout-pdf-core";
import type { PayoutBreakdown } from "./payout-math";

export type { PayoutPdfOptions, StatementInfo } from "./payout-pdf-core";

let fontBase64Promise: Promise<string> | undefined;

async function loadFontBase64() {
  fontBase64Promise ??= fetch(dejavuSansUrl).then(async (response) => {
    if (!response.ok) {
      throw new Error("The payout statement font could not be loaded.");
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = "";
    const chunkSize = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
    }
    return btoa(binary);
  });
  return fontBase64Promise;
}

/** Builds a sharp, vector-first A4 payout statement PDF in the browser. */
export async function buildPayoutPdf(
  info: StatementInfo,
  breakdown: PayoutBreakdown,
  options: PayoutPdfOptions = {},
) {
  return renderPayoutPdf(info, breakdown, await loadFontBase64(), options);
}

export async function payoutPdfBase64(
  info: StatementInfo,
  breakdown: PayoutBreakdown,
  options: PayoutPdfOptions = {},
) {
  const doc = await buildPayoutPdf(info, breakdown, options);
  const output = doc.output("datauristring");
  return output.slice(output.indexOf(",") + 1);
}

export async function downloadPayoutPdf(
  info: StatementInfo,
  breakdown: PayoutBreakdown,
  options: PayoutPdfOptions = {},
) {
  const doc = await buildPayoutPdf(info, breakdown, options);
  doc.save(`${info.statementId}-payout-statement.pdf`);
}

export { jsPDF };

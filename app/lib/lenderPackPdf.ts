import { PDFDocument, StandardFonts } from "pdf-lib";
import type { LenderPackData } from "./generateLenderPack";

const A4 = [595, 842] as const;

type PageState = {
  page: ReturnType<PDFDocument["addPage"]>;
  y: number;
};

export async function renderLenderPackPdf(data: LenderPackData): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  let state = createPage(doc);

  const drawText = (
    text: string,
    opts: { size?: number; bold?: boolean } = {}
  ) => {
    const size = opts.size ?? 10;
    const usedFont = opts.bold ? fontBold : font;
    state = ensureSpace(doc, state, size + 6);
    state.page.drawText(text, { x: 50, y: state.y, size, font: usedFont });
    state.y -= size + 4;
  };

  const drawParagraph = (
    text: string,
    opts: { size?: number; bold?: boolean } = {}
  ) => {
    const size = opts.size ?? 10;
    const usedFont = opts.bold ? fontBold : font;
    const lines = wrapText(text ?? "", usedFont, size, A4[0] - 100);
    for (const line of lines) {
      state = ensureSpace(doc, state, size + 6);
      state.page.drawText(line, { x: 50, y: state.y, size, font: usedFont });
      state.y -= size + 4;
    }
  };

  drawText("PlanSureAI – Lender-Ready Planning Pack", { size: 14, bold: true });
  drawText(`Generated: ${formatDate(data.generatedAt)}`, { size: 9 });
  drawText(`Site: ${data.site.site_name}`, { size: 11, bold: true });
  drawText(data.site.address);
  drawText(`LPA: ${data.site.local_planning_authority}`);
  if (data.site.postcode) drawText(`Postcode: ${data.site.postcode}`);

  drawText("Executive summary", { size: 12, bold: true });
  const firstSummary = data.planningDocuments[0]?.structuredSummary;
  if (firstSummary) {
    drawText(`Risk level: ${firstSummary.risk_level ?? "Unknown"}`, { bold: true });
    if (firstSummary.headline) drawParagraph(firstSummary.headline);
    if (firstSummary.key_issues && firstSummary.key_issues.length > 0) {
      drawText("Key issues", { bold: true });
      firstSummary.key_issues.slice(0, 6).forEach((issue) => {
        drawParagraph(`• ${issue}`);
      });
    }
    if (firstSummary.recommended_actions && firstSummary.recommended_actions.length > 0) {
      drawText("Recommended actions", { bold: true });
      firstSummary.recommended_actions.slice(0, 6).forEach((action) => {
        drawParagraph(`• ${action}`);
      });
    }
  } else {
    drawParagraph(
      `This site has ${data.planningDocuments.length} planning document(s) on record. See the planning narrative and timeline for detail.`
    );
  }

  state = startNewSection(doc, state, "Planning narrative", fontBold);
  data.planningDocuments.forEach((docItem, idx) => {
    drawText(`${idx + 1}. ${docItem.file_name}`, { bold: true });
    drawText(`Uploaded: ${formatDate(docItem.uploaded_at)}`, { size: 9 });
    if (docItem.structuredSummary?.timeline_notes) {
      drawParagraph(docItem.structuredSummary.timeline_notes, { size: 9 });
    }
    state.y -= 4;
  });

  state = startNewSection(doc, state, "Planning timeline (since 2015)", fontBold);
  drawText(`Total applications: ${data.siteTimeline.totalApps}`);
  drawText(`Approvals: ${data.siteTimeline.approvals}`);
  drawText(`Refusals: ${data.siteTimeline.refusals}`);
  drawText(
    `Median decision time: ${
      data.siteTimeline.medianWeeks != null
        ? `${data.siteTimeline.medianWeeks} weeks`
        : "N/A"
    }`
  );

  state = startNewSection(doc, state, "LPA evidence (since 2015)", fontBold);
  drawText(`LPA: ${data.lpaEvidence.lpaName}`);
  drawText(
    `Approval rate: ${data.lpaEvidence.approvalRate.toFixed(1)}% (n=${data.lpaEvidence.sampleSize})`
  );
  drawText(
    `Median decision time: ${
      data.lpaEvidence.medianWeeks != null
        ? `${data.lpaEvidence.medianWeeks} weeks`
        : "N/A"
    }`
  );
  drawText(
    "Approvals include split decisions and appeal allowed. Refusals include appeal dismissed.",
    { size: 8 }
  );

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}

function createPage(doc: PDFDocument): PageState {
  const page = doc.addPage(A4);
  return { page, y: A4[1] - 50 };
}

function ensureSpace(
  doc: PDFDocument,
  state: PageState,
  needed: number
): PageState {
  if (state.y - needed < 60) {
    return createPage(doc);
  }
  return state;
}

function startNewSection(
  doc: PDFDocument,
  state: PageState,
  title: string,
  fontBold: any
): PageState {
  state = ensureSpace(doc, state, 26);
  state.page.drawText(title, {
    x: 50,
    y: state.y,
    size: 12,
    font: fontBold,
  });
  state.y -= 18;
  return state;
}

function wrapText(text: string, font: any, size: number, maxWidth: number): string[] {
  if (!text) return [""];
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, size);
    if (width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString("en-GB");
  } catch {
    return value;
  }
}

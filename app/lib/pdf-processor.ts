import * as pdfParse from "pdf-parse";

export interface ExtractedPdfData {
  text: string;
  pageCount: number;
  metadata: Record<string, any>;
  wordCount: number;
}

export async function extractPdfText(
  buffer: Buffer
): Promise<ExtractedPdfData> {
  try {
    const data = await pdfParse(buffer);

    return {
      text: data.text,
      pageCount: data.numpages || 1,
      metadata: data.info || {},
      wordCount: data.text.split(/\s+/).length,
    };
  } catch (error) {
    throw new Error(`PDF extraction failed: ${String(error)}`);
  }
}

export function sanitizeText(text: string): string {
  return text
    .replace(/\x00/g, "")
    .replace(/[\r\n]{3,}/g, "\n\n")
    .trim();
}

export function extractPdfKeywords(text: string): string[] {
  const keywords = new Set<string>();

  const planningKeywords = [
    "residential",
    "commercial",
    "industrial",
    "mixed-use",
    "density",
    "massing",
    "conservation",
    "heritage",
    "flood",
    "contamination",
    "transport",
    "school",
    "parking",
    "affordable",
    "sustainability",
    "tree",
    "ecology",
    "drainage",
  ];

  const lowerText = text.toLowerCase();
  planningKeywords.forEach((keyword) => {
    if (lowerText.includes(keyword)) {
      keywords.add(keyword);
    }
  });

  return Array.from(keywords);
}

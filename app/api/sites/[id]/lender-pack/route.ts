import { NextRequest, NextResponse } from "next/server";
import { generateLenderPackData } from "@/app/lib/generateLenderPack";
import { renderLenderPackPdf } from "@/app/lib/lenderPackPdf";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const packData = await generateLenderPackData(id);

    if (!packData) {
      return NextResponse.json(
        { error: "Site not found or data unavailable" },
        { status: 404 }
      );
    }

    const pdfBuffer = await renderLenderPackPdf(packData);
    const filename = `lender-pack-${slugify(packData.site.site_name)}-${packData.generatedAt.slice(0, 10)}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Lender pack generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate lender pack" },
      { status: 500 }
    );
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 64);
}

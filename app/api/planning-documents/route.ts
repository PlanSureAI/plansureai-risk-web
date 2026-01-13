import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";
import type { PlanningDocumentSummary } from "@/app/types/planning";

export async function GET(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get("siteId");
  if (!siteId) {
    return NextResponse.json({ error: "siteId is required" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("planning_documents")
    .select("id, summary_json, created_at")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const documents = (data ?? []).map((row) => {
    const summary = row.summary_json as PlanningDocumentSummary;
    const title =
      summary?.meta?.documentTitle ??
      summary?.site?.name ??
      summary?.site?.address ??
      "Planning document";
    const routeLabel = summary?.proposal?.route?.[0] ?? null;
    return {
      id: row.id,
      title,
      routeLabel,
      createdAt: row.created_at,
    };
  });

  return NextResponse.json({ documents });
}

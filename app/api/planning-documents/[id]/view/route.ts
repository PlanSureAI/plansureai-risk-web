import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";
import type {
  PlanningDocumentAnalysis,
  PlanningDocumentSummary,
} from "@/app/types/planning";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const viewType = req.nextUrl.searchParams.get("viewType") ?? "summary";
  const siteId = req.nextUrl.searchParams.get("siteId");
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("planning_documents")
    .select("summary_json, site_id")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (siteId && data.site_id && siteId !== data.site_id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const summary = data.summary_json as PlanningDocumentSummary;

  switch (viewType) {
    case "summary":
      return NextResponse.json(buildSummaryView(summary));
    case "process":
      return NextResponse.json(buildProcessView(summary));
    case "fees":
      return NextResponse.json(buildFeesView(summary));
    case "analysis": {
      const analysis = await buildAnalysisView(supabase, id);
      if (!analysis) {
        return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
      }
      return NextResponse.json(analysis);
    }
    default:
      return NextResponse.json({ error: "Unknown viewType" }, { status: 400 });
  }
}

function buildSummaryView(summary: PlanningDocumentSummary) {
  const { site, proposal } = summary;
  return {
    title: site.name ?? site.address ?? "Planning document",
    bullets: [
      site.address && `Site: ${site.address}`,
      proposal.description && `Proposal: ${proposal.description}`,
      proposal.dwellingsMin != null &&
        proposal.dwellingsMax != null &&
        `Dwellings: ${proposal.dwellingsMin}–${proposal.dwellingsMax}`,
      site.localAuthority && `Local authority: ${site.localAuthority}`,
    ].filter(Boolean),
  };
}

function buildProcessView(summary: PlanningDocumentSummary) {
  return {
    stage: summary.process.stage,
    steps: summary.process.steps,
  };
}

function buildFeesView(summary: PlanningDocumentSummary) {
  return {
    planningAuthorityFee: summary.fees.planningAuthorityFee,
    agentFee: summary.fees.agentFee,
  };
}

async function buildAnalysisView(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  id: string
): Promise<PlanningDocumentAnalysis | null> {
  const { data, error } = await supabase
    .from("planning_document_analyses")
    .select("analysis_json")
    .eq("planning_document_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.analysis_json as PlanningDocumentAnalysis;
}

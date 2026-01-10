import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";
import type { PlanningDocumentSummary } from "@/app/types/planning";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const viewType = req.nextUrl.searchParams.get("viewType") ?? "summary";
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("planning_documents")
    .select("summary_json")
    .eq("id", params.id)
    .single();

  if (error || !data) {
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

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";
import type { PlanningDocumentSummary } from "@/app/types/planning";

type CompareDocument = {
  documentId: string;
  title: string | null;
  routeLabel: string | null;
  siteAddress: string | null;
  proposalSummary: string | null;
  phaseOneFeeSummary: string | null;
};

type ComparisonRow = {
  label: string;
  values: (string | null)[];
};

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const siteId = searchParams.get("siteId");
  const idsParam = searchParams.get("documentIds");

  if (!siteId && !idsParam) {
    return NextResponse.json(
      { error: "siteId or documentIds is required" },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const query = supabase
    .from("planning_documents")
    .select("id, site_id, summary_json, created_at")
    .order("created_at", { ascending: false });

  if (siteId) {
    query.eq("site_id", siteId);
  }

  if (idsParam) {
    const ids = idsParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    if (ids.length === 0) {
      return NextResponse.json(
        { error: "documentIds is empty" },
        { status: 400 }
      );
    }
    query.in("id", ids);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const summaries = (data ?? []).map((row) => ({
    id: row.id,
    summary: row.summary_json as PlanningDocumentSummary,
  }));

  if (summaries.length === 0) {
    return NextResponse.json({ error: "No documents found" }, { status: 404 });
  }

  const documents: CompareDocument[] = summaries.map(({ id, summary }) => {
    const routeLabel = summary.proposal.route?.[0] ?? null;
    const dwellings =
      summary.proposal.dwellingsMin != null && summary.proposal.dwellingsMax != null
        ? `${summary.proposal.dwellingsMin}–${summary.proposal.dwellingsMax} dwellings`
        : null;
    const proposalSummary = [
      summary.proposal.description,
      dwellings,
      summary.site.localAuthority
        ? `Local authority: ${summary.site.localAuthority}`
        : null,
    ]
      .filter(Boolean)
      .join(" · ");

    const councilFee = summary.fees.planningAuthorityFee.amount;
    const agentFee = summary.fees.agentFee.amount;
    const phaseOneFeeSummary = [
      councilFee != null
        ? `Council: £${councilFee.toLocaleString()}`
        : null,
      agentFee != null
        ? `Agent: £${agentFee.toLocaleString()}${
            summary.fees.agentFee.vatExcluded ? " + VAT" : ""
          }`
        : null,
    ]
      .filter(Boolean)
      .join(" · ");

    return {
      documentId: id,
      title: summary.meta.documentTitle ?? summary.site.name ?? "Planning document",
      routeLabel,
      siteAddress: summary.site.address ?? null,
      proposalSummary: proposalSummary || null,
      phaseOneFeeSummary: phaseOneFeeSummary || null,
    };
  });

  const rows: ComparisonRow[] = buildComparisonRows(summaries);

  return NextResponse.json({ documents, comparison_rows: rows });
}

function buildComparisonRows(
  summaries: { id: string; summary: PlanningDocumentSummary }[]
): ComparisonRow[] {
  const values = (fn: (summary: PlanningDocumentSummary) => string | null) =>
    summaries.map(({ summary }) => fn(summary));

  return [
    {
      label: "Route type",
      values: values((summary) => summary.proposal.route?.[0] ?? null),
    },
    {
      label: "Dwellings",
      values: values((summary) => {
        if (
          summary.proposal.dwellingsMin != null &&
          summary.proposal.dwellingsMax != null
        ) {
          return `${summary.proposal.dwellingsMin}–${summary.proposal.dwellingsMax}`;
        }
        return null;
      }),
    },
    {
      label: "Phase 1 council fee",
      values: values((summary) =>
        summary.fees.planningAuthorityFee.amount != null
          ? `£${summary.fees.planningAuthorityFee.amount.toLocaleString()}`
          : null
      ),
    },
    {
      label: "Phase 1 agent fee",
      values: values((summary) =>
        summary.fees.agentFee.amount != null
          ? `£${summary.fees.agentFee.amount.toLocaleString()}${
              summary.fees.agentFee.vatExcluded ? " + VAT" : ""
            }`
          : null
      ),
    },
    {
      label: "Key outputs",
      values: values((summary) =>
        summary.process.steps.length > 0
          ? summary.process.steps.slice(0, 3).join(", ")
          : null
      ),
    },
  ];
}

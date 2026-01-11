import { createSupabaseServerClient } from "@/app/lib/supabaseServer";
import type { PlanningStructuredSummary } from "@/app/types/planning";

export interface LenderPackData {
  site: {
    id: string;
    site_name: string;
    address: string;
    postcode: string | null;
    local_planning_authority: string;
  };
  planningDocuments: Array<{
    id: string;
    file_name: string;
    uploaded_at: string;
    structuredSummary: PlanningStructuredSummary | null;
  }>;
  siteTimeline: {
    totalApps: number;
    approvals: number;
    refusals: number;
    medianWeeks: number | null;
  };
  lpaEvidence: {
    lpaName: string;
    approvalRate: number;
    medianWeeks: number | null;
    sampleSize: number;
  };
  generatedAt: string;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function deriveLpaCode(lpaName?: string | null): string | null {
  if (!lpaName) return null;
  const stopwords = new Set([
    "COUNCIL",
    "CITY",
    "METROPOLITAN",
    "BOROUGH",
    "DISTRICT",
    "COUNTY",
    "OF",
    "THE",
    "LONDON",
    "ROYAL",
  ]);
  const tokens = lpaName
    .toUpperCase()
    .replace(/[^A-Z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !stopwords.has(token));
  return tokens[0] ?? null;
}

export async function generateLenderPackData(
  siteId: string
): Promise<LenderPackData | null> {
  const supabase = await createSupabaseServerClient();

  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("id, site_name, address, postcode, local_planning_authority")
    .eq("id", siteId)
    .single();

  if (siteError || !site) {
    console.error("Site fetch error:", siteError);
    return null;
  }

  const { data: documents, error: docsError } = await supabase
    .from("planning_documents")
    .select("id, file_name, created_at")
    .eq("site_id", siteId)
    .order("created_at", { ascending: true });

  if (docsError) {
    console.error("Planning documents fetch error:", docsError);
  }

  const docIds = (documents ?? []).map((doc) => doc.id);
  let summariesByDocId = new Map<string, PlanningStructuredSummary | null>();

  if (docIds.length > 0) {
    const { data: analyses } = await supabase
      .from("planning_document_analyses")
      .select("planning_document_id, structured_summary, created_at")
      .in("planning_document_id", docIds)
      .order("created_at", { ascending: false });

    for (const analysis of analyses ?? []) {
      if (!summariesByDocId.has(analysis.planning_document_id)) {
        summariesByDocId.set(
          analysis.planning_document_id,
          (analysis.structured_summary ?? null) as PlanningStructuredSummary | null
        );
      }
    }
  }

  const planningDocuments = (documents ?? []).map((doc) => ({
    id: doc.id,
    file_name: doc.file_name ?? "Planning document",
    uploaded_at: doc.created_at,
    structuredSummary: summariesByDocId.get(doc.id) ?? null,
  }));

  const siteTimeline = await calculateSiteTimeline(
    supabase,
    siteId,
    site.postcode
  );

  const lpaEvidence = await calculateLpaEvidence(
    supabase,
    site.local_planning_authority
  );

  return {
    site: {
      id: site.id,
      site_name: site.site_name ?? "Untitled site",
      address: site.address ?? "No address set",
      postcode: site.postcode ?? null,
      local_planning_authority:
        site.local_planning_authority ?? "Unknown LPA",
    },
    planningDocuments,
    siteTimeline,
    lpaEvidence,
    generatedAt: new Date().toISOString(),
  };
}

async function calculateSiteTimeline(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  siteId: string,
  postcode: string | null
) {
  let query = supabase
    .from("application")
    .select("decision, validated_date, received_date, decision_date")
    .eq("site_id", siteId)
    .gte("received_date", "2015-01-01");

  if (postcode) {
    query = query.or(`site_id.eq.${siteId},address_text.ilike.%${postcode}%`);
  }

  const { data: apps } = await query;

  const decided = (apps ?? []).filter((a) =>
    [
      "granted",
      "refused",
      "split_decision",
      "appeal_allowed",
      "appeal_dismissed",
    ].includes(a.decision)
  );

  const approvals = decided.filter((a) =>
    ["granted", "split_decision", "appeal_allowed"].includes(a.decision)
  ).length;

  const refusals = decided.filter((a) =>
    ["refused", "appeal_dismissed"].includes(a.decision)
  ).length;

  const weeks = decided
    .map((a) => {
      const start = a.validated_date || a.received_date;
      if (!start || !a.decision_date) return null;
      const diff =
        new Date(a.decision_date).getTime() - new Date(start).getTime();
      return Math.round(diff / (7 * 24 * 60 * 60 * 1000));
    })
    .filter((w): w is number => w != null && w >= 0);

  return {
    totalApps: (apps ?? []).length,
    approvals,
    refusals,
    medianWeeks: median(weeks),
  };
}

async function calculateLpaEvidence(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  lpaName: string
) {
  const lpaCode = deriveLpaCode(lpaName);
  let query = supabase
    .from("application")
    .select("decision, validated_date, received_date, decision_date")
    .gte("received_date", "2015-01-01");

  if (lpaCode) {
    query = query.eq("lpa_code", lpaCode);
  } else {
    query = query.ilike("address_text", `%${lpaName}%`);
  }

  const { data: apps } = await query;

  const decided = (apps ?? []).filter((a) =>
    [
      "granted",
      "refused",
      "split_decision",
      "appeal_allowed",
      "appeal_dismissed",
    ].includes(a.decision)
  );

  const approvals = decided.filter((a) =>
    ["granted", "split_decision", "appeal_allowed"].includes(a.decision)
  ).length;

  const approvalRate =
    decided.length > 0 ? (approvals / decided.length) * 100 : 0;

  const weeks = decided
    .map((a) => {
      const start = a.validated_date || a.received_date;
      if (!start || !a.decision_date) return null;
      const diff =
        new Date(a.decision_date).getTime() - new Date(start).getTime();
      return Math.round(diff / (7 * 24 * 60 * 60 * 1000));
    })
    .filter((w): w is number => w != null && w >= 0);

  return {
    lpaName,
    approvalRate,
    medianWeeks: median(weeks),
    sampleSize: decided.length,
  };
}

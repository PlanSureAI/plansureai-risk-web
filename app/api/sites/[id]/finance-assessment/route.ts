import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const RAILWAY_BASE = "https://empowering-cooperation-production.up.railway.app";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("id, address, postcode, local_planning_authority, user_id")
    .eq("id", id)
    .maybeSingle();

  if (siteError || !site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  if (site.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const planningStatus = body?.planning_status || "PENDING";
  const budgetTotal = Number(body?.budget_total ?? 0);
  const equityAvailable = Number(body?.equity_available ?? 0);
  const incomeVerified = Boolean(body?.income_verified);

  const payload = {
    site: {
      address: site.address ?? "",
      postcode: site.postcode ?? "",
      local_authority: site.local_planning_authority ?? "",
    },
    planning: {
      status: planningStatus,
      reference: null,
      refused: false,
    },
    land: {
      ownership_confirmed: false,
      access_rights: "UNCLEAR",
      contamination_risk: "UNKNOWN",
      flood_zone: "UNKNOWN",
      ground_conditions: "UNKNOWN",
    },
    technical: {
      cost_plan_exists: false,
      cost_plan_professional: null,
      drawings_set: "NONE",
      spec_document: false,
    },
    financial: {
      budget_total: budgetTotal,
      equity_available: equityAvailable,
      income_verified: incomeVerified,
    },
  };

  const response = await fetch(`${RAILWAY_BASE}/api/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    return NextResponse.json(
      { error: data?.error?.message || "Finance evaluation failed", details: data?.error?.details },
      { status: response.status }
    );
  }

  const record = {
    site_id: site.id,
    verdict: data?.verdict ?? "FIXABLE",
    confidence: Number(data?.confidence ?? 0),
    confidence_level: data?.confidence_level ?? null,
    summary: data?.summary ?? null,
    blocking_items: data?.blocking_items ?? null,
    next_steps: data?.next_steps ?? null,
    raw_response: data,
    updated_at: new Date().toISOString(),
  };

  const { error: upsertError } = await supabase
    .from("finance_assessments")
    .upsert(record, { onConflict: "site_id" });

  if (upsertError) {
    return NextResponse.json({ error: "Failed to save finance assessment" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, assessment: record });
}

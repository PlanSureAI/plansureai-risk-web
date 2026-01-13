import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";

type PlanningPayload = {
  scheme_id: string;
  planning_ref: string | null;
  decision: string | null;
  decision_date: string | null;
  authority_name: string | null;
  notes: string | null;
};

type FundingPayload = {
  scheme_id: string;
  lender_name: string | null;
  decision: string | null;
  ltc_percent: number | null;
  gdv_ltv_percent: number | null;
  interest_rate_percent: number | null;
  approved_loan_amount: number | null;
  decision_date: string | null;
  notes: string | null;
};

type PerformancePayload = {
  scheme_id: string;
  status: string | null;
  actual_build_cost: number | null;
  actual_gdv: number | null;
  build_start_date: string | null;
  build_completion_date: string | null;
  sale_completion_date: string | null;
  notes: string | null;
};

type OutcomesPayload = {
  planning?: PlanningPayload | null;
  funding?: FundingPayload | null;
  performance?: PerformancePayload | null;
};

type PlanningRow = {
  planning_ref: string | null;
  decision: string | null;
  decision_date: string | null;
  authority_name: string | null;
  notes: string | null;
};

type FundingRow = {
  lender_name: string | null;
  decision: string | null;
  ltc_percent: number | null;
  gdv_ltv_percent: number | null;
  interest_rate_percent: number | null;
  approved_loan_amount: number | null;
  decision_date: string | null;
  notes: string | null;
};

type PerformanceRow = {
  status: string | null;
  actual_build_cost: number | null;
  actual_gdv: number | null;
  build_start_date: string | null;
  build_completion_date: string | null;
  sale_completion_date: string | null;
  notes: string | null;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!id) {
    return NextResponse.json({ error: "site id required" }, { status: 400 });
  }

  const [planning, funding, performance] = await Promise.all([
    supabase
      .from("planning_outcomes")
      .select("planning_ref, decision, decision_date, authority_name, notes")
      .eq("scheme_id", id)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("funding_outcomes")
      .select(
        "lender_name, decision, ltc_percent, gdv_ltv_percent, interest_rate_percent, approved_loan_amount, decision_date, notes"
      )
      .eq("scheme_id", id)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("performance_outcomes")
      .select(
        "status, actual_gdv, actual_build_cost, build_start_date, build_completion_date, sale_completion_date, notes"
      )
      .eq("scheme_id", id)
      .limit(1)
      .maybeSingle(),
  ]);

  if (planning.error || funding.error || performance.error) {
    return NextResponse.json(
      {
        error:
          planning.error?.message ??
          funding.error?.message ??
          performance.error?.message ??
          "Failed to load outcomes",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    planning: planning.data ?? null,
    funding: funding.data ?? null,
    performance: performance.data ?? null,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!id) {
    return NextResponse.json({ error: "site id required" }, { status: 400 });
  }

  const payload = (await request.json()) as OutcomesPayload;
  const planningPayload = payload.planning ?? null;
  const fundingPayload = payload.funding ?? null;
  const performancePayload = payload.performance ?? null;

  const errors: string[] = [];
  let planningData: PlanningRow | null = null;
  let fundingData: FundingRow | null = null;
  let performanceData: PerformanceRow | null = null;

  if (planningPayload) {
    const { data, error } = await supabase
      .from("planning_outcomes")
      .upsert(planningPayload, { onConflict: "scheme_id" })
      .select("planning_ref, decision, decision_date, authority_name, notes")
      .maybeSingle();
    if (error) errors.push(error.message);
    planningData = data ?? null;
  }

  if (fundingPayload) {
    const { data, error } = await supabase
      .from("funding_outcomes")
      .upsert(fundingPayload, { onConflict: "scheme_id" })
      .select(
        "lender_name, decision, ltc_percent, gdv_ltv_percent, interest_rate_percent, approved_loan_amount, decision_date, notes"
      )
      .maybeSingle();
    if (error) errors.push(error.message);
    fundingData = data ?? null;
  }

  if (performancePayload) {
    const { data, error } = await supabase
      .from("performance_outcomes")
      .upsert(performancePayload, { onConflict: "scheme_id" })
      .select(
        "status, actual_gdv, actual_build_cost, build_start_date, build_completion_date, sale_completion_date, notes"
      )
      .maybeSingle();
    if (error) errors.push(error.message);
    performanceData = data ?? null;
  }

  if (errors.length) {
    return NextResponse.json(
      { error: errors.join(" | ") },
      { status: 500 }
    );
  }

  return NextResponse.json({
    planning: planningData,
    funding: fundingData,
    performance: performanceData,
  });
}

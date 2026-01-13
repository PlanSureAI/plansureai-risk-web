export type PlanningOutcome = {
  planning_ref: string | null;
  decision: string | null;
  decision_date: string | null;
  authority_name: string | null;
  notes: string | null;
};

export type FundingOutcome = {
  lender_name: string | null;
  decision: string | null;
  ltc_percent: number | null;
  gdv_ltv_percent: number | null;
  interest_rate_percent: number | null;
  approved_loan_amount: number | null;
  decision_date: string | null;
  notes: string | null;
};

export type PerformanceOutcome = {
  status: string | null;
  actual_build_cost: number | null;
  actual_gdv: number | null;
  build_start_date: string | null;
  build_completion_date: string | null;
  sale_completion_date: string | null;
  notes: string | null;
};

export type OutcomesBundle = {
  planning: PlanningOutcome | null;
  funding: FundingOutcome | null;
  performance: PerformanceOutcome | null;
};

export interface RiskAssessment {
  overall_score: number;
  risk_level: "low" | "amber" | "red";
  top_risks: Array<{
    category: string;
    severity: "high" | "medium" | "low";
    description: string;
  }>;
  policy_gaps: string[];
  compliance_notes: string;
  timeline_estimate: number;
  key_success_factors: string[];
  recommended_actions: string[];
}

export interface PlanningConstraint {
  id: string;
  site_id: string;
  type: string;
  description: string;
  severity: "high" | "medium" | "low";
  created_at: string;
}

export interface Site {
  id: string;
  user_id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  local_authority: string;
  risk_score: number;
  risk_level: "low" | "amber" | "red";
  risk_assessment: RiskAssessment;
  estimated_units: number;
  estimated_gdv: number;
  floor_area_sqm: number;
  status: "draft" | "submitted" | "approved" | "rejected" | "pending";
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  site_id: string;
  user_id: string;
  filename: string;
  file_path: string;
  status: "pending" | "processing" | "completed" | "failed";
  extracted_text: string;
  embeddings: number[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  processed_at: string;
}

export interface PlanningApproval {
  application_id: string;
  site_name: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  status: "approved" | "refused" | "pending";
  units: number;
  approval_date: string;
  decision_timeline_days: number;
  conditions: string[];
  developer: string;
}

export interface PortfolioMetrics {
  total_sites: number;
  total_units: number;
  estimated_gdv: number;
  by_risk_level: {
    low: number;
    amber: number;
    red: number;
  };
  average_risk_score: number;
  total_floor_area_sqm: number;
  sites_with_approvals: number;
  sites_pending_decision: number;
}

export interface ShareLink {
  id: string;
  site_id: string;
  token: string;
  shareUrl?: string;
  expires_at: string;
  recipient_email?: string;
  created_at: string;
  views: number;
}

export interface UserSubscription {
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  plan_tier: "free" | "starter" | "pro" | "enterprise";
  status: "active" | "canceled" | "past_due";
  current_period_start: string;
  current_period_end: string;
}

export interface PreAppPack {
  id: string;
  site_id: string;
  content: {
    site_location_plan: string;
    constraints_summary: string;
    policy_compliance_checklist: string[];
    draft_planning_statement: string;
    likely_conditions: string[];
    information_required: string[];
    estimated_timeline: string;
    key_policy_references: string[];
  };
  generated_at: string;
  status: "draft" | "ready" | "archived";
}

export interface PlanningDocument {
  id: string;
  site_id: string;
  type: string;
  source: string;
  file_path: string;
  file_name: string;
  mime_type: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
  parsed: boolean;
  parsed_at: string | null;
  parse_error: string | null;
}

export interface RiskAssessmentRecord {
  id: string;
  site_id: string;
  planning_document_id: string | null;
  overall_score: number | null;
  overall_confidence: number | null;
  headline_risk_colour: string | null;
  primary_killers: string[] | null;
  summary_markdown: string | null;
  created_at: string;
  created_by: string | null;
}

export interface RiskAssessmentReason {
  id: string;
  risk_assessment_id: string;
  category: string;
  severity: string;
  title: string;
  detail_markdown: string | null;
  policy_refs: string[] | null;
  source_type: string | null;
  created_at: string;
}

export interface ComparableApplication {
  id: string;
  site_id: string;
  external_app_id: string | null;
  lpa_name: string | null;
  distance_m: number | null;
  decision: string | null;
  decision_date: string | null;
  units_total: number | null;
  scheme_type: string | null;
  headline_reasons: string | null;
  data_source: string | null;
  created_at: string;
}

export interface ComparableSummary {
  id: string;
  site_id: string;
  summary_markdown: string | null;
  stats_json: Record<string, any> | null;
  created_at: string;
}

export interface MitigationPlan {
  id: string;
  site_id: string;
  risk_assessment_id: string | null;
  plan_markdown: string | null;
  created_at: string;
}

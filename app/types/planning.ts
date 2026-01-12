export type PlanningRoute = "PIP" | "PreApp" | "Full" | "Other";

export interface SiteInfo {
  name: string | null;
  address: string | null;
  localAuthority: string | null;
  clientName: string | null;
}

export interface ProposalInfo {
  description: string | null;
  route: PlanningRoute[];
  dwellingsMin: number | null;
  dwellingsMax: number | null;
  isHousingLed: boolean;
}

export interface ProcessInfo {
  stage: string | null;
  steps: string[];
}

export interface FeeDetail {
  amount: number | null;
  currency: "GBP";
  payer: string | null;
  description: string | null;
}

export interface FeesInfo {
  planningAuthorityFee: FeeDetail;
  agentFee: FeeDetail & { vatExcluded: boolean };
}

export interface PlanningDocumentMeta {
  documentTitle: string | null;
  documentDate: string | null;
  sourceFileName: string | null;
}

export interface PlanningDocumentSummary {
  site: SiteInfo;
  proposal: ProposalInfo;
  process: ProcessInfo;
  fees: FeesInfo;
  documentsRequired: string[];
  meta: PlanningDocumentMeta;
}

export interface PlanningDocumentAnalysis {
  headlineRisk: string | null;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "EXTREME" | null;
  keyIssues: string[];
  policyRefs: string[];
  recommendedActions: string[];
  timelineNotes: string | null;
}

export interface PlanningStructuredSummary {
  headline: string | null;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "EXTREME" | null;
  key_issues: string[];
  recommended_actions: string[];
  timeline_notes: string[];
  risk_issues?: Array<{
    issue: string;
    category: "planning" | "delivery" | "sales" | "cost" | "sponsor" | "energy" | "other";
    probability: number;
    impact: number;
    owner?: string | null;
    mitigation?: string | null;
  }>;
}

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

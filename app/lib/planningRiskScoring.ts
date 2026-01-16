export type RiskSeverity = "low" | "medium" | "high" | "critical";

export type RiskFactor = {
  id: string;
  category: "constraint" | "policy" | "history" | "site";
  severity: RiskSeverity;
  weight: number;
  title: string;
  description: string;
  impact: number;
  mitigation?: string;
  policy_reference?: string;
  policy_text?: string;
  policy_url?: string;
  evidence?: string;
  topRefusalReasons?: Array<{ reason: string; count: number; percentage: number }>;
};

export type PositiveFactor = {
  id: string;
  title: string;
  impact: number;
  evidence?: string;
};

export type RiskScore = {
  score: number;
  level: "low" | "medium" | "high" | "critical";
  tagline: string;
  topRisks: RiskFactor[];
  allRisks: RiskFactor[];
  positiveFactors: PositiveFactor[];
  confidence: number;
  calculatedAt: string;
  dataVersion: string;
};

export type PlanningRiskSite = {
  id: string;
  local_planning_authority?: string | null;
  proposed_units?: number | null;
  site_area_ha?: number | null;
  affordable_housing?: boolean | null;
  affordable_percentage?: number | null;
  rural_exception_site?: boolean | null;
  previously_developed?: boolean | null;
  has_vehicle_access?: boolean | null;
  previous_use?: string | null;
  local_plan_status?: "allocated" | "not_allocated" | "unknown" | null;
  constraints?: string[] | null;
  visited_at?: string | null;
};

export type PlanningHistorySummary = {
  recentApprovals: number;
  recentRefusals: number;
  avgDecisionWeeks: number | null;
  successRate: number | null;
  refusalReasonHighlights: string[];
};

export type PolicyReference = {
  policy_reference: string;
  policy_title: string;
  policy_text: string;
  policy_category: string | null;
};

export type ComparableInsights = {
  similarApproved: number;
  similarRefused: number;
  approvalProbability: number;
  avgDecisionWeeks: number | null;
  topRefusalReasons: Array<{ reason: string; count: number; percentage: number }>;
};

type RiskScoreOptions = {
  policies?: PolicyReference[];
  authority?: string | null;
  comparables?: ComparableInsights | null;
};

type ConfidenceInputs = {
  hasConstraintsData: boolean;
  hasPolicyData: boolean;
  hasHistoryData: boolean;
  hasSiteVisit: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getLocalDensityPolicy(authority?: string | null) {
  if (!authority) return 30;
  const key = authority.trim().toLowerCase();
  if (key.includes("cornwall")) return 30;
  if (key.includes("birmingham")) return 45;
  if (key.includes("leeds")) return 40;
  return 35;
}

function findPolicy(
  policies: PolicyReference[] | undefined,
  matcher: (policy: PolicyReference) => boolean
): PolicyReference | undefined {
  if (!policies) return undefined;
  return policies.find(matcher);
}

function attachPolicy(
  risk: RiskFactor,
  policies: PolicyReference[] | undefined,
  matcher: (policy: PolicyReference) => boolean
): RiskFactor {
  const policy = findPolicy(policies, matcher);
  if (!policy) return risk;
  return {
    ...risk,
    policy_reference: policy.policy_reference,
    policy_text: policy.policy_text,
  };
}

export function calculatePlanningRiskScore(
  site: PlanningRiskSite,
  history?: PlanningHistorySummary | null,
  options?: RiskScoreOptions
): RiskScore {
  let baseScore = 100;
  const riskFactors: RiskFactor[] = [];
  const positiveFactors: PositiveFactor[] = [];
  const constraints = site.constraints ?? [];
  const policies = options?.policies;

  const addRisk = (risk: RiskFactor) => {
    riskFactors.push(risk);
    baseScore += risk.impact;
  };

  const addPositive = (factor: PositiveFactor) => {
    positiveFactors.push(factor);
    baseScore += factor.impact;
  };

  if (constraints.includes("SSSI")) {
    addRisk({
      id: "sssi",
      severity: "critical",
      weight: 3,
      title: "SSSI (Site of Special Scientific Interest)",
      description: "Development is unlikely without exceptional justification.",
      impact: -30,
      category: "constraint",
    });
  }

  if (constraints.includes("flood_zone_3")) {
    addRisk({
      id: "flood-zone-3",
      severity: "critical",
      weight: 3,
      title: "Flood Zone 3",
      description: "Residential development requires the exception test.",
      impact: -25,
      mitigation: "Complete a flood risk assessment and test alternatives.",
      category: "constraint",
    });
  }

  if (constraints.includes("conservation_area")) {
    const risk = attachPolicy(
      {
        id: "conservation-area",
        severity: "high",
        weight: 2,
        title: "Conservation Area",
        description: "Design must preserve or enhance local character.",
        impact: -15,
        mitigation: "Prepare a heritage statement and design response.",
        category: "constraint",
      },
      policies,
      (policy) =>
        policy.policy_category === "design" ||
        policy.policy_text.toLowerCase().includes("conservation")
    );
    addRisk(risk);
  }

  if (constraints.includes("listed_building_nearby")) {
    const risk = attachPolicy(
      {
        id: "listed-building-setting",
        severity: "high",
        weight: 2,
        title: "Listed Building Setting",
        description: "Development must avoid harm to heritage setting.",
        impact: -12,
        mitigation: "Include a heritage impact assessment.",
        category: "constraint",
      },
      policies,
      (policy) =>
        policy.policy_text.toLowerCase().includes("heritage") ||
        policy.policy_text.toLowerCase().includes("listed")
    );
    addRisk(risk);
  }

  if (constraints.includes("green_belt")) {
    const risk = attachPolicy(
      {
        id: "green-belt",
        severity: "critical",
        weight: 3,
        title: "Green Belt",
        description: "Very special circumstances required.",
        impact: -28,
        mitigation: "Consider previously developed land exceptions.",
        category: "constraint",
      },
      policies,
      (policy) => policy.policy_text.toLowerCase().includes("green belt")
    );
    addRisk(risk);
  }

  if (constraints.includes("TPO")) {
    addRisk({
      id: "tree-preservation-order",
      severity: "medium",
      weight: 1,
      title: "Tree Preservation Order",
      description: "Protected trees on or near site.",
      impact: -8,
      mitigation: "Provide arboricultural survey and retention plan.",
      category: "constraint",
    });
  }

  if (constraints.includes("flood_zone_2")) {
    addRisk({
      id: "flood-zone-2",
      severity: "medium",
      weight: 1,
      title: "Flood Zone 2",
      description: "Flood risk assessment required.",
      impact: -6,
      mitigation: "Mitigate through resilient design and drainage.",
      category: "constraint",
    });
  }

  const units = site.proposed_units ?? 0;
  const authority = site.local_planning_authority ?? "";
  const affordableRequired = authority.toLowerCase().includes("cornwall") && units >= 6;

  if (affordableRequired && !site.affordable_housing) {
    const risk = attachPolicy(
      {
        id: "affordable-housing",
        severity: "high",
        weight: 2,
        title: "Affordable Housing Requirement",
        description: "Affordable housing policy applies at 6+ units.",
        impact: -18,
        mitigation: "Provide affordable housing or rural exception case.",
        category: "policy",
      },
      policies,
      (policy) => policy.policy_text.toLowerCase().includes("affordable")
    );
    addRisk(risk);
  } else if (affordableRequired && site.affordable_housing) {
    addPositive({
      id: "affordable-housing-included",
      title: "Affordable housing included",
      impact: 10,
    });
  }

  if (site.local_plan_status === "allocated") {
    addPositive({
      id: "local-plan-allocation",
      title: "Allocated in the Local Plan",
      impact: 20,
    });
  } else if (site.local_plan_status === "not_allocated") {
    addRisk({
      id: "local-plan-unallocated",
      severity: "medium",
      weight: 1,
      title: "Not Allocated in Local Plan",
      description: "Site is not specifically allocated for development.",
      impact: -10,
      mitigation: "Demonstrate windfall policy compliance.",
      category: "policy",
    });
  }

  if (units > 0 && site.site_area_ha) {
    const density = units / site.site_area_ha;
    const localDensityLimit = getLocalDensityPolicy(authority);
    if (density > localDensityLimit * 1.2) {
      addRisk({
        id: "excessive-density",
        severity: "high",
        weight: 2,
        title: "Excessive Density",
        description: `${Math.round(density)} dph exceeds local guidance.`,
        impact: -15,
        mitigation: "Reduce unit count or justify with design quality.",
        category: "policy",
      });
    }
  }

  if (history) {
    if (history.recentApprovals >= 3) {
      addPositive({
        id: "nearby-approvals",
        title: `${history.recentApprovals} similar approvals nearby`,
        impact: 15,
      });
    }
    if (history.recentRefusals >= 2) {
      addRisk({
        id: "nearby-refusals",
        severity: "medium",
        weight: 1,
        title: "Recent Refusals Nearby",
        description: `${history.recentRefusals} comparable refusals identified.`,
        impact: -10,
        mitigation: "Address refusal reasons in design and reports.",
        category: "history",
      });
    }
    history.refusalReasonHighlights.forEach((reason, idx) => {
      addRisk({
        id: `refusal-reason-${idx + 1}`,
        severity: "low",
        weight: 0.5,
        title: "Recurring refusal theme",
        description: reason,
        impact: -4,
        mitigation: "Review past officer reports for mitigation.",
        category: "history",
      });
    });
  }

  const comparables = options?.comparables;
  if (comparables) {
    if (comparables.approvalProbability >= 0.7) {
      addPositive({
        id: "local-approval-rate",
        title: `${Math.round(comparables.approvalProbability * 100)}% approval rate for similar schemes`,
        impact: 10,
        evidence: `${comparables.similarApproved} approvals vs ${comparables.similarRefused} refusals nearby`,
      });
    } else if (comparables.approvalProbability <= 0.4) {
      addRisk({
        id: "low-approval-rate",
        severity: "high",
        weight: 2,
        title: "Low Local Approval Rate",
        description: "Comparable schemes show a low approval rate nearby.",
        impact: -18,
        mitigation: comparables.topRefusalReasons.length
          ? `Address common refusal reasons: ${comparables.topRefusalReasons
              .map((r) => r.reason)
              .join(", ")}`
          : "Review recent refusals and address recurring issues.",
        category: "history",
        evidence: `${comparables.similarRefused} refusals vs ${comparables.similarApproved} approvals`,
        topRefusalReasons: comparables.topRefusalReasons,
      });
    }
  }

  if (site.has_vehicle_access === true) {
    addPositive({
      id: "vehicle-access",
      title: "Vehicle access identified",
      impact: 5,
    });
  } else if (site.has_vehicle_access === false) {
    addRisk({
      id: "vehicle-access",
      severity: "medium",
      weight: 1,
      title: "Access concerns",
      description: "No confirmed vehicle access identified.",
      impact: -12,
      mitigation: "Prepare highway access and visibility analysis.",
      category: "site",
    });
  }

  if (site.previous_use === "industrial" || site.previous_use === "commercial") {
    addRisk({
      id: "contamination-risk",
      severity: "low",
      weight: 0.5,
      title: "Potential contamination",
      description: "Previous non-residential use suggests investigation needed.",
      impact: -5,
      mitigation: "Commission a phase 1 contamination report.",
      category: "site",
    });
  }

  if (site.previously_developed) {
    addPositive({
      id: "brownfield",
      title: "Previously developed land",
      impact: 10,
    });
  }

  if (site.rural_exception_site) {
    addPositive({
      id: "rural-exception",
      title: "Rural exception site alignment",
      impact: 6,
    });
  }

  const finalScore = clamp(baseScore, 0, 100);
  let level: RiskScore["level"];
  let tagline: string;

  if (finalScore >= 70) {
    level = "low";
    tagline = "Good prospects with manageable constraints";
  } else if (finalScore >= 50) {
    level = "medium";
    tagline = "Viable with careful planning and mitigation";
  } else if (finalScore >= 30) {
    level = "high";
    tagline = "Significant challenges requiring expert input";
  } else {
    level = "critical";
    tagline = "Major obstacles - consider alternative sites";
  }

  const sortedRisks = [...riskFactors].sort((a, b) => a.impact - b.impact);
  const topRisks = sortedRisks.slice(0, 3);

  const confidence = calculateConfidence({
    hasConstraintsData: constraints.length > 0,
    hasPolicyData: site.local_plan_status != null || affordableRequired || !!policies?.length,
    hasHistoryData: !!history || !!comparables,
    hasSiteVisit: !!site.visited_at,
  });

  return {
    score: finalScore,
    level,
    tagline,
    topRisks,
    allRisks: sortedRisks,
    positiveFactors,
    confidence,
    calculatedAt: new Date().toISOString(),
    dataVersion: "1.0",
  };
}

function calculateConfidence(data: ConfidenceInputs): number {
  let confidence = 0;
  if (data.hasConstraintsData) confidence += 30;
  if (data.hasPolicyData) confidence += 30;
  if (data.hasHistoryData) confidence += 25;
  if (data.hasSiteVisit) confidence += 15;
  return confidence;
}

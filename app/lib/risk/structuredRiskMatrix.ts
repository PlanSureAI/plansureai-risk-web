import type { PlanningStructuredSummary } from "@/app/types/planning";

export type RiskCategory =
  | "planning"
  | "delivery"
  | "sales"
  | "cost"
  | "sponsor"
  | "energy"
  | "other";

export type RiskBand = "low" | "medium" | "high";

export type RiskIssue = {
  issue: string;
  category: RiskCategory;
  probability: number;
  impact: number;
  owner?: string | null;
  mitigation?: string | null;
};

export type RiskIssueScore = RiskIssue & {
  score: number;
  normalizedScore: number;
};

export type RiskMatrixSnapshot = {
  riskIndex: number | null;
  riskBand: RiskBand | null;
  topIssues: RiskIssueScore[];
  grid: number[][];
  issues: RiskIssueScore[];
};

const GRID_SIZE = 5;

function clampLikert(value: number): number {
  if (!Number.isFinite(value)) return 1;
  if (value < 1) return 1;
  if (value > 5) return 5;
  return Math.round(value);
}

function scoreIssue(probability: number, impact: number): number {
  return clampLikert(probability) * clampLikert(impact);
}

function normalizeScore(score: number): number {
  return Math.round((score / (GRID_SIZE * GRID_SIZE)) * 100);
}

function riskBandForIndex(index: number): RiskBand {
  if (index <= 33) return "low";
  if (index <= 66) return "medium";
  return "high";
}

function buildEmptyGrid(): number[][] {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
}

function fallbackIssuesFromKeyIssues(summary: PlanningStructuredSummary): RiskIssue[] {
  if (!summary.key_issues?.length) return [];
  return summary.key_issues.map((issue) => ({
    issue,
    category: "planning",
    probability: 3,
    impact: 3,
    owner: null,
    mitigation: null,
  }));
}

export function buildRiskMatrixSnapshot(
  summary: PlanningStructuredSummary | null | undefined
): RiskMatrixSnapshot {
  if (!summary) {
    return {
      riskIndex: null,
      riskBand: null,
      topIssues: [],
      grid: buildEmptyGrid(),
      issues: [],
    };
  }

  const issues = (summary.risk_issues?.length
    ? summary.risk_issues
    : fallbackIssuesFromKeyIssues(summary)
  ).map((issue) => {
    const score = scoreIssue(issue.probability, issue.impact);
    return {
      ...issue,
      probability: clampLikert(issue.probability),
      impact: clampLikert(issue.impact),
      score,
      normalizedScore: normalizeScore(score),
    };
  });

  if (issues.length === 0) {
    return {
      riskIndex: null,
      riskBand: null,
      topIssues: [],
      grid: buildEmptyGrid(),
      issues: [],
    };
  }

  const totalScore = issues.reduce((acc, issue) => acc + issue.normalizedScore, 0);
  const riskIndex = Math.round(totalScore / issues.length);
  const riskBand = riskBandForIndex(riskIndex);
  const topIssues = [...issues].sort((a, b) => b.score - a.score).slice(0, 3);
  const grid = buildEmptyGrid();

  for (const issue of issues) {
    const pIndex = clampLikert(issue.probability) - 1;
    const iIndex = clampLikert(issue.impact) - 1;
    grid[pIndex][iIndex] += 1;
  }

  return {
    riskIndex,
    riskBand,
    topIssues,
    grid,
    issues,
  };
}

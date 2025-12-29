export type PlanningPermissionMapRow = {
  source: string;
  planning_risk: string;
  planning_score: number;
  risk_status: string;
  site_killers: string[];
};

export const PERMISSION_STATUS_MAP: PlanningPermissionMapRow[] = [
  {
    source: "planning-permission-status:permissioned",
    planning_risk: "low",
    planning_score: 4,
    risk_status: "green",
    site_killers: [],
  },
  {
    source: "planning-permission-status:not-permissioned",
    planning_risk: "high",
    planning_score: 1,
    risk_status: "red",
    site_killers: ["recent_refusal"],
  },
  {
    source: "planning-permission-status:pending-decision",
    planning_risk: "medium",
    planning_score: 3,
    risk_status: "amber",
    site_killers: [],
  },
];

export type GeographySiteKiller = {
  source: string;
  site_field?: string;
  site_field_value?: any;
  extra_site_killers?: string[];
};

export const GEOGRAPHY_SITE_KILLERS: GeographySiteKiller[] = [
  {
    source: "dataset:green-belt",
    site_field: "green_belt",
    site_field_value: true,
    extra_site_killers: ["green_belt_constraint"],
  },
  {
    source: "dataset:conservation-area",
    extra_site_killers: ["heritage_conservation"],
  },
];

export function mapPlanningPermissionStatus(
  source: string | null | undefined
): PlanningPermissionMapRow | null {
  if (!source) return null;
  const match = PERMISSION_STATUS_MAP.find((row) => row.source === source);
  return match ?? null;
}

export function mergeSiteKillers(
  existing: string[] | null | undefined,
  extras: string[]
): string[] {
  const set = new Set<string>();
  (existing ?? []).forEach((k) => {
    if (typeof k === "string" && k.trim()) set.add(k);
  });
  extras.forEach((k) => {
    if (typeof k === "string" && k.trim()) set.add(k);
  });
  return Array.from(set);
}

import type { SitePlanningData } from "./planningDataProvider";

export function formatPlanningDataForPromptJson(data: SitePlanningData | null | undefined) {
  if (!data) return undefined;

  const lower = (value: string | null | undefined) =>
    typeof value === "string" ? value.toLowerCase() : null;

  const parcel = data.parcelContext
    ? {
        parcel_id: data.parcelContext.parcel_id ?? null,
        titles: data.parcelContext.titles ?? [],
        uprns: data.parcelContext.uprns ?? [],
        local_planning_authority: null,
        developed_area_ratio: data.parcelContext.developed_area_ratio ?? null,
        planning_application_ids: data.parcelContext.planning_application_ids ?? [],
      }
    : undefined;

  const planning_applications = (data.planningApplications ?? []).map((app) => ({
    id: app.planning_application_id,
    status: lower(app.status_derived ?? undefined) ?? null,
    status_derived: lower(app.status_derived ?? undefined) ?? null,
    decision: null,
    decision_date: null,
    received_date: null,
    num_dwellings: typeof app.found_num_dwellings === "boolean" ? app.found_num_dwellings : null,
    use_class: lower(app.classification ?? undefined) ?? null,
    size: app.size ?? null,
    tags: app.tags ?? [],
  }));

  const grid = data.grid
    ? {
        nearest_asset_type: lower(data.grid.nearest_asset_type ?? undefined) ?? null,
        distance_m: data.grid.distance_m,
      }
    : undefined;

  const repd = data.repd
    ? {
        repd_id: data.repd.repd_id,
        technology: lower(data.repd.technology_type ?? undefined) ?? null,
        capacity_mw: data.repd.capacity_mw,
        status: lower(data.repd.status ?? undefined) ?? null,
      }
    : undefined;

  return {
    parcel,
    planning_applications,
    grid,
    repd,
  };
}

export type PlanningInstructionPayload = {
  instruction: string;
  site: {
    name: string;
    address: string;
    lpa: string;
    status: string;
    existing_planning_outcome: string;
    objection_likelihood: string;
    key_planning_considerations: string;
    planning_summary: string;
    decision_summary: string;
  };
  planning_data?: ReturnType<typeof formatPlanningDataForPromptJson>;
};

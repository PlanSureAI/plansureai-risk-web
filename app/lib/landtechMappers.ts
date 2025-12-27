import {
  ParcelDetailsResponse,
  PlanningApplicationResponse,
  PowerDistanceContext,
  RepdResponse,
} from "./landtechClient";

export type SitePlanningContext = {
  parcel_id: string | null;
  titles: string[];
  uprns: string[];
  developed_area_ratio: number | null;
  planning_application_ids: string[];
};

export type SitePlanningApplicationSummary = {
  planning_application_id: string;
  status_derived: string | null;
  classification: string | null;
  size: number | null;
  found_num_dwellings: boolean;
  tags: string[];
};

export type SiteGridContext = PowerDistanceContext;

export type SiteRepdContext = {
  repd_id: string;
  technology_type: string | null;
  capacity_mw: number | null;
  status: string | null;
};

export function mapParcelDetails(res: ParcelDetailsResponse): SitePlanningContext {
  const d = res.data;
  if (!d) {
    return {
      parcel_id: null,
      titles: [],
      uprns: [],
      developed_area_ratio: null,
      planning_application_ids: [],
    };
  }

  return {
    parcel_id: d.parcel_id ?? null,
    titles: Array.isArray(d.titles) ? d.titles : [],
    uprns: Array.isArray(d.properties) ? d.properties : [],
    developed_area_ratio: typeof d.developed_area_ratio === "number" ? d.developed_area_ratio : null,
    planning_application_ids: Array.isArray(d.planning_apps) ? d.planning_apps : [],
  };
}

export function mapPlanningApplication(res: PlanningApplicationResponse): SitePlanningApplicationSummary | null {
  const d = res.data;
  if (!d) return null;

  return {
    planning_application_id: d.planning_application_id,
    status_derived: d.status_derived ?? null,
    classification: d.classification ?? null,
    size: typeof d.size === "number" ? d.size : null,
    found_num_dwellings: !!d.found_num_dwellings,
    tags: Array.isArray(d.tags) ? d.tags : [],
  };
}

// Example: caller calculates nearest asset + distance
export function buildGridContext(nearestAssetType: string | null, distanceM: number | null): SiteGridContext {
  return {
    nearest_asset_type: nearestAssetType,
    distance_m: distanceM,
  };
}

export function mapRepdSite(res: RepdResponse): SiteRepdContext | null {
  const f = res.data?.feature;
  if (!f) return null;

  return {
    repd_id: f.id,
    technology_type: f.properties?.technology_type ?? null,
    capacity_mw: typeof f.properties?.installed_capacity_mw === "number"
      ? f.properties!.installed_capacity_mw
      : null,
    status: f.properties?.status ?? null,
  };
}

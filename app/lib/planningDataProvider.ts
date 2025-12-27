"use server";

import { LandTechClient } from "./landtechClient";
import {
  buildGridContext,
  mapParcelDetails,
  mapPlanningApplication,
  mapRepdSite,
  type SiteGridContext,
  type SitePlanningApplicationSummary,
  type SitePlanningContext,
  type SiteRepdContext,
} from "./landtechMappers";

type Point = { type: "Point"; coordinates: [number, number] };
type Polygon = { type: "Polygon"; coordinates: number[][][] };
type MultiPolygon = { type: "MultiPolygon"; coordinates: number[][][][] };
type Geometry = Point | Polygon | MultiPolygon;

export type SitePlanningData = {
  parcelContext: SitePlanningContext | null;
  planningApplications: SitePlanningApplicationSummary[];
  grid: SiteGridContext | null;
  repd: SiteRepdContext | null;
};

async function geocodePostcode(postcode: string): Promise<Point | null> {
  const trimmed = postcode.trim();
  if (!trimmed) return null;

  const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(trimmed)}`);
  if (!res.ok) return null;

  const json = await res.json().catch(() => null);
  const lat = json?.result?.latitude;
  const lon = json?.result?.longitude;
  if (typeof lat !== "number" || typeof lon !== "number") return null;

  return { type: "Point", coordinates: [lon, lat] };
}

export async function getSiteRiskInputFromLandTech(opts: {
  geometry?: Geometry | null;
  postcode?: string | null;
  apiKey: string;
}): Promise<SitePlanningData | null> {
  const client = new LandTechClient(opts.apiKey);

  const auth = await client.getAuthStatus();
  if (auth.user.state !== "active") {
    throw new Error("LandTech API key is not active");
  }

  let geometry = opts.geometry ?? null;

  if (!geometry && opts.postcode) {
    geometry = await geocodePostcode(opts.postcode);
  }

  if (!geometry) {
    return null;
  }

  const parcelSearchBody = {
    search_filter: {
      ALL: [
        {
          id: "search-location-id",
          location: geometry,
          must: "INTERSECT",
        },
      ],
    },
  };

  const parcelIds = await client.searchParcelsAdvanced(parcelSearchBody);
  const parcelId = parcelIds.parcel_ids[0];

  if (!parcelId) {
    return {
      parcelContext: null,
      planningApplications: [],
      grid: null,
      repd: null,
    };
  }

  const parcelDetails = await client.getParcel(parcelId);
  const parcelContext = mapParcelDetails(parcelDetails);

  const planningApplications: SitePlanningApplicationSummary[] = [];
  for (const id of (parcelContext.planning_application_ids ?? []).slice(0, 3)) {
    const pa = await client.getPlanningApplication(id);
    const mapped = mapPlanningApplication(pa);
    if (mapped) planningApplications.push(mapped);
  }

  const grid = buildGridContext(null, null);

  // REPD lookups require a specific ID; left null unless you add a lookup strategy.
  const repd = null as SiteRepdContext | null;
  void mapRepdSite;

  return {
    parcelContext,
    planningApplications,
    grid,
    repd,
  };
}

export async function buildSiteRiskProfileInput(args: {
  geometry?: Geometry | null;
  postcode?: string | null;
  apiKey: string;
}): Promise<SitePlanningData | null> {
  return getSiteRiskInputFromLandTech(args);
}

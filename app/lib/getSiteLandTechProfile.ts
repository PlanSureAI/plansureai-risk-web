"use server";

import { LandTechClient } from \"@/lib/landtechClient\";
import {
  mapParcelDetails,
  mapPlanningApplication,
  buildGridContext,
  mapRepdSite,
} from \"@/lib/landtechMappers\";

const apiKey = process.env.LANDTECH_API_KEY;
if (!apiKey) {
  throw new Error(\"LANDTECH_API_KEY not set\");
}

const client = new LandTechClient(apiKey);

/**
 * Example server action showing how to stitch LandTech endpoints together.
 * Provide a polygon or point in the shape LandTech expects (GeoJSON style).
 */
export async function getSiteLandTechProfile(sitePolygonOrPoint: unknown) {
  // 1) Make sure auth is good
  const auth = await client.getAuthStatus();
  if (auth.user.state !== \"active\") {
    throw new Error(`LandTech user state is ${auth.user.state}`);
  }

  // 2) Search for parcels around the site
  const parcelSearchBody = {
    search_filter: {
      ALL: [
        {
          id: \"search-location-id\",
          location: sitePolygonOrPoint,
          must: \"INTERSECT\",
        },
      ],
    },
  };

  const parcelIds = await client.searchParcelsAdvanced(parcelSearchBody);
  const parcelId = parcelIds.parcel_ids[0];
  if (!parcelId) {
    return { parcelContext: null, planningApps: [], grid: null, repd: null };
  }

  // 3) Get parcel details
  const parcelDetails = await client.getParcel(parcelId);
  const parcelContext = mapParcelDetails(parcelDetails);

  // 4) Optionally fetch the first planning application in detail
  const planningAppSummaries = [];
  if (parcelContext.planning_application_ids[0]) {
    const pa = await client.getPlanningApplication(parcelContext.planning_application_ids[0]);
    const mapped = mapPlanningApplication(pa);
    if (mapped) planningAppSummaries.push(mapped);
  }

  // 5) Placeholder grid + REPD (wire real filters / IDs as needed)
  const grid = buildGridContext(null, null);
  const repd = null; // or mapRepdSite(await client.getRepdSite(repdId))
  void mapRepdSite; // keep helper referenced for future use

  return {
    parcelContext,
    planningApps: planningAppSummaries,
    grid,
    repd,
  };
}

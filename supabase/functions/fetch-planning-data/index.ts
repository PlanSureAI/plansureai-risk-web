// supabase/functions/fetch-planning-data/index.ts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchPlanningData } from "../_shared/planningDataProvider.ts";
import {
  mapGeographyToSiteFields,
  mapPlanningPermissionStatus,
  mergeSiteKillers,
} from "../_shared/planningVocab.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);
const PLANNING_DATA_BASE = "https://www.planning.data.gov.uk";

async function fetchWithTimeout(url: string, timeoutMs = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

function extractPlanningPermissionStatus(raw: any): string | null {
  const entities = (raw?.entities ?? raw?.results ?? []) as any[];
  for (const entity of entities) {
    const typology = entity?.typology || entity?.type || entity?.kind;
    const types = Array.isArray(typology) ? typology : typology ? [typology] : [];
    const statusId =
      entity?.status?.id ||
      entity?.permission_status_id ||
      entity?.status_id ||
      (typeof entity?.status === "string" ? entity.status : null);

    const isPlanningPermission = types.some((t: any) =>
      typeof t === "string" ? t.includes("planning-permission") : false
    );

    if (isPlanningPermission && statusId) {
      return String(statusId);
    }
  }

  if (raw?.status?.id && String(raw.status.id).includes("planning-permission-status")) {
    return String(raw.status.id);
  }

  return null;
}

function humanizePermissionStatus(status: string | null): string | null {
  if (!status) return null;
  const parts = status.split(":");
  const label = parts[parts.length - 1] ?? status;
  return label.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

async function fetchGeographiesForPostcode(postcode: string) {
  const url = new URL(`${PLANNING_DATA_BASE}/entity.json`);
  url.searchParams.set("q", postcode);
  url.searchParams.append("dataset[]", "built-up-area");
  url.searchParams.append("limit", "10");

  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`planning.data.gov.uk ${res.status}`);
  const json = await res.json();
  return (json?.entries ?? json?.entities ?? []) as any[];
}

Deno.serve(async (req) => {
  try {
    const { postcode } = await req.json();

    if (!postcode || typeof postcode !== "string") {
      return new Response(JSON.stringify({ error: "postcode is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Geocode to get lat/lon (optional if provider doesn’t need it)
    const geoRes = await fetchWithTimeout(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`,
      5000
    );
    if (!geoRes.ok) {
      const text = await geoRes.text();
      throw new Error(`postcodes.io error: ${geoRes.status} ${text}`);
    }
    const geoJson = await geoRes.json();
    const result = geoJson.result;
    const lat = result.latitude;
    const lon = result.longitude;

    const planning = await fetchPlanningData({ postcode: postcode.trim(), lat, lon });

    // Fetch Planning Data geography entities (e.g. built-up-area)
    const geographyEntities = await fetchGeographiesForPostcode(postcode.trim());

    // Attempt to read planning-permission status from provider payload
    const permissionStatus = extractPlanningPermissionStatus(planning.raw);
    const mappedPermission = mapPlanningPermissionStatus(permissionStatus);
    const mappedGeos = geographyEntities.map(mapGeographyToSiteFields);
    const settlement = mappedGeos.find((g) => g.settlement)?.settlement ?? null;
    const geoSiteKillers = mappedGeos.flatMap((g) => g.extra_site_killers ?? []);

    // Fetch existing site to merge site_killers and avoid null updates
    const { data: site } = await supabase
      .from("sites")
      .select("site_killers")
      .eq("postcode", postcode)
      .maybeSingle();

    await supabase
      .from("sites")
      .update({
        planning_constraints: planning.raw,
        planning_likely_objections: planning.likelyObjections,
        planning_applications: planning.applications,
        planning_provider: planning.provider,
        planning_provider_meta: planning.providerMeta,
        last_planning_fetch_at: new Date().toISOString(),
        ...(settlement ? { settlement } : {}),
        ...(mappedPermission
          ? {
              status: humanizePermissionStatus(permissionStatus),
              planning_risk: mappedPermission.planning_risk,
              planning_score: mappedPermission.planning_score,
              risk_status: mappedPermission.risk_status,
              site_killers: mergeSiteKillers(site?.site_killers ?? [], [
                ...mappedPermission.site_killers,
                ...geoSiteKillers,
              ]),
            }
          : {}),
      })
      .eq("postcode", postcode);

    return new Response(JSON.stringify(planning), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("fetch-planning-data error", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

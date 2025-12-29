// supabase/functions/fetch-planning-data/index.ts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchPlanningData } from "../_shared/planningDataProvider.ts";
import { mapPlanningPermissionStatus, mergeSiteKillers } from "../_shared/planningVocab.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

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

    // Attempt to read planning-permission status from provider payload
    const permissionStatus = extractPlanningPermissionStatus(planning.raw);
    const mappedPermission = mapPlanningPermissionStatus(permissionStatus);

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
        ...(mappedPermission
          ? {
              status: humanizePermissionStatus(permissionStatus),
              planning_risk: mappedPermission.planning_risk,
              planning_score: mappedPermission.planning_score,
              risk_status: mappedPermission.risk_status,
              site_killers: mergeSiteKillers(site?.site_killers ?? [], mappedPermission.site_killers),
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

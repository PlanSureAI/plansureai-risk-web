// supabase/functions/fetch-planning-data/index.ts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchPlanningData } from "../_shared/planningDataProvider.ts";

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

    await supabase
      .from("sites")
      .update({
        planning_constraints: planning.raw,
        planning_likely_objections: planning.likelyObjections,
        planning_applications: planning.applications,
        planning_provider: planning.provider,
        planning_provider_meta: planning.providerMeta,
        last_planning_fetch_at: new Date().toISOString(),
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

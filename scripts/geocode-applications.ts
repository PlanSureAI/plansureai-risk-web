#!/usr/bin/env node

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Application = {
  id: string;
  address: string;
  postcode: string | null;
};

async function geocodeAddress(
  address: string,
  postcode: string | null
): Promise<{ latitude: number; longitude: number } | null> {
  const buildUrl = (query: string) =>
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query
    )}&format=json&limit=1&countrycodes=gb`;

  try {
    const res = await fetch(buildUrl(postcode ? `${address}, ${postcode}, UK` : `${address}, UK`), {
      headers: {
        "User-Agent": "PlanSureAI/1.0 (https://plansureai.com)",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data[0]) {
      return {
        latitude: Number.parseFloat(data[0].lat),
        longitude: Number.parseFloat(data[0].lon),
      };
    }

    if (postcode) {
      const fallbackRes = await fetch(buildUrl(`${postcode}, UK`), {
        headers: {
          "User-Agent": "PlanSureAI/1.0 (https://plansureai.com)",
        },
      });
      if (!fallbackRes.ok) {
        throw new Error(`HTTP ${fallbackRes.status}`);
      }
      const fallbackData = await fallbackRes.json();
      if (fallbackData[0]) {
        return {
          latitude: Number.parseFloat(fallbackData[0].lat),
          longitude: Number.parseFloat(fallbackData[0].lon),
        };
      }
    }

    return null;
  } catch (err) {
    console.error(`   Geocoding failed: ${err}`);
    return null;
  }
}

async function geocodeAllApplications(limit?: number) {
  console.log("Starting geocoding...\n");

  let query = supabase
    .from("planning_applications")
    .select("id, address, postcode")
    .is("latitude", null)
    .order("scraped_at", { ascending: true });

  if (limit) {
    query = query.limit(limit);
  }

  const { data: apps, error } = await query;

  if (error) {
    console.error("Error fetching applications:", error);
    process.exit(1);
  }

  if (!apps || apps.length === 0) {
    console.log("All applications already geocoded!");
    process.exit(0);
  }

  console.log(`Found ${apps.length} applications to geocode`);
  console.log(
    `Estimated time: ${Math.ceil((apps.length * 1.2) / 60)} minutes (rate limited)`
  );

  let geocoded = 0;
  let failed = 0;
  const failures: Array<{ id: string; address: string; postcode: string | null }> = [];

  for (let i = 0; i < apps.length; i += 1) {
    const app = apps[i] as Application;
    const progress = `[${i + 1}/${apps.length}]`;

    console.log(`${progress} Geocoding: ${app.address}`);

    const coords = await geocodeAddress(app.address, app.postcode);

    if (coords) {
      const { error: updateError } = await supabase
        .from("planning_applications")
        .update({
          latitude: coords.latitude,
          longitude: coords.longitude,
        })
        .eq("id", app.id);

      if (updateError) {
        console.log(`   Update failed: ${updateError.message}`);
        failed += 1;
      } else {
        console.log(
          `   ${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`
        );
        geocoded += 1;
      }
    } else {
      console.log("   Not found");
      failed += 1;
      failures.push({ id: app.id, address: app.address, postcode: app.postcode });
    }

    if (i < apps.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }
  }

  console.log("\nGeocoding Summary:");
  console.log(`  Geocoded: ${geocoded}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total: ${apps.length}`);

  if (failures.length > 0) {
    const outputPath = path.resolve(process.cwd(), "scripts/geocode-failures.csv");
    const header = "id,address,postcode\n";
    const rows = failures
      .map((row) => {
        const safeAddress = `"${row.address.replace(/\"/g, '""')}"`;
        const safePostcode = row.postcode ? `"${row.postcode.replace(/\"/g, '""')}"` : "";
        return `${row.id},${safeAddress},${safePostcode}`;
      })
      .join("\n");
    fs.writeFileSync(outputPath, header + rows, "utf-8");
    console.log(`  Failed rows exported: ${outputPath}`);
  }
}

const args = process.argv.slice(2);
const limit = args[0] ? Number.parseInt(args[0], 10) : undefined;

if (args.includes("--help") || args.includes("-h")) {
  console.log(`
Planning Applications Geocoding Script

Usage:
  npm run geocode-applications [limit]

Arguments:
  limit   Number of applications to geocode (optional, default: all)

Examples:
  npm run geocode-applications
  npm run geocode-applications 10
  `);
  process.exit(0);
}

console.log("Starting geocoding...\n");
geocodeAllApplications(limit)
  .then(() => {
    console.log("\nGeocoding complete!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\nGeocoding failed:", err);
    process.exit(1);
  });

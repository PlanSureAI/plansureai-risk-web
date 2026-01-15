import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedData() {
  console.log("🌱 Starting data seed...");

  try {
    const userId = "00000000-0000-0000-0000-000000000001";

    const sites = [
      {
        id: "site-001",
        user_id: userId,
        name: "High Street Development, Cornwall",
        location: "Truro, Cornwall",
        latitude: 50.2617,
        longitude: -5.0935,
        local_authority: "Cornwall Council",
        estimated_units: 12,
        estimated_gdv: 4500000,
        floor_area_sqm: 1500,
        status: "draft",
      },
      {
        id: "site-002",
        user_id: userId,
        name: "City Center Mixed-Use, Birmingham",
        location: "Birmingham City Centre",
        latitude: 52.5095,
        longitude: -1.8845,
        local_authority: "Birmingham City Council",
        estimated_units: 25,
        estimated_gdv: 12000000,
        floor_area_sqm: 3200,
        status: "pending",
      },
      {
        id: "site-003",
        user_id: userId,
        name: "Waterfront Project, Leeds",
        location: "Leeds City Centre",
        latitude: 53.8008,
        longitude: -1.5491,
        local_authority: "Leeds City Council",
        estimated_units: 35,
        estimated_gdv: 18500000,
        floor_area_sqm: 4500,
        status: "draft",
      },
    ];

    const { error: sitesError } = await supabase.from("sites").insert(sites);

    if (sitesError) {
      console.error("Error seeding sites:", sitesError);
    } else {
      console.log("✅ Seeded 3 test sites");
    }

    const constraints = [
      {
        site_id: "site-001",
        type: "Heritage",
        description: "Adjacent to Grade II listed building",
        severity: "high",
      },
      {
        site_id: "site-001",
        type: "Conservation Area",
        description: "Within designated conservation area",
        severity: "high",
      },
      {
        site_id: "site-002",
        type: "Flood Risk",
        description: "Zone 2 flood risk area",
        severity: "medium",
      },
      {
        site_id: "site-003",
        type: "Transport",
        description: "Requires transport assessment",
        severity: "medium",
      },
    ];

    const { error: constraintsError } = await supabase
      .from("planning_constraints")
      .insert(constraints);

    if (constraintsError) {
      console.error("Error seeding constraints:", constraintsError);
    } else {
      console.log("✅ Seeded planning constraints");
    }

    const activities = [
      {
        user_id: userId,
        site_id: "site-001",
        action: "site_created",
        metadata: { site_name: "High Street Development, Cornwall" },
      },
      {
        user_id: userId,
        site_id: "site-001",
        action: "document_uploaded",
        metadata: { filename: "Planning Statement.pdf", size: 2500000 },
      },
      {
        user_id: userId,
        site_id: "site-001",
        action: "document_processed",
        metadata: { risk_score: 65, risk_level: "amber" },
      },
    ];

    const { error: activitiesError } = await supabase
      .from("activity_logs")
      .insert(activities);

    if (activitiesError) {
      console.error("Error seeding activities:", activitiesError);
    } else {
      console.log("✅ Seeded activity logs");
    }

    console.log("\n✨ Data seed completed successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seedData();

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type NearbyApplication = {
  id: string;
  authority: string | null;
  address: string | null;
  reference: string | null;
  description: string | null;
  units: number | null;
  decision: string | null;
  decision_date: string | null;
  validated_date: string | null;
  refusal_reasons: string[] | null;
  conditions: string[] | null;
  planning_portal_url: string | null;
  officer_report_url: string | null;
  latitude: number | null;
  longitude: number | null;
  distance: number | null;
};

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radius = Number(searchParams.get("radius") ?? "500");

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radius)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const { data: applications, error } = await supabase.rpc(
    "find_nearby_planning_applications",
    {
      center_lat: lat,
      center_lng: lng,
      radius_meters: radius,
    }
  );

  if (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }

  const enriched = (applications as NearbyApplication[] | null)?.map((app) => {
    let weeksTaken: number | null = null;
    if (app.decision_date && app.validated_date) {
      const decision = new Date(app.decision_date).getTime();
      const validated = new Date(app.validated_date).getTime();
      if (Number.isFinite(decision) && Number.isFinite(validated)) {
        weeksTaken = Math.round((decision - validated) / (1000 * 60 * 60 * 24 * 7));
      }
    }

    return {
      ...app,
      weeksTaken,
      distanceMeters: app.distance,
    };
  });

  return NextResponse.json({ applications: enriched ?? [] });
}

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase";
import { PlanningApproval } from "@/app/types";

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function fetchPlanningPortalApprovals(
  localAuthority: string
): Promise<PlanningApproval[]> {
  const mockApprovals: PlanningApproval[] = [
    {
      application_id: "APP001",
      site_name: "123 High Street",
      latitude: 51.5074,
      longitude: -0.1278,
      status: "approved",
      units: 12,
      approval_date: "2024-01-15",
      decision_timeline_days: 45,
      conditions: ["Materials to be agreed", "Landscaping plan required"],
      developer: "Example Developer Ltd",
    },
    {
      application_id: "APP002",
      site_name: "456 Main Road",
      latitude: 51.5084,
      longitude: -0.1268,
      status: "approved",
      units: 8,
      approval_date: "2024-01-10",
      decision_timeline_days: 38,
      conditions: [],
      developer: "Another Developer",
    },
  ];

  void localAuthority;
  return mockApprovals;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const siteId = searchParams.get("siteId");
    const radiusKm = parseInt(searchParams.get("radiusKm") || "0.5", 10);

    if (!siteId) {
      return NextResponse.json({ error: "siteId parameter required" }, { status: 400 });
    }

    const { data: site, error: siteError } = await supabaseAdmin
      .from("sites")
      .select("latitude, longitude, local_authority")
      .eq("id", siteId)
      .single();

    if (siteError || !site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const cacheKey = `approvals_${site.local_authority}_${Math.floor(
      Date.now() / (24 * 60 * 60 * 1000)
    )}`;
    const { data: cached } = await supabaseAdmin
      .from("cache")
      .select("data")
      .eq("key", cacheKey)
      .single();

    let approvals: PlanningApproval[] = [];

    if (cached) {
      approvals = cached.data;
    } else {
      approvals = await fetchPlanningPortalApprovals(site.local_authority);
      await supabaseAdmin.from("cache").insert({
        key: cacheKey,
        data: approvals,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
    }

    const nearby = approvals
      .map((approval) => ({
        ...approval,
        distance_km: calculateDistance(
          site.latitude,
          site.longitude,
          approval.latitude,
          approval.longitude
        ),
      }))
      .filter((approval) => approval.distance_km <= radiusKm)
      .sort((a, b) => a.distance_km - b.distance_km)
      .slice(0, 20);

    return NextResponse.json({
      success: true,
      count: nearby.length,
      approvals: nearby,
      site: {
        id: siteId,
        latitude: site.latitude,
        longitude: site.longitude,
        local_authority: site.local_authority,
      },
    });
  } catch (error) {
    console.error("Error fetching approvals:", error);
    return NextResponse.json(
      { error: "Failed to fetch approvals", details: String(error) },
      { status: 500 }
    );
  }
}

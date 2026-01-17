import { NextRequest, NextResponse } from "next/server";
import { fetchPlanningConstraints } from "@/app/lib/planningDataClient";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "lat and lng parameters are required" },
      { status: 400 }
    );
  }

  try {
    const constraints = await fetchPlanningConstraints(lat, lng);
    return NextResponse.json({
      location: { lat, lng },
      constraints,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const LANDTECH_API_BASE = "https://app.land.tech/api";
const LANDTECH_API_KEY = process.env.LANDTECH_API_KEY;

export type LandTechPlanningApplication = Record<string, any>;

export async function getPlanningForPostcode(
  postcode: string
): Promise<LandTechPlanningApplication[]> {
  const trimmed = postcode.trim();
  if (!trimmed) return [];

  if (!LANDTECH_API_KEY) {
    console.warn("LandTech disabled: missing LANDTECH_API_KEY");
    return [];
  }

  const res = await fetch(
    `${LANDTECH_API_BASE}/planning_applications?postcode=${encodeURIComponent(trimmed)}`,
    {
      headers: { Authorization: `Bearer ${LANDTECH_API_KEY}` },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("LandTech planning fetch failed");
  }

  const data = await res.json();
  return data?.results ?? [];
}

/**
 * Planning Data API client for point-based constraint lookups.
 */

export async function fetchPlanningConstraints(
  latitude: number,
  longitude: number
): Promise<string[]> {
  try {
    const url = `https://www.planning.data.gov.uk/entity.json?geometry=POINT(${longitude}%20${latitude})&geometry_relation=intersects&limit=100`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    if (!data?.entities || data.entities.length === 0) {
      return [];
    }

    const constraintMap: Record<string, string> = {
      "conservation-area": "conservation_area",
      "listed-building": "listed_building_nearby",
      "article-4-direction": "article_4_direction",
      "tree-preservation-order": "TPO",
      "tree-preservation-zone": "TPO",
      "ancient-woodland": "ancient_woodland",
      "flood-zone-2": "flood_zone_2",
      "flood-zone-3": "flood_zone_3",
      "area-of-outstanding-natural-beauty": "AONB",
      "national-park": "national_park",
  "green-belt": "green_belt",
  "site-of-special-scientific-interest": "SSSI",
  "coal-mining-area": "mining_legacy",
  "coal-mining-referral-area": "mining_legacy",
  "mining-area": "mining_legacy",
  "development-high-risk-area": "mining_legacy",
};

    const constraints = new Set<string>();

    data.entities.forEach((entity: any) => {
      const dataset = entity.dataset || "";
      const mappedConstraint = constraintMap[dataset];
      if (mappedConstraint) {
        constraints.add(mappedConstraint);
      }
    });

    return Array.from(constraints);
  } catch (error) {
    console.error("Error fetching planning constraints:", error);
    return [];
  }
}

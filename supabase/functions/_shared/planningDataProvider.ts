export type PlanningApplication = {
  reference: string;
  address?: string;
  decision?: string;
  status?: string;
  decision_reason?: string;
  received_date?: string;
};

export type PlanningConstraints = {
  raw: any; // full provider payload for provenance
  applications: PlanningApplication[];
  likelyObjections: {
    reference: string;
    reason: string;
  }[];
  provider: "planningapi_uk" | "landtech";
  providerMeta?: Record<string, unknown>;
};

export type ProviderInput = {
  postcode: string;
  lat?: number;
  lon?: number;
};

export async function fetchPlanningData(input: ProviderInput): Promise<PlanningConstraints> {
  const primary = Deno.env.get("PLANNING_PRIMARY") || "planningapi_uk";

  if (primary === "landtech") {
    return fetchFromLandTech(input);
  }

  // default
  return fetchFromPlanningApiUk(input);
}

// ---------- PlanningAPI UK adapter ----------

async function fetchFromPlanningApiUk(input: ProviderInput): Promise<PlanningConstraints> {
  const baseUrl = Deno.env.get("PLANNING_API_BASE_URL") ?? "https://api.planningapi.uk/v1";
  const apiKey = Deno.env.get("PLANNING_API_KEY");
  if (!apiKey) throw new Error("PLANNING_API_KEY not set");

  const url = `${baseUrl}/lookup?address=${encodeURIComponent(input.postcode)}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PlanningAPI UK error ${res.status}: ${text}`);
  }

  const data = await res.json();

  const applications: PlanningApplication[] = (data.applications ?? []).map((app: any) => ({
    reference: app.reference ?? "",
    address: app.address,
    decision: app.decision,
    status: app.status,
    decision_reason: app.decision_reason,
    received_date: app.received_date,
  }));

  const refusals = applications.filter((app) => {
    const d = (app.decision ?? "").toLowerCase();
    const s = (app.status ?? "").toLowerCase();
    return d.includes("refus") || s.includes("refus");
  });

  const likelyObjections = refusals.map((app) => ({
    reference: app.reference,
    reason: app.decision_reason || app.decision || "Refused application",
  }));

  return {
    raw: data,
    applications,
    likelyObjections,
    provider: "planningapi_uk",
    providerMeta: {
      source: "PlanningAPI UK",
      fetchedAt: new Date().toISOString(),
    },
  };
}

// ---------- LandTech adapter (stub for now) ----------

async function fetchFromLandTech(input: ProviderInput): Promise<PlanningConstraints> {
  const baseUrl = Deno.env.get("LANDTECH_BASE_URL") ?? "https://developers.land.tech";
  const apiKey = Deno.env.get("LANDTECH_API_KEY");
  if (!apiKey) throw new Error("LANDTECH_API_KEY not set");

  // TODO: Replace with real LandTech planning endpoint + lat/lon usage
  const url = `${baseUrl}/openapi/planning-applications?postcode=${encodeURIComponent(
    input.postcode,
  )}`;

  const res = await fetch(url, {
    headers: {
      "X-API-Key": apiKey,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LandTech error ${res.status}: ${text}`);
  }

  const data = await res.json();

  const applications: PlanningApplication[] = (data.applications ?? []).map((app: any) => ({
    reference: app.reference ?? "",
    address: app.site_address,
    decision: app.decision,
    status: app.status,
    decision_reason: app.decision_reason,
    received_date: app.received_date,
  }));

  const refusals = applications.filter((app) => {
    const d = (app.decision ?? "").toLowerCase();
    const s = (app.status ?? "").toLowerCase();
    return d.includes("refus") || s.includes("refus");
  });

  const likelyObjections = refusals.map((app) => ({
    reference: app.reference,
    reason: app.decision_reason || app.decision || "Refused application",
  }));

  return {
    raw: data,
    applications,
    likelyObjections,
    provider: "landtech",
    providerMeta: {
      source: "LandTech API",
      fetchedAt: new Date().toISOString(),
    },
  };
}

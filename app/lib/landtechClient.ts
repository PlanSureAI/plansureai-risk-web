const LANDTECH_BASE_URL = "https://app.land.tech/api";

export type LandTechAuthStatus = {
  user: { state: "active" | "expired" | "blocked" };
};

export type ParcelIdsResponse = {
  parcel_ids: string[];
};

export type ParcelDetailsResponse = {
  data?: {
    parcel_id: string;
    parcel_size?: number;
    developed_area_ratio?: number;
    titles?: string[] | null;
    properties?: string[];
    planning_apps?: string[];
  };
};

export type PlanningApplicationResponse = {
  data?: {
    planning_application_id: string;
    status_derived?: "Approved" | "Rejected" | "Pending" | "Withdrawn" | "Unknown";
    classification?: "RESIDENTIAL" | "COMMERCIAL" | "MIXED_USE" | "OTHER";
    size?: number;
    found_num_dwellings?: boolean;
    tags?: string[] | null;
  };
};

export type PowerDistanceContext = {
  nearest_asset_type: string | null;
  distance_m: number | null;
};

export type RepdFeature = {
  id: string;
  properties?: {
    technology_type?: string;
    installed_capacity_mw?: number;
    status?: string;
  };
};

export type RepdResponse = {
  data?: { feature: RepdFeature };
};

export class LandTechClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${LANDTECH_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": this.apiKey,
        ...(init.headers || {}),
      },
    });

    if (res.status === 403) {
      throw new Error("LandTech: forbidden (check API key, plan, or IP allow-list).");
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`LandTech: ${res.status} ${res.statusText} ${text}`);
    }

    return res.json() as Promise<T>;
  }

  // 1. Auth status
  async getAuthStatus(): Promise<LandTechAuthStatus> {
    return this.request<LandTechAuthStatus>("/status/auth");
  }

  // 2. Advanced parcel search (beta)
  async searchParcelsAdvanced(body: unknown): Promise<ParcelIdsResponse> {
    return this.request<ParcelIdsResponse>("/parcels/advanced_search", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  // 3. Parcel details by ID
  async getParcel(parcelId: string): Promise<ParcelDetailsResponse> {
    return this.request<ParcelDetailsResponse>(`/parcels/${parcelId}`);
  }

  // 4. Planning application by ID (e.g. "E07000112+Y18/1381/FH")
  async getPlanningApplication(planningApplicationId: string): Promise<PlanningApplicationResponse> {
    return this.request<PlanningApplicationResponse>(
      `/planning_applications/${encodeURIComponent(planningApplicationId)}`,
    );
  }

  // 5. REPD single site by ID
  async getRepdSite(repdId: string): Promise<RepdResponse> {
    return this.request<RepdResponse>(`/renewable_energy_planning_db/${repdId}`);
  }
}

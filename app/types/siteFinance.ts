// Domain shapes built on top of Database['public']['Tables']['sites']['Row']

export type SchemeProfile = {
  country: "England" | "Scotland" | "Wales" | "NI";
  localAuthority: string | null;
  unitsTotal: number | null;
};

export type SponsorProfile = {
  entityType: "Ltd" | "LLP" | "Other" | null;
  ukRegistered: boolean | null;
  smeHousebuilder: boolean | null;
  completedUnits: number | null;
  yearsActive: number | null;
};

export type SitePlanningFinance = {
  landControl: "owned" | "option" | "conditional" | null;
  majorityControl: boolean | null;
  wouldStallWithoutFunding: boolean | null;
};

export type SustainabilityProfile = {
  fossilFuelFree: boolean | null;
  targetSAP: number | null;
  targetEPCBand: "A" | "B" | "C" | "D" | null;
  mmcUsed: boolean | null;
  realLivingWage: boolean | null;
  lighthouseCharity: boolean | null;
};

export type FinanceViability = {
  gdv: number | null;
  totalCost: number | null;
  profitOnCostPct: number | null;
  loanAmount: number | null;
  ltcPercent: number | null;
  ltgdvPercent: number | null;
};

export type EligibilityStatus = "Eligible" | "Borderline" | "NotEligible";

export type EligibilityResult = {
  productId:
    | "homeBuildingFund"
    | "smeAccelerator"
    | "greenerHomesAlliance"
    | "housingGrowthPartnership";
  status: EligibilityStatus;
  passedCriteria: string[];
  failedCriteria: string[];
};

export type SiteFinanceProfile = {
  scheme: SchemeProfile;
  sponsor: SponsorProfile;
  planning: SitePlanningFinance;
  sustainability: SustainabilityProfile;
  viability: FinanceViability;
};

// Derive a SiteFinanceProfile from a Supabase row without altering generated types.
export function mapSiteFinanceProfile(row: Record<string, any>): SiteFinanceProfile {
  return {
    scheme: {
      country: (row.country ?? row.scheme?.country ?? "England") as SchemeProfile["country"],
      localAuthority: row.local_planning_authority ?? row.localAuthority ?? null,
      // fall back to proposed_units if you want finance to use that
      unitsTotal: row.proposed_units ?? row.scheme?.unitsTotal ?? row.unitsTotal ?? null,
    },
    sponsor: {
      entityType: row.entityType ?? row.sponsor?.entityType ?? null,
      ukRegistered: row.sponsor_uk_registered ?? row.sponsor?.ukRegistered ?? null,
      smeHousebuilder: row.sponsor_sme_housebuilder ?? row.sponsor?.smeHousebuilder ?? null,
      completedUnits: row.sponsor_completed_units ?? row.sponsor?.completedUnits ?? null,
      yearsActive: row.sponsor_years_active ?? row.sponsor?.yearsActive ?? null,
    },
    planning: {
      landControl: row.land_control ?? row.planning?.landControl ?? null,
      majorityControl: row.majority_control ?? row.planning?.majorityControl ?? null,
      wouldStallWithoutFunding:
        row.would_stall_without_funding ?? row.planning?.wouldStallWithoutFunding ?? null,
    },
    sustainability: {
      fossilFuelFree: row.fossil_fuel_free ?? row.sustainability?.fossilFuelFree ?? null,
      targetSAP: row.target_sap ?? row.sustainability?.targetSAP ?? null,
      targetEPCBand:
        (row.target_epc_band ?? row.sustainability?.targetEPCBand ?? null) as
          | SustainabilityProfile["targetEPCBand"]
          | null,
      mmcUsed: row.mmc_used ?? row.sustainability?.mmcUsed ?? null,
      realLivingWage: row.real_living_wage ?? row.sustainability?.realLivingWage ?? null,
      lighthouseCharity: row.lighthouse_charity_support ?? row.sustainability?.lighthouseCharity ?? null,
    },
    viability: {
      gdv: row.gdv != null ? Number(row.gdv) : row.viability?.gdv ?? null,
      totalCost: row.total_cost != null ? Number(row.total_cost) : row.viability?.totalCost ?? null,
      profitOnCostPct:
        row.profit_on_cost != null ? Number(row.profit_on_cost) : row.viability?.profitOnCostPct ?? null,
      loanAmount: row.loan_amount != null ? Number(row.loan_amount) : row.viability?.loanAmount ?? null,
      ltcPercent: row.ltc_percent != null ? Number(row.ltc_percent) : row.viability?.ltcPercent ?? null,
      ltgdvPercent:
        row.ltgdv_percent != null ? Number(row.ltgdv_percent) : row.viability?.ltgdvPercent ?? null,
    },
  };
}

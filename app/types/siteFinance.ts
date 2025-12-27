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

export type FinancePack = {
  scheme: {
    id: string;
    name: string | null;
    address: string | null;
    localAuthority: string | null;
    country: string;
    unitsTotal: number | null;
    planningStatus: string | null;
    landControl: string | null;
  };
  viability: {
    gdv: number | null;
    totalCost: number | null;
    profitOnCostPct: number | null;
    loanAmount: number | null;
    ltcPercent: number | null;
    ltgdvPercent: number | null;
  };
  sustainability: {
    fossilFuelFree: boolean | null;
    targetSAP: number | null;
    targetEPCBand: string | null;
    mmcUsed: boolean | null;
    realLivingWage: boolean | null;
    lighthouseCharity: boolean | null;
  };
  sponsor: {
    smeHousebuilder: boolean | null;
    ukRegistered: boolean | null;
    entityType: string | null;
    completedUnits: number | null;
    yearsActive: number | null;
  };
  funding: {
    results: EligibilityResult[];
  };
};

export type FinancePackCsvRow = {
  site_id: string;
  site_name: string | null;
  address: string | null;
  local_authority: string | null;
  country: string;
  units_total: number | null;
  planning_status: string | null;
  land_control: string | null;
  gdv: number | null;
  total_cost: number | null;
  profit_on_cost_pct: number | null;
  loan_amount: number | null;
  ltc_percent: number | null;
  ltgdv_percent: number | null;
  sme_housebuilder: boolean | null;
  uk_registered: boolean | null;
  target_sap: number | null;
  fossil_fuel_free: boolean | null;
  mmc_used: boolean | null;
  real_living_wage: boolean | null;
  lighthouse_charity: boolean | null;
  hbf_status: string | null;
  gha_status: string | null;
};

export function packToCsvRow(pack: FinancePack): FinancePackCsvRow {
  const hbf = pack.funding.results.find((r) => r.productId === "homeBuildingFund");
  const gha = pack.funding.results.find((r) => r.productId === "greenerHomesAlliance");

  return {
    site_id: pack.scheme.id,
    site_name: pack.scheme.name,
    address: pack.scheme.address,
    local_authority: pack.scheme.localAuthority,
    country: pack.scheme.country,
    units_total: pack.scheme.unitsTotal,
    planning_status: pack.scheme.planningStatus,
    land_control: pack.scheme.landControl,
    gdv: pack.viability.gdv,
    total_cost: pack.viability.totalCost,
    profit_on_cost_pct: pack.viability.profitOnCostPct,
    loan_amount: pack.viability.loanAmount,
    ltc_percent: pack.viability.ltcPercent,
    ltgdv_percent: pack.viability.ltgdvPercent,
    sme_housebuilder: pack.sponsor.smeHousebuilder,
    uk_registered: pack.sponsor.ukRegistered,
    target_sap: pack.sustainability.targetSAP,
    fossil_fuel_free: pack.sustainability.fossilFuelFree,
    mmc_used: pack.sustainability.mmcUsed,
    real_living_wage: pack.sustainability.realLivingWage,
    lighthouse_charity: pack.sustainability.lighthouseCharity,
    hbf_status: hbf?.status ?? null,
    gha_status: gha?.status ?? null,
  };
}

export type NextMove = "proceed" | "hold" | "walk_away";

export type NextMoveResult = {
  move: NextMove;
  reason: string;
};

export function getNextMove(
  aiOutcome: string | null,
  eligibilityResults: EligibilityResult[] | null
): NextMoveResult {
  const results = eligibilityResults ?? [];

  const hbf = results.find((r) => r.productId === "homeBuildingFund");
  const gha = results.find((r) => r.productId === "greenerHomesAlliance");

  const anyFundingBorderlineOrBetter =
    [hbf, gha].some(
      (r) => r && (r.status === "Eligible" || r.status === "Borderline")
    );

  // Walk away
  if (aiOutcome === "do_not_proceed") {
    return {
      move: "walk_away",
      reason:
        "Planning risk looks high and the scheme currently fails key funding checks, so time and cash are likely better spent on other sites.",
    };
  }

  // Proceed
  if (aiOutcome === "proceed" && anyFundingBorderlineOrBetter) {
    return {
      move: "proceed",
      reason:
        "Planning risk looks manageable and at least one funding route (e.g. HBF or GHA) is in scope, so it is worth progressing to consultants and lenders.",
    };
  }

  // Hold & clarify
  return {
    move: "hold",
    reason:
      "There are some promising signals but also gaps in planning or funding fit. Clarify units, sustainability targets, or land control before committing more spend.",
  };
}

export function getFrictionHint(
  objectionLikelihood: string | null,
  aiOutcome: string | null
): string | null {
  const lower = objectionLikelihood?.toLowerCase() ?? "";
  const highObjection = lower.includes("high") || lower.includes("moderate");

  if (aiOutcome === "do_not_proceed") {
    return "Planning risk is flagged as high; expect prolonged discussions and potentially sunk costs before a clear refusal or redesign.";
  }

  if (aiOutcome === "conditional" || highObjection) {
    return "Objections and conditions are likely, which usually means extra months in planning and higher finance interest — treat this as a high-friction site.";
  }

  return null;
}

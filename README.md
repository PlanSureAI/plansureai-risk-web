## LandTech integration

### What was added
- Added a **typed LandTech API client** in `app/lib/landtechClient.ts` with helper methods for:
  - Auth status (`GET /status/auth`)
  - Advanced parcel search (`POST /parcels/advanced_search`)
  - Parcel details (`GET /parcels/{parcel_id}`)
  - Planning applications (`GET /planning_applications/{id}`)
  - REPD site lookups (`GET /renewable_energy_planning_db/{repd_id}`)
- All methods share consistent error handling (403 → explicit error; non‑OK → status + body text).
- Added **LandTech mapping helpers** in `app/lib/landtechMappers.ts` to convert raw API responses into internal site contexts:
  - `SitePlanningContext` (parcel, titles, UPRNs, planning app IDs)
  - `SitePlanningApplicationSummary` (status, classification, dwellings, tags)
  - `SiteGridContext` (nearest asset type + distance)
  - `SiteRepdContext` (technology, capacity, status)
- Added an **example server action** in `app/lib/getSiteLandTechProfile.ts` that stitches these pieces together (auth check, parcel search, parcel detail mapping, optional planning app fetch, placeholder grid/REPD context).

### Next steps
- Set `LANDTECH_API_KEY` in the runtime environment (Vercel/Supabase Edge).
- Call the client from server actions / Edge Functions to populate per‑site LandTech context.
- Wire a `planningDataProvider.ts` (or similar adapter) that:
  - Accepts a site geometry (polygon/point),
  - Uses `LandTechClient` to fetch parcel + planning + REPD data,
  - Returns a single `SiteRiskProfile` object that PlanSureAI’s risk and funding pipelines can consume.

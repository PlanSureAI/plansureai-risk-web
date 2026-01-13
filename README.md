Here’s a single, copy‑paste‑ready README block that wraps your existing LandTech section and adds the extra context.

---

## PlanSureAI overview

PlanSureAI is a **site‑level risk and funding engine** for small residential schemes in England and Wales, designed for brokers, lenders, and experienced developers.  It ingests planning, title, and grid data for a site, then generates a structured risk profile and lender‑grade funding pack.[1][2]

## Architecture

- **Frontend**: Next.js app using the App Router, server actions, and React Server Components.[3]
- **Backend**: Supabase Postgres for core data (sites, schemes, users, documents) plus Supabase Auth for developer/broker sign‑in.[4][5]
- **Data sources**:  
  - LandTech API for parcels, planning applications, and REPD/grid context.[6]
  - Local planning authority documents (PDF scraping / parsing).[1]
  - Internal heuristics for risk scoring and lender packaging.

## Environment variables

Copy `.env.example` to `.env.local` and fill in real values for local dev. Configure the same secrets in your hosting provider for production.[7][8] Never commit real secrets.

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # server-only

# OpenAI / LLMs
OPENAI_API_KEY=...

# LandTech
LANDTECH_API_KEY=...

# App config
NEXT_PUBLIC_APP_URL=https://plansure.ai

# QStash document processing
QSTASH_TOKEN=...
QSTASH_CURRENT_SIGNING_KEY=...
QSTASH_NEXT_SIGNING_KEY=...
PROCESS_DOCUMENT_URL=https://www.plansureai.com/api/documents/process
```

## AI Gateway

PlanSureAI can use Vercel AI Gateway for server-side AI calls (AI SDK, route handlers, edge functions). Create a key under Vercel -> AI Gateway -> API Keys and set it in your environment. See Vercel's Getting Started docs: https://vercel.com/docs/ai-gateway/getting-started

```bash
AI_GATEWAY_API_KEY=***
```

Never commit, log, or use the AI Gateway key in client-side/browser code. Treat it like the Supabase service role key.

## Planning constraints API

Quick reference:

```text
GET /api/planning-constraints?lat={latitude}&lng={longitude}
```

Parameters:

- `lat` (required): Latitude (UK bounds: 49.9 to 60.9)
- `lng` (required): Longitude (UK bounds: -8.2 to 1.8)
- `dataset`: Single dataset filter (e.g., `conservation-area`)
- `datasets`: Multiple datasets, comma-separated (e.g., `listed-building,ancient-woodland`)
- `defaults`: Set to `false` to disable default dataset filtering (slow)
- `limit`: Max results per dataset (default: 50)
- `offset`: Pagination offset
- `geometry_relation`: Spatial relationship (default: `within`)

Response format:

```json
{
  "location": { "lat": 51.5074, "lng": -0.1278 },
  "datasets": ["conservation-area", "listed-building"],
  "limit": 50,
  "offset": 0,
  "count": 3,
  "constraints": [
    {
      "entity": 7010000744,
      "dataset": "article-4-direction-area",
      "name": "Canterbury and surrounding area",
      "reference": "73412",
      "description": null,
      "geometry": "MULTIPOLYGON(...)",
      "point": "POINT (1.076439 51.294709)",
      "organisation_entity": "75",
      "entry_date": "2024-01-01",
      "start_date": "2024-01-01",
      "end_date": null
    }
  ],
  "sources": [
    {
      "dataset": "article-4-direction-area",
      "url": "https://www.planning.data.gov.uk/entity.json?...",
      "count": 5943,
      "links": { "first": "http://...", "last": "http://..." }
    }
  ],
  "metadata": {
    "query_time_ms": 147,
    "warning": "Unfiltered query (defaults=false) may be slow. Consider specifying datasets for better performance."
  }
}
```

Notes:

- Cache status is returned via the `X-Cache` response header (`HIT` or `MISS`).
- `defaults=false` removes dataset filtering and can be significantly slower.

Status codes:

- `200`: Success
- `400`: Invalid parameters (e.g., out-of-UK coordinates)
- `504`: Upstream timeout (Planning Data API took >10s)

## Document processing pipeline

Planning documents are uploaded to Supabase Storage and processed asynchronously via QStash. The
pipeline creates a `document_jobs` record, enqueues a worker job, and updates the job with
progress plus the generated summary/analysis.

Required runtime config:

- `QSTASH_TOKEN`
- `QSTASH_CURRENT_SIGNING_KEY`
- `QSTASH_NEXT_SIGNING_KEY`
- `PROCESS_DOCUMENT_URL`

Migration required: `20260213002000_create_document_jobs.sql`

Tier-1 default datasets:

- `conservation-area`
- `listed-building`
- `article-4-direction-area`
- `tree-preservation-zone`
- `flood-risk-zone`

## Core user flows

- **Create or import a site**  
  - Draw or upload site geometry, attach basic scheme info, and persist to Supabase.[3][4]

- **Run planning & risk analysis**  
  - Call a `planningDataProvider` that enriches the site with LandTech parcels, planning history, REPD/grid context, and LPA docs.[6][1]
  - Pipe the enriched context through PlanSureAI’s risk and funding pipelines to produce a `SiteRiskProfile`.  

- **Generate lender pack**  
  - Produce a structured JSON/PDF output that summarises planning position, key risks, mitigations, and a funding case that a lender or broker can review.[2]

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

- Set `LANDTECH_API_KEY` in the runtime environment (Vercel/Supabase Edge).[8][6]
- Call the client from server actions / Edge Functions to populate per‑site LandTech context.  
- Wire a `planningDataProvider.ts` (or similar adapter) that:  
  - Accepts a site geometry (polygon/point),  
  - Uses `LandTechClient` to fetch parcel + planning + REPD data,  
  - Returns a single `SiteRiskProfile` object that PlanSureAI’s risk and funding pipelines can consume.

## Non‑advice disclaimer

PlanSureAI outputs are **decision‑support only** and do not constitute planning, legal, valuation, or financial advice.  Any funding or investment decision should be based on independent professional advice and full lender due‑diligence, including formal valuations and legal reports on title.[9][10]

[1](https://www.lexisnexis.co.uk/legal/property-law/commercial-finance/due-diligence-reporting-to-lender)
[2](https://therightmortgage.co.uk/the-mortgage-lender-how-to-package-your-case-for-success/)
[3](https://blog.logrocket.com/build-full-stack-app-next-js-supabase/)
[4](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
[5](https://supabase.com/docs/guides/auth/quickstarts/nextjs)
[6](https://docs-7zade0ykj-supabase.vercel.app/docs/guides/getting-started/quickstarts/nextjs)
[7](https://github.com/vercel/next.js/blob/canary/examples/with-supabase/README.md)
[8](https://supabase.com/docs/guides/functions/secrets)
[9](http://www.fca.org.uk/publication/research/buying-a-mortgage-without-advice.pdf)
[10](https://www.nicheadvice.co.uk/mortgages-3/product-research-disclaimer-wording/)
[11](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/images/90403828/cbbcca9f-5005-4a05-988c-5d5beb819f6c/Screenshot-2025-12-27-at-10.28.12.jpg)
[12](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/images/90403828/dd9d3057-1158-406f-90d4-5a03c5858ce4/Screenshot-2025-12-27-at-10.28.27.jpg)
[13](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/90403828/c369a5ab-f422-4252-8858-24282d248f31/paste.txt)
[14](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/images/90403828/a7f80cb5-2d61-4e51-8a52-b8f68c1b4f1b/Screenshot-2025-12-27-at-11.40.06.jpg)
[15](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/images/90403828/16702cc4-76e4-481b-bbed-b4a6f7889b4f/Screenshot-2025-12-27-at-11.38.06.jpg)
[16](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/90403828/b71b0dad-3bd8-4281-b450-140fed624a85/paste.txt)
[17](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/images/90403828/32620479-7e22-46b6-8674-2052690f1737/Screenshot-2025-12-27-at-11.40.22.jpg)
[18](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/images/90403828/6a09e98b-bab4-4b73-b7e5-93f77786f7f0/Screenshot-2025-12-27-at-11.40.34.jpg)
[19](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/images/90403828/4b8a30c5-68c5-4551-876c-aa0061bd45f6/Screenshot-2025-12-27-at-11.41.18.jpg)
[20](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/images/90403828/e6815096-4955-42e5-8af1-70fb6aaa3ded/Screenshot-2025-12-27-at-11.40.49.jpg)
[21](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/images/90403828/13a329f0-7836-4130-8c04-2fe2a6d92f6f/Screenshot-2025-12-27-at-11.40.59.jpg)
[22](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/images/90403828/0ccc1022-1e96-41b0-9291-de6de3f4868b/Screenshot-2025-12-27-at-11.42.07.jpg)
[23](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/images/90403828/44e80c7a-b976-4b1f-83af-f5091d0c2ed6/Screenshot-2025-12-27-at-11.41.40.jpg)
[24](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/images/90403828/34570d25-6635-4777-abb0-44572c922464/Screenshot-2025-12-27-at-13.08.43.jpg)
[25](https://www.reddit.com/r/HousingUK/comments/y6cord/conveyancer_disclaimer_should_i_be_worried/)
[26](https://global.lockton.com/gb/en/news-insights/uk-finance-mortgage-lenders-handbook-risks-and-obligations-under-part-3)
[27](https://makerkit.dev/docs/next-supabase/configuration/environment-variables)
[28](https://insightplus.bakermckenzie.com/bm/financial-services-regulatory/united-kingdom-bnpl-regulation-key-regulatory-and-compliance-issues-for-lenders)
[29](https://fabwebstudio.com/blog/build-a-blazing-fast-scalable-app-with-next-js-and-supabase-step-by-step-tutorial)
[30](https://makerkit.dev/docs/next-supabase-turbo/configuration/environment-variables)
[31](https://github.com/SamuelSackey/nextjs-supabase-example)
[32](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)
[33](https://www.reddit.com/r/Supabase/comments/18x0zz1/nextjs_supabase_example_project_for_oauth/)
[34](https://anotherwrapper.com/blog/supabase-next-js)

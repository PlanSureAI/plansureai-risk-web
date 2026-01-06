# Phase 1 (next 6-9 months): Data + Verifiable History

Focus on verifiable property timelines (build date -> EPCs -> permissions -> improvements).

## 1. Integrate authoritative sources

### 1.1 Land Registry, title and tenure

**Goal:** Pull title, tenure and restriction info, then normalise into the existing property model (Supabase/Postgres).

**Tasks:**
- Identify and document all Land Registry data sources (APIs, bulk datasets, commercial partners).
- Define a unified `properties` schema that supports:
  - UPRN / title number mapping
  - Tenure (freehold/leasehold/commonhold)
  - Charges / restrictions / notices
  - Ownership history (where available)
- Implement ETL jobs to:
  - Ingest raw Land Registry data into staging tables.
  - Clean and normalise into canonical `properties` and `property_owners` tables.
  - Handle incremental updates (new titles, changes, corrections).
  - Add internal admin UI to inspect raw vs normalised records for QA.

### 1.2 EPC register and planning / open data

**Goal:** Build a chronological “asset timeline” from build date -> all EPCs -> planning approvals -> enforcement -> alterations.

**Tasks:**
- EPC:
  - Integrate the UK EPC register (open data and/or APIs).
  - Map EPC records to property IDs (UPRN/title/address matching).
  - Store key fields: rating, date, recommendations, floor area, property type.
- Planning / enforcement:
  - Integrate local authority planning portals / aggregated open-data feeds.
  - Normalise planning applications into a `planning_events` table:
    - Application ref, LPA, proposal text, status, decision date, conditions.
  - Capture enforcement actions and notices where exposed.
- Build a generic `asset_events` table to represent all events on a property:
  - `id`
  - `property_id`
  - `event_type` (e.g. `BUILD`, `EPC`, `PLANNING_APPLICATION`, `PLANNING_DECISION`, `ENFORCEMENT`, `REFURBISHMENT`, `TRANSACTION`, etc.)
  - `event_date`
  - `source_system` (e.g. `LAND_REGISTRY`, `EPC_REGISTER`, `LPA_API`, `USER_DECLARED`)
  - `raw_payload` (JSONB)
  - `created_at`, `updated_at`
- Implement a materialized view or API endpoint that returns a fully ordered “asset timeline” for a given property:
  - Sorted by `event_date` ascending.
  - Grouped by logical phases: build, performance, planning, improvements.

## 2. Design a “verifiable record” model

**Goal:** For each significant event (EPC, planning decision, major refurb), store both the raw document/JSON and a cryptographic proof, then periodically anchor batches on-chain.

### 2.1 Hashing events

**Tasks:**
- Extend `asset_events` with:
  - `content_hash` (e.g. SHA-256 of the canonical JSON representation).
  - `hash_algorithm` (default `SHA-256`).
- Implement a deterministic JSON canonicalisation function so that the same event always hashes to the same value.
- Backfill hashes for all existing events.

### 2.2 Blockchain anchoring

**Goal:** Periodically anchor batches of event hashes onto a public blockchain (e.g. Ethereum mainnet, Bitcoin, or an L2) via a minimal proof contract or transaction.

**Tasks:**
- Define an `anchoring_batches` table:
  - `id`
  - `chain` (e.g. `ETHEREUM_MAINNET`, `OPTIMISM`, `BITCOIN`)
  - `batch_root_hash` (Merkle root or batched hash)
  - `tx_hash`
  - `anchored_at`
  - `status` (`PENDING`, `CONFIRMED`, `FAILED`)
- Define an `event_anchor_links` table:
  - `id`
  - `asset_event_id`
  - `anchoring_batch_id`
- Implement a batcher service:
  - Periodically selects unanchored `asset_events`.
  - Builds a Merkle tree or batched hash from `content_hash` values.
  - Submits the root/batch hash on-chain using a simple proof contract or direct transaction data.
  - Stores `tx_hash`, updates `anchoring_batches.status`.
  - Links individual events to the batch via `event_anchor_links`.
- Expose an API to:
  - Show whether a given event is anchored.
  - Return the on-chain transaction and proof data necessary for external verification.

## 3. UX in PlansureAI: Property Ledger

**Goal:** Add a “Provenance” / **Property Ledger** tab per asset showing:
“Built 19XX -> EPC timeline -> planning events -> refurb works”, with clear anchored vs off-chain status.

### 3.1 UI design

**Features:**
- New `Property Ledger` tab in the property detail view.
- Timeline view:
  - Each event rendered as a card on a vertical timeline.
  - Event summary (type, date, key info).
  - Badges:
    - `Anchored on-chain` (green) when event has an `event_anchor_link`.
    - `Off-chain only` (grey) when not anchored yet.
- Drill-down modal:
  - Full event details from `raw_payload`.
  - Hash and anchoring data:
    - `content_hash`
    - Chain, `tx_hash`, anchored date
    - Link to blockchain explorer (where applicable).

### 3.2 API / backend requirements

**Endpoints:**
- `GET /properties/:id/ledger`
  - Returns an ordered list of events (`asset_events`) with:
    - Core event fields.
    - Anchoring status and transaction metadata.
- `GET /properties/:id/ledger/:event_id`
  - Returns full event details and verification information.

### 3.3 Outcome for 2026 narrative

By the end of Phase 1, PlansureAI should be able to:
- Show when a house was built, how its EPC rating has changed over time, and what planning/improvement events occurred.
- Indicate which of those records are cryptographically hashed and anchored on-chain, providing a verifiable provenance layer without needing to put full documents on a blockchain.

This underpins the 2026 vision in which blockchain “shows the house’s owners when it was built, how it has performed energetically, and what has changed”, while still fitting within current UK data and registry infrastructure.
This is intentionally implementation-oriented so you can start turning it into tickets (DB migrations, services, endpoints, UI) in your existing Next.js/Supabase stack.

## Implementation TODO

- [ ] Break Phase 1 into concrete tickets:
  - [ ] DB migrations (tables: properties, property_owners, asset_events, anchoring_batches, event_anchor_links).
  - [ ] ETL jobs/services for Land Registry, EPC register, planning data.
  - [ ] Ledger/anchoring services (hashing, batcher, on-chain anchor job).
  - [ ] Property Ledger API endpoints.
  - [ ] Property Ledger UI (tab, timeline, event detail modal).

- [ ] Align schema naming with Supabase conventions:
  - [ ] Table names: snake_case plural (e.g. `properties`, `asset_events`, `anchoring_batches`, `event_anchor_links`).[memory:43]
  - [ ] Column names: snake_case (e.g. `event_type`, `event_date`, `content_hash`, `hash_algorithm`, `source_system`).[memory:24]
  - [ ] Use `id` as primary key, `created_at` / `updated_at` as timestamptz with defaults where needed.
  - [ ] Mirror DB names in generated Supabase types and create domain mappers (e.g. `mapAssetEventRowToDomain`) to keep TypeScript shapes clean.[memory:38]

- [ ] Create initial migration files:
  - [ ] `supabase/migrations/<timestamp>_create_asset_events_and_anchoring.sql`
  - [ ] `supabase/migrations/<timestamp>_extend_properties_for_ledger.sql`

- [ ] Add stubs:
  - [ ] `lib/ledger/hashEvent.ts` – deterministic JSON + SHA-256 hashing.
  - [ ] `lib/ledger/anchorBatch.ts` – create anchoring batch + call chain adapter.
  - [ ] `app/api/properties/[id]/ledger/route.ts` – GET ledger for a property.
  - [ ] `app/(app)/properties/[id]/ledger/page.tsx` – Property Ledger tab UI.

- [ ] Before coding:
  - [ ] Confirm final table and column names in this doc.
  - [ ] Regenerate Supabase types (`npx supabase gen types typescript ...`) after migrations.
  - [ ] Wire new tables into your existing Site/Property domain types and risk pipeline where relevant.[memory:43]
2. How to break into tickets (suggested structure)
When you jump into your issue tracker / GitHub:

Ticket 1: Design & confirm Phase 1 DB schema

Output: updated PHASE1.md section with final table/column names and ERD screenshot.

Ticket 2: Create Phase 1 migrations

Output: Supabase migrations for asset_events, anchoring_batches, event_anchor_links, any properties tweaks; db push run and verified in Supabase UI.
​

Ticket 3: Implement ledger hashing service

Output: hashEvent helper, backfill script/server action to compute content_hash for existing events.

Ticket 4: Implement anchoring batcher skeleton

Output: cron/job or manual endpoint that groups unanchored events, creates anchoring_batches, and stores a placeholder tx_hash until the real chain adapter is plugged in.

Ticket 5: Property Ledger API + UI

Output: /properties/:id/ledger API and tab in the property view calling it and rendering the timeline.

## Ticket texts (ready to paste as issues)

- Design & confirm Phase 1 DB schema — Finalise tables/columns (properties, property_owners, asset_events, anchoring_batches, event_anchor_links), add an ERD screenshot, and update PHASE1.md with canonical names for tables and columns.
- Create Phase 1 migrations — Add `..._create_asset_events_and_anchoring.sql` and `..._extend_properties_for_ledger.sql`, then run `npx supabase db push` against the linked Supabase project and verify the new tables in the Supabase UI.
- Regenerate Supabase types and wire domain models — Regenerate TypeScript types from Supabase, then add domain mappers like `mapAssetEventRowToDomain` so app code never depends directly on raw generated types.
- Implement ledger hashing service — Implement `hashEvent.ts` for deterministic JSON + SHA-256 hashing, extend `asset_events` with `content_hash` and `hash_algorithm`, and add a backfill script/server action to populate hashes for existing rows.
- Implement anchoring batcher skeleton — Implement `anchorBatch.ts` and a cron/manual job to group unanchored events, create `anchoring_batches`, link `event_anchor_links`, and store a placeholder `tx_hash` until the real chain adapter is integrated.
- Build ETL jobs/services for Land Registry, EPC, and planning data — Create staging tables and ETL flows from Land Registry, EPC register, and planning/open-data sources into canonical properties and `asset_events`, reusing the existing ETL patterns from LandTech and the risk pipeline.
- Property Ledger API — Add `route.ts` for `/properties/:id/ledger` (and a detail route) that returns ordered events with anchoring metadata suitable for the Ledger UI.
- Property Ledger UI — Add a Ledger tab `page.tsx` in the property view, with a vertical timeline of events, anchored/off-chain badges, and an event detail modal to show full payload + proof info.
- Admin QA view (optional) — Add an internal admin page to compare raw vs normalised records and anchoring status for a property, to QA ETL and ledger behaviour before exposing the feature broadly.

## Branch plan (phase1-schema)

- Branch: `phase1-schema`.
- Slice order:
  - Design schema in PHASE1.md.
  - Write migrations.
  - Run `npx supabase db push` against the linked project.
  - Regenerate Supabase types and add the `asset_events` mapper.
- After merge: scaffold `/properties/:id/ledger` API and a minimal Ledger tab wired to `asset_events` so you can see real rows flowing before implementing hashing and on-chain anchoring.

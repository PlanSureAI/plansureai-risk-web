create extension if not exists pg_trgm;

-- Stable enums
create type planning_decision as enum (
  'granted',
  'refused',
  'split_decision',
  'withdrawn',
  'no_decision',
  'appeal_allowed',
  'appeal_dismissed'
);

create type planning_status as enum (
  'received',
  'validated',
  'under_consideration',
  'awaiting_decision',
  'decided',
  'appealed',
  'unknown'
);

create type party_role as enum (
  'applicant',
  'agent',
  'objector',
  'supporter',
  'parish_council',
  'statutory_consultee',
  'case_officer',
  'committee_member',
  'inspector'
);

create type event_type as enum (
  'application_submitted',
  'application_validated',
  'neighbour_consultation',
  'site_visit',
  'officer_report_published',
  'committee_meeting',
  'decision_issued',
  'appeal_lodged',
  'appeal_decided'
);

create type document_type as enum (
  'officer_report',
  'committee_report',
  'decision_notice',
  'appeal_decision',
  'committee_minutes',
  'other'
);

create type document_source as enum (
  'council_portal',
  'planning_inspectorate',
  'aggregator',
  'other'
);

create type comment_role as enum (
  'neighbour',
  'parish_council',
  'statutory_consultee',
  'applicant',
  'other'
);

-- Issue tags as lookup (extendable)
create table if not exists issue_tag (
  id          serial primary key,
  code        text unique not null, -- e.g. 'LANDSCAPE_AONB_COUNTRYSIDE'
  description text
);

-- Site
create table if not exists site (
  id            uuid primary key default gen_random_uuid(),
  uprns         text[] not null,
  site_centroid geometry(point, 4326),
  site_polygon  geometry(geometry, 4326),
  created_at    timestamptz not null default now()
);

-- Application
alter table if exists application drop constraint if exists application_pkey;
create table if not exists application (
  id                         uuid primary key default gen_random_uuid(),
  lpa_code                   text not null,               -- e.g. 'CORNWALL', 'BIRMINGHAM'
  lpa_reference              text not null,               -- council ref
  planning_data_id           text,                        -- planning.data.gov.uk ID
  aggregator_application_id  text,                        -- PlanningAPI/Searchland ID
  address_text               text,
  description_text           text,
  development_type           text,                        -- keep free-form for now
  site_id                    uuid references site(id),
  received_date              date,
  validated_date             date,
  decision_date              date,
  status                     planning_status not null default 'unknown',
  decision                   planning_decision,
  last_synced_at             timestamptz,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

create unique index if not exists application_lpa_ref_idx
  on application (lpa_code, lpa_reference);

-- Party and join
create table if not exists party (
  id              uuid primary key default gen_random_uuid(),
  name            text,
  normalised_name text,
  role            party_role not null,
  created_at      timestamptz not null default now()
);

create table if not exists application_party (
  application_id uuid not null references application(id) on delete cascade,
  party_id       uuid not null references party(id) on delete cascade,
  primary key (application_id, party_id)
);

-- Events
create table if not exists event (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references application(id) on delete cascade,
  event_type     event_type not null,
  occurred_at    timestamptz,
  source         text,
  payload        jsonb,
  created_at     timestamptz not null default now()
);

-- Comments
create table if not exists comment (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references application(id) on delete cascade,
  party_id       uuid references party(id),
  role           comment_role,
  source         text,
  submitted_at   timestamptz,
  raw_text       text not null,
  clean_text     text,
  created_at     timestamptz not null default now()
);

create index if not exists comment_clean_text_trgm_idx
  on comment using gin (clean_text gin_trgm_ops);

-- Documents
create table if not exists document (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid references application(id) on delete cascade,
  document_type  document_type not null,
  source         document_source not null,
  source_url     text,
  retrieved_at   timestamptz,
  file_type      text, -- pdf/html/etc.
  page_count     integer,
  raw_text       text,
  parser_version text,
  created_at     timestamptz not null default now()
);

create index if not exists document_raw_text_trgm_idx
  on document using gin (raw_text gin_trgm_ops);

-- Optional text blob table (denormalized view over comments/docs)
create table if not exists application_text_blob (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references application(id) on delete cascade,
  source_kind    text not null,   -- 'comment', 'officer_report', etc.
  source_id      uuid,
  raw_text       text not null,
  clean_text     text,
  created_at     timestamptz not null default now()
);

create index if not exists app_text_blob_clean_text_trgm_idx
  on application_text_blob using gin (clean_text gin_trgm_ops);

-- Behaviour labels
create table if not exists behaviour_label (
  id          serial primary key,
  code        text unique not null,
  description text
);

create table if not exists application_behaviour_label (
  application_id uuid not null references application(id) on delete cascade,
  label_id       integer not null references behaviour_label(id) on delete cascade,
  source         text not null,  -- 'manual_pa25_08856', 'model_v1', etc.
  confidence     real,
  created_at     timestamptz not null default now(),
  primary key (application_id, label_id, source)
);

-- Staging tables for JSONL ingest
create table if not exists staging_application_jsonl (
  id        bigserial primary key,
  data      jsonb not null,
  loaded_at timestamptz not null default now()
);

create table if not exists staging_application_text_blob_jsonl (
  id        bigserial primary key,
  data      jsonb not null,
  loaded_at timestamptz not null default now()
);

create table if not exists staging_application_behaviour_labels_jsonl (
  id        bigserial primary key,
  data      jsonb not null,
  loaded_at timestamptz not null default now()
);

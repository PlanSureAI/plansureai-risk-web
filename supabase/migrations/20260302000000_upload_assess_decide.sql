create table if not exists planning_documents (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  type text not null,
  source text not null,
  file_path text not null,
  file_name text not null,
  mime_type text,
  uploaded_by uuid references profiles(id),
  uploaded_at timestamptz not null default now(),
  parsed boolean not null default false,
  parsed_at timestamptz,
  parse_error text
);

create table if not exists planning_document_extracted_fields (
  id uuid primary key default gen_random_uuid(),
  planning_document_id uuid not null references planning_documents(id) on delete cascade,
  field_key text not null,
  field_value text,
  confidence numeric,
  created_at timestamptz not null default now()
);

create table if not exists risk_assessments (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  planning_document_id uuid references planning_documents(id) on delete set null,
  overall_score numeric,
  overall_confidence numeric,
  headline_risk_colour text,
  primary_killers text[],
  summary_markdown text,
  created_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);

create table if not exists risk_assessment_reasons (
  id uuid primary key default gen_random_uuid(),
  risk_assessment_id uuid not null references risk_assessments(id) on delete cascade,
  category text not null,
  severity text not null,
  title text not null,
  detail_markdown text,
  policy_refs text[],
  source_type text,
  created_at timestamptz not null default now()
);

create table if not exists comparable_applications (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  external_app_id text,
  lpa_name text,
  distance_m numeric,
  decision text,
  decision_date date,
  units_total integer,
  scheme_type text,
  headline_reasons text,
  data_source text,
  created_at timestamptz not null default now()
);

create table if not exists comparable_summaries (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  summary_markdown text,
  stats_json jsonb,
  created_at timestamptz not null default now()
);

create table if not exists mitigation_plans (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  risk_assessment_id uuid references risk_assessments(id) on delete set null,
  plan_markdown text,
  created_at timestamptz not null default now()
);

create index if not exists planning_document_fields_key_value_idx
  on planning_document_extracted_fields(field_key, field_value);

create index if not exists comparable_applications_site_id_idx
  on comparable_applications(site_id);

create index if not exists comparable_applications_site_decision_idx
  on comparable_applications(site_id, decision);

create index if not exists comparable_summaries_site_id_idx
  on comparable_summaries(site_id);

create index if not exists mitigation_plans_site_id_idx
  on mitigation_plans(site_id);

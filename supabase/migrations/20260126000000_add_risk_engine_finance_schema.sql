-- Enums for planning status, EPC targets, and risk banding
do $$ begin
  create type public.planning_status_enum as enum ('pre_app', 'outline', 'full', 'detailed', 'refused', 'consented');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.target_epc_rating_enum as enum ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'unknown');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.risk_band_enum as enum ('low', 'medium', 'high');
exception
  when duplicate_object then null;
end $$;

-- Extend sites with planning + energy finance context
alter table if exists public.sites
  add column if not exists address_line text,
  add column if not exists postcode text,
  add column if not exists lpa_name text,
  add column if not exists scheme_description text,
  add column if not exists units_count integer,
  add column if not exists net_residential_gia_m2 numeric,
  add column if not exists planning_status public.planning_status_enum,
  add column if not exists planning_ref text,
  add column if not exists target_epc_rating public.target_epc_rating_enum,
  add column if not exists energy_strategy_summary text;

-- One finance scenario per site (Base / Downside / Upside)
create table if not exists public.site_finance_profiles (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  label text not null,
  land_cost numeric,
  build_cost numeric,
  professional_fees numeric,
  contingency numeric,
  finance_cost numeric,
  other_costs numeric,
  total_cost numeric generated always as (
    coalesce(land_cost, 0)
      + coalesce(build_cost, 0)
      + coalesce(professional_fees, 0)
      + coalesce(contingency, 0)
      + coalesce(finance_cost, 0)
      + coalesce(other_costs, 0)
  ) stored,
  gdv numeric,
  equity_contribution numeric,
  senior_loan_amount numeric,
  mezz_loan_amount numeric,
  interest_rate_pct numeric,
  arrangement_fee_pct numeric,
  term_months integer,
  created_at timestamp with time zone default now()
);

create index if not exists idx_site_finance_profiles_site_id on public.site_finance_profiles (site_id);

-- Cached metrics derived from finance profile inputs
create table if not exists public.site_finance_metrics (
  id uuid primary key default gen_random_uuid(),
  finance_profile_id uuid not null references public.site_finance_profiles (id) on delete cascade,
  ltc_percent numeric,
  ltgdv_percent numeric,
  profit_amount numeric,
  profit_on_cost_pct numeric,
  profit_on_gdv_pct numeric,
  interest_cover_ratio numeric,
  breakeven_gdv numeric,
  created_at timestamp with time zone default now()
);

create unique index if not exists idx_site_finance_metrics_profile_id on public.site_finance_metrics (finance_profile_id);

-- Sponsor details per site
create table if not exists public.site_sponsors (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  sponsor_name text not null,
  sponsor_background text,
  track_record_summary text,
  equity_invested numeric,
  personal_guarantees text,
  created_at timestamp with time zone default now()
);

create index if not exists idx_site_sponsors_site_id on public.site_sponsors (site_id);

-- Risk engine snapshots
create table if not exists public.site_risks (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  snapshot_label text not null,
  planning_risk_score integer not null,
  delivery_risk_score integer not null,
  sales_risk_score integer not null,
  cost_risk_score integer not null,
  sponsor_risk_score integer not null,
  energy_risk_score integer not null,
  overall_risk_band public.risk_band_enum not null,
  key_risks text,
  key_mitigations text,
  summary_paragraph text,
  ai_model_name text,
  ai_run_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

create index if not exists idx_site_risks_site_id on public.site_risks (site_id);
create index if not exists idx_site_risks_run_at on public.site_risks (ai_run_at desc);

-- Broker CRM + pack audit
create table if not exists public.broker_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  firm text,
  email text,
  phone text,
  notes text,
  created_at timestamp with time zone default now()
);

create index if not exists idx_broker_contacts_user_id on public.broker_contacts (user_id);

create table if not exists public.broker_packs (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  broker_id uuid references public.broker_contacts (id) on delete set null,
  finance_profile_id uuid not null references public.site_finance_profiles (id) on delete restrict,
  risk_snapshot_id uuid not null references public.site_risks (id) on delete restrict,
  pack_version integer not null,
  pack_url text not null,
  csv_url text,
  lender_target text,
  headline_ask text,
  notes_to_broker text,
  created_at timestamp with time zone default now()
);

create index if not exists idx_broker_packs_site_id on public.broker_packs (site_id);
create index if not exists idx_broker_packs_broker_id on public.broker_packs (broker_id);
create unique index if not exists idx_broker_packs_unique_version on public.broker_packs (site_id, pack_version);

create extension if not exists postgis;

alter table if exists public.sites
  add column if not exists risk_score integer,
  add column if not exists risk_level text,
  add column if not exists risk_analysis jsonb,
  add column if not exists risk_calculated_at timestamptz;

create index if not exists idx_sites_risk_score on public.sites (risk_score desc);
create index if not exists idx_sites_risk_level_simple on public.sites (risk_level);

create table if not exists public.planning_risk_factors (
  id uuid primary key default gen_random_uuid(),
  constraint_type text not null,
  severity text not null,
  default_impact integer not null,
  title text not null,
  description text not null,
  mitigation_guidance text,
  applies_to_authorities text[],
  created_at timestamptz default now()
);

create table if not exists public.planning_applications (
  id uuid primary key default gen_random_uuid(),
  authority text not null,
  address text not null,
  postcode text,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  reference text not null unique,
  description text,
  application_type text,
  development_type text,
  units integer,
  affordable_units integer,
  height_meters decimal,
  site_area_hectares decimal,
  submitted_date date,
  validated_date date,
  decision_date date,
  appeal_date date,
  decision text,
  decision_level text,
  refusal_reasons text[],
  conditions text[],
  planning_portal_url text,
  officer_report_url text,
  decision_notice_url text,
  scraped_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_planning_apps_location
  on public.planning_applications
  using gist (st_setsrid(st_makepoint(longitude, latitude), 4326));

create index if not exists idx_planning_apps_authority
  on public.planning_applications (authority);
create index if not exists idx_planning_apps_decision
  on public.planning_applications (decision);
create index if not exists idx_planning_apps_decision_date
  on public.planning_applications (decision_date desc);

create or replace function public.find_nearby_planning_applications(
  center_lat decimal,
  center_lng decimal,
  radius_meters integer
)
returns table (
  id uuid,
  authority text,
  address text,
  reference text,
  description text,
  units integer,
  decision text,
  decision_date date,
  validated_date date,
  refusal_reasons text[],
  conditions text[],
  planning_portal_url text,
  officer_report_url text,
  latitude decimal,
  longitude decimal,
  distance decimal
) as $$
begin
  return query
  select
    pa.id,
    pa.authority,
    pa.address,
    pa.reference,
    pa.description,
    pa.units,
    pa.decision,
    pa.decision_date,
    pa.validated_date,
    pa.refusal_reasons,
    pa.conditions,
    pa.planning_portal_url,
    pa.officer_report_url,
    pa.latitude,
    pa.longitude,
    st_distance(
      st_setsrid(st_makepoint(center_lng, center_lat), 4326)::geography,
      st_setsrid(st_makepoint(pa.longitude, pa.latitude), 4326)::geography
    ) as distance
  from public.planning_applications pa
  where st_dwithin(
    st_setsrid(st_makepoint(center_lng, center_lat), 4326)::geography,
    st_setsrid(st_makepoint(pa.longitude, pa.latitude), 4326)::geography,
    radius_meters
  )
  and pa.decision is not null
  order by distance asc
  limit 50;
end;
$$ language plpgsql;

create table if not exists public.local_plan_policies (
  id uuid primary key default gen_random_uuid(),
  authority text not null,
  policy_reference text not null,
  policy_title text not null,
  policy_text text not null,
  policy_category text,
  applies_to text[],
  strictness text,
  local_plan_name text,
  adopted_date date,
  review_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_policies_authority
  on public.local_plan_policies (authority);

create index if not exists idx_policies_category
  on public.local_plan_policies (policy_category);

create index if not exists idx_policies_reference
  on public.local_plan_policies (authority, policy_reference);

create index if not exists idx_policies_text_search
  on public.local_plan_policies using gin (
    to_tsvector('english', policy_title || ' ' || policy_text)
  );

alter table if exists public.planning_applications
  add column if not exists approval_probability numeric,
  add column if not exists similar_approved_count integer,
  add column if not exists similar_refused_count integer,
  add column if not exists policy_refs text[];

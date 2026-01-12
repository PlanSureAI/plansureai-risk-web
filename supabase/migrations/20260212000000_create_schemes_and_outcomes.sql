create table if not exists public.schemes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  site_name text,
  address text,
  planning_ref text,
  created_at timestamptz default now()
);

create index if not exists idx_schemes_user_id on public.schemes (user_id);

create table if not exists public.planning_outcomes (
  id uuid primary key default gen_random_uuid(),
  scheme_id uuid references public.schemes (id) on delete cascade,
  planning_ref text,
  decision text check (decision in ('approved', 'refused', 'pending', 'withdrawn', 'appeal')),
  decision_date date,
  authority_name text,
  notes text
);

create index if not exists idx_planning_outcomes_scheme_id on public.planning_outcomes (scheme_id);

create table if not exists public.funding_outcomes (
  id uuid primary key default gen_random_uuid(),
  scheme_id uuid references public.schemes (id) on delete cascade,
  lender_name text,
  decision text check (decision in ('approved', 'refused', 'declined', 'terms_changed')),
  ltc_percent numeric(5,2),
  gdv_ltv_percent numeric(5,2),
  interest_rate_percent numeric(5,2),
  approved_loan_amount numeric,
  decision_date date,
  notes text
);

create index if not exists idx_funding_outcomes_scheme_id on public.funding_outcomes (scheme_id);

create table if not exists public.performance_outcomes (
  id uuid primary key default gen_random_uuid(),
  scheme_id uuid references public.schemes (id) on delete cascade,
  status text check (status in ('not_started', 'on_site', 'completed', 'sold', 'held')),
  actual_build_cost numeric,
  actual_gdv numeric,
  build_start_date date,
  build_completion_date date,
  sale_completion_date date,
  notes text
);

create index if not exists idx_performance_outcomes_scheme_id on public.performance_outcomes (scheme_id);

alter table public.schemes enable row level security;

create policy "schemes_select_own"
  on public.schemes
  for select
  using (auth.uid() = user_id);

create policy "schemes_insert_own"
  on public.schemes
  for insert
  with check (auth.uid() = user_id);

create policy "schemes_update_own"
  on public.schemes
  for update
  using (auth.uid() = user_id);

create policy "schemes_delete_own"
  on public.schemes
  for delete
  using (auth.uid() = user_id);

alter table public.planning_outcomes enable row level security;

create policy "planning_outcomes_select_own"
  on public.planning_outcomes
  for select
  using (
    exists (
      select 1
      from public.schemes
      where public.schemes.id = planning_outcomes.scheme_id
        and public.schemes.user_id = auth.uid()
    )
  );

create policy "planning_outcomes_insert_own"
  on public.planning_outcomes
  for insert
  with check (
    exists (
      select 1
      from public.schemes
      where public.schemes.id = planning_outcomes.scheme_id
        and public.schemes.user_id = auth.uid()
    )
  );

create policy "planning_outcomes_update_own"
  on public.planning_outcomes
  for update
  using (
    exists (
      select 1
      from public.schemes
      where public.schemes.id = planning_outcomes.scheme_id
        and public.schemes.user_id = auth.uid()
    )
  );

create policy "planning_outcomes_delete_own"
  on public.planning_outcomes
  for delete
  using (
    exists (
      select 1
      from public.schemes
      where public.schemes.id = planning_outcomes.scheme_id
        and public.schemes.user_id = auth.uid()
    )
  );

alter table public.funding_outcomes enable row level security;

create policy "funding_outcomes_select_own"
  on public.funding_outcomes
  for select
  using (
    exists (
      select 1
      from public.schemes
      where public.schemes.id = funding_outcomes.scheme_id
        and public.schemes.user_id = auth.uid()
    )
  );

create policy "funding_outcomes_insert_own"
  on public.funding_outcomes
  for insert
  with check (
    exists (
      select 1
      from public.schemes
      where public.schemes.id = funding_outcomes.scheme_id
        and public.schemes.user_id = auth.uid()
    )
  );

create policy "funding_outcomes_update_own"
  on public.funding_outcomes
  for update
  using (
    exists (
      select 1
      from public.schemes
      where public.schemes.id = funding_outcomes.scheme_id
        and public.schemes.user_id = auth.uid()
    )
  );

create policy "funding_outcomes_delete_own"
  on public.funding_outcomes
  for delete
  using (
    exists (
      select 1
      from public.schemes
      where public.schemes.id = funding_outcomes.scheme_id
        and public.schemes.user_id = auth.uid()
    )
  );

alter table public.performance_outcomes enable row level security;

create policy "performance_outcomes_select_own"
  on public.performance_outcomes
  for select
  using (
    exists (
      select 1
      from public.schemes
      where public.schemes.id = performance_outcomes.scheme_id
        and public.schemes.user_id = auth.uid()
    )
  );

create policy "performance_outcomes_insert_own"
  on public.performance_outcomes
  for insert
  with check (
    exists (
      select 1
      from public.schemes
      where public.schemes.id = performance_outcomes.scheme_id
        and public.schemes.user_id = auth.uid()
    )
  );

create policy "performance_outcomes_update_own"
  on public.performance_outcomes
  for update
  using (
    exists (
      select 1
      from public.schemes
      where public.schemes.id = performance_outcomes.scheme_id
        and public.schemes.user_id = auth.uid()
    )
  );

create policy "performance_outcomes_delete_own"
  on public.performance_outcomes
  for delete
  using (
    exists (
      select 1
      from public.schemes
      where public.schemes.id = performance_outcomes.scheme_id
        and public.schemes.user_id = auth.uid()
    )
  );

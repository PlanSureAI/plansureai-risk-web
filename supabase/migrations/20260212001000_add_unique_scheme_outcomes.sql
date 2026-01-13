create unique index if not exists idx_planning_outcomes_scheme_id_unique
  on public.planning_outcomes (scheme_id);

create unique index if not exists idx_funding_outcomes_scheme_id_unique
  on public.funding_outcomes (scheme_id);

create unique index if not exists idx_performance_outcomes_scheme_id_unique
  on public.performance_outcomes (scheme_id);

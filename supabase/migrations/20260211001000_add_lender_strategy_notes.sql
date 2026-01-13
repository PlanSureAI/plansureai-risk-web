alter table if exists public.sites
  add column if not exists lender_strategy_notes text;

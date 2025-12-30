-- Store Zero-Bill workflow outputs alongside planning analysis
alter table if exists public.sites
  add column if not exists zero_bill_assessment jsonb,
  add column if not exists zero_bill_last_run_at timestamptz;

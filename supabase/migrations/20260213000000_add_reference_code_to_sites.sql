alter table if exists public.sites
  add column if not exists reference_code text;

alter table if exists public.planning_document_analyses
  add column if not exists risk_matrix jsonb,
  add column if not exists risk_index numeric,
  add column if not exists risk_band public.risk_band_enum;

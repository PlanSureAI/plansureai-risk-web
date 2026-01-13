create index if not exists sites_reference_code_idx
  on public.sites (reference_code);

comment on column public.sites.reference_code is
  'Council planning reference or internal tracking code';

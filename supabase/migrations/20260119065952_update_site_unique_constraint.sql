-- Adjust unique constraint to prevent duplicate addresses per user.

alter table public.sites
  drop constraint if exists unique_site_submission;

alter table public.sites
  add constraint unique_site_submission unique (user_id, address);

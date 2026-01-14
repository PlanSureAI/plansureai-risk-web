alter table public.document_jobs
  add column if not exists filename text;

update public.document_jobs
  set filename = file_name
  where filename is null and file_name is not null;

create table if not exists public.document_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  site_id uuid references public.sites(id),
  storage_path text not null,
  file_name text not null,
  file_size bigint,
  mime_type text,
  status text not null default 'pending',
  progress integer not null default 0,
  progress_message text,
  analysis_status text not null default 'pending',
  planning_document_id uuid references public.planning_documents(id),
  error_message text,
  attempts integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists document_jobs_user_status_idx
  on public.document_jobs (user_id, status);

create index if not exists document_jobs_status_created_idx
  on public.document_jobs (status, created_at);

alter table public.document_jobs enable row level security;

create policy "Users can view own document jobs"
  on public.document_jobs
  for select
  using (auth.uid() = user_id);

-- Realtime support
DO $$
BEGIN
  alter publication supabase_realtime add table public.document_jobs;
EXCEPTION
  when duplicate_object then null;
END $$;

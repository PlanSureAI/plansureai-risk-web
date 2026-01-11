create table if not exists planning_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  site_id uuid references sites(id) on delete set null,
  storage_path text,
  file_name text,
  summary_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists planning_documents_user_id_idx
  on planning_documents (user_id);

create index if not exists planning_documents_site_id_idx
  on planning_documents (site_id);

alter table planning_documents enable row level security;

create policy "planning_documents_select_own"
  on planning_documents
  for select
  using (auth.uid() = user_id);

create policy "planning_documents_insert_own"
  on planning_documents
  for insert
  with check (auth.uid() = user_id);

create policy "planning_documents_update_own"
  on planning_documents
  for update
  using (auth.uid() = user_id);

create policy "planning_documents_delete_own"
  on planning_documents
  for delete
  using (auth.uid() = user_id);

create table if not exists planning_document_analyses (
  id uuid primary key default gen_random_uuid(),
  planning_document_id uuid references planning_documents(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  analysis_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists planning_document_analyses_doc_id_idx
  on planning_document_analyses (planning_document_id);

alter table planning_document_analyses enable row level security;

create policy "planning_document_analyses_select_own"
  on planning_document_analyses
  for select
  using (auth.uid() = user_id);

create policy "planning_document_analyses_insert_own"
  on planning_document_analyses
  for insert
  with check (auth.uid() = user_id);

create policy "planning_document_analyses_update_own"
  on planning_document_analyses
  for update
  using (auth.uid() = user_id);

create policy "planning_document_analyses_delete_own"
  on planning_document_analyses
  for delete
  using (auth.uid() = user_id);

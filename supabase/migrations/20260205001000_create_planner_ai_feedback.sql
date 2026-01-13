create table if not exists planner_ai_feedback (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references sites(id) on delete set null,
  planning_document_id uuid references planning_documents(id) on delete set null,
  user_id uuid references auth.users(id) on delete cascade,
  context_type text not null default 'summary',
  question text,
  answer text,
  answer_quality integer,
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists planner_ai_feedback_site_id_idx
  on planner_ai_feedback (site_id);

create index if not exists planner_ai_feedback_user_id_idx
  on planner_ai_feedback (user_id);

alter table planner_ai_feedback enable row level security;

create policy "planner_ai_feedback_select_own"
  on planner_ai_feedback
  for select
  using (auth.uid() = user_id);

create policy "planner_ai_feedback_insert_own"
  on planner_ai_feedback
  for insert
  with check (auth.uid() = user_id);

create policy "planner_ai_feedback_update_own"
  on planner_ai_feedback
  for update
  using (auth.uid() = user_id);

create policy "planner_ai_feedback_delete_own"
  on planner_ai_feedback
  for delete
  using (auth.uid() = user_id);

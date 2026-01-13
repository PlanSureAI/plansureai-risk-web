alter table planning_document_analyses
  add column if not exists structured_summary jsonb;

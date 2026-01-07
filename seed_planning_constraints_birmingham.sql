-- Temporary table to hold JSONL data
create temp table temp_constraints (line jsonb);

-- Use COPY to load the JSONL file
-- Replace this path with your actual file path
\copy temp_constraints(line) from '/Users/williamtyler-street/plansureai-risk-web/data/birmingham-constraints.jsonl';

-- Insert into planning_constraint table
insert into planning_constraint (
  constraint_type,
  reference,
  name,
  lpa_code,
  geometry,
  data
)
select
  (line->>'constraint_type')::constraint_type,
  line->>'reference',
  line->>'name',
  line->>'lpa_code',
  ST_GeomFromGeoJSON(line->>'geometry'),
  line->'data'
from temp_constraints
where line->>'geometry' is not null
on conflict do nothing;

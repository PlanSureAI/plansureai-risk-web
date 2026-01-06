-- Applications upsert from staging_application_jsonl

with parsed as (
  select *
  from staging_application_jsonl
), rows as (
  select
    (r).*,
    case
      when r.site_centroid ? 'lat' and r.site_centroid ? 'lng'
      then ST_SetSRID(
        ST_MakePoint((r.site_centroid->>'lng')::float, (r.site_centroid->>'lat')::float),
        4326
      )
      else null
    end as geom_centroid,
    case
      when r.site_polygon is not null
      then ST_SetSRID(ST_GeomFromGeoJSON(r.site_polygon::text), 4326)
      else null
    end as geom_polygon
  from parsed,
  lateral jsonb_to_record(data) as r(
    lpa_code text,
    lpa_reference text,
    planning_data_id text,
    aggregator_application_id text,
    address_text text,
    description_text text,
    development_type text,
    received_date date,
    validated_date date,
    decision_date date,
    status planning_status,
    decision planning_decision,
    uprns text[],
    site_centroid jsonb,
    site_polygon jsonb,
    last_synced_at timestamptz
  )
), ins_site as (
  insert into site (uprns, site_centroid, site_polygon)
  select
    coalesce(uprns, '{}'),
    geom_centroid,
    geom_polygon
  from rows
  on conflict do nothing
  returning id, uprns
), resolved as (
  select
    r.*,
    coalesce(s.id, (
      select id from ins_site s2 where s2.uprns = r.uprns limit 1
    )) as site_id
  from rows r
  left join ins_site s on s.uprns = r.uprns
)
insert into application (
  lpa_code,
  lpa_reference,
  planning_data_id,
  aggregator_application_id,
  address_text,
  description_text,
  development_type,
  site_id,
  received_date,
  validated_date,
  decision_date,
  status,
  decision,
  last_synced_at
)
select
  lpa_code,
  lpa_reference,
  planning_data_id,
  aggregator_application_id,
  address_text,
  description_text,
  development_type,
  site_id,
  received_date,
  validated_date,
  decision_date,
  coalesce(status, 'unknown')::planning_status,
  decision,
  last_synced_at
from resolved
on conflict (lpa_code, lpa_reference) do update
set
  planning_data_id = excluded.planning_data_id,
  aggregator_application_id = excluded.aggregator_application_id,
  address_text = excluded.address_text,
  description_text = excluded.description_text,
  development_type = excluded.development_type,
  site_id = excluded.site_id,
  received_date = excluded.received_date,
  validated_date = excluded.validated_date,
  decision_date = excluded.decision_date,
  status = excluded.status,
  decision = excluded.decision,
  last_synced_at = coalesce(excluded.last_synced_at, application.last_synced_at),
  updated_at = now();

-- Text blobs upsert from staging_application_text_blob_jsonl

with rows as (
  select
    r.application_lpa_code,
    r.application_lpa_reference,
    r.source_kind,
    r.source_id,
    r.raw_text,
    r.clean_text,
    r.created_at
  from staging_application_text_blob_jsonl,
  lateral jsonb_to_record(data) as r(
    application_lpa_code text,
    application_lpa_reference text,
    source_kind text,
    source_id text,
    raw_text text,
    clean_text text,
    created_at timestamptz
  )
), app_ids as (
  select
    rows.*,
    a.id as application_id
  from rows
  join application a
    on a.lpa_code = rows.application_lpa_code
   and a.lpa_reference = rows.application_lpa_reference
)
insert into application_text_blob (
  application_id,
  source_kind,
  source_id,
  raw_text,
  clean_text,
  created_at
)
select
  application_id,
  source_kind,
  source_id,
  raw_text,
  clean_text,
  coalesce(created_at, now())
from app_ids
on conflict (application_id, source_kind, source_id) do update
set
  raw_text = excluded.raw_text,
  clean_text = excluded.clean_text,
  created_at = excluded.created_at;

-- Behaviour labels upsert from staging_application_behaviour_labels_jsonl

with rows as (
  select
    r.application_lpa_code,
    r.application_lpa_reference,
    r.label_code,
    r.confidence,
    r.source,
    r.created_at
  from staging_application_behaviour_labels_jsonl,
  lateral jsonb_to_record(data) as r(
    application_lpa_code text,
    application_lpa_reference text,
    label_code text,
    confidence real,
    source text,
    created_at timestamptz
  )
), apps as (
  select
    rows.*,
    a.id as application_id
  from rows
  join application a
    on a.lpa_code = rows.application_lpa_code
   and a.lpa_reference = rows.application_lpa_reference
), labels as (
  insert into behaviour_label (code)
  select distinct label_code from rows
  on conflict (code) do nothing
  returning id, code
), label_ids as (
  select
    apps.*,
    coalesce(l.id, bl.id) as label_id
  from apps
  left join labels l on l.code = apps.label_code
  left join behaviour_label bl on bl.code = apps.label_code
)
insert into application_behaviour_label (
  application_id,
  label_id,
  source,
  confidence,
  created_at
)
select
  application_id,
  label_id,
  source,
  confidence,
  coalesce(created_at, now())
from label_ids
on conflict (application_id, label_id, source) do update
set confidence = excluded.confidence,
    created_at = excluded.created_at;

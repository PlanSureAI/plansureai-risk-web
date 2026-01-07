insert into staging_application_jsonl (data, loaded_at)
values
  (
    '{
      "lpa_code": "CORNWALL",
      "lpa_reference": "PA25/08856",
      "planning_data_id": null,
      "aggregator_application_id": null,
      "address_text": "Land south of Church Road, Example Village, Cornwall",
      "description_text": "Construction of 6 dwellings with associated access, parking and landscaping.",
      "development_type": "Minor Dwellings",
      "received_date": "2025-08-01",
      "validated_date": "2025-08-05",
      "decision_date": "2025-11-10",
      "status": "decided",
      "decision": "granted",
      "uprns": [
        "100012345678"
      ],
      "site_centroid": {
        "lat": 50.123456,
        "lng": -5.123456
      },
      "site_polygon": null,
      "last_synced_at": "2026-01-06T19:43:29.794Z"
    }'::jsonb,
    now()
  );

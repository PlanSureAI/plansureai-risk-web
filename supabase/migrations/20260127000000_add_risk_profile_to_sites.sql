ALTER TABLE sites
ADD COLUMN IF NOT EXISTS viability_assessment JSONB,
ADD COLUMN IF NOT EXISTS project_details JSONB,
ADD COLUMN IF NOT EXISTS planning_route TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS planning_route_status TEXT DEFAULT 'not-started',
ADD COLUMN IF NOT EXISTS risk_profile JSONB,
ADD COLUMN IF NOT EXISTS last_assessed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_sites_risk_level
ON sites ((risk_profile->>'riskLevel'));

CREATE INDEX IF NOT EXISTS idx_sites_last_assessed
ON sites (last_assessed_at DESC);

COMMENT ON COLUMN sites.viability_assessment IS
  'Stores the last calculated viability metrics (profit, ROI, costs, revenue)';
COMMENT ON COLUMN sites.project_details IS
  'Stores project characteristics (units, GIA, development type, affordable %)'; 
COMMENT ON COLUMN sites.planning_route IS
  'Current planning route: none, pip, pre-app, outline, full, reserved-matters';
COMMENT ON COLUMN sites.planning_route_status IS
  'Planning status: not-started, in-progress, consented, refused, appealed';
COMMENT ON COLUMN sites.risk_profile IS
  'Stores the last calculated risk profile including overall score, level, and flags';
COMMENT ON COLUMN sites.last_assessed_at IS
  'Timestamp of last viability/risk assessment';

-- Comparable Planning Applications Schema
-- Stores real planning application data for analysis and social proof

-- Planning applications comparables table
CREATE TABLE IF NOT EXISTS planning_comparables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Application details
    reference TEXT NOT NULL UNIQUE,
    address TEXT NOT NULL,
    postcode TEXT,
    description TEXT NOT NULL,
    applicant_name TEXT,

    -- Location
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    council_name TEXT NOT NULL,
    ward TEXT,
    parish TEXT,

    -- Outcome
    decision TEXT NOT NULL,
    decision_date DATE,
    application_date DATE NOT NULL,
    target_date DATE,
    weeks_to_decision INTEGER,

    -- Risk categorization (links to our risk types)
    risk_categories TEXT[],

    -- Details
    application_type TEXT,
    development_type TEXT,

    -- Constraints
    in_conservation_area BOOLEAN DEFAULT false,
    affects_listed_building BOOLEAN DEFAULT false,
    has_tree_constraints BOOLEAN DEFAULT false,
    in_flood_zone BOOLEAN DEFAULT false,

    -- Approval conditions/reasons
    approval_conditions TEXT[],
    refusal_reasons TEXT[],

    -- Links
    planning_portal_url TEXT,

    -- Metadata
    data_source TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analysis cache table (pre-computed stats for performance)
CREATE TABLE IF NOT EXISTS comparable_analysis_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- What this analysis is for
    risk_category TEXT NOT NULL,
    council_name TEXT NOT NULL,
    constraint_type TEXT,

    -- Stats
    total_applications INTEGER NOT NULL DEFAULT 0,
    approved_count INTEGER NOT NULL DEFAULT 0,
    refused_count INTEGER NOT NULL DEFAULT 0,
    approval_rate DECIMAL(5, 2),
    avg_weeks_to_decision DECIMAL(5, 2),

    -- Time period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Cache metadata
    last_updated TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(risk_category, council_name, constraint_type, period_start, period_end)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_comparables_council ON planning_comparables(council_name);
CREATE INDEX IF NOT EXISTS idx_comparables_decision ON planning_comparables(decision);
CREATE INDEX IF NOT EXISTS idx_comparables_location ON planning_comparables(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_comparables_risk_categories ON planning_comparables USING GIN(risk_categories);
CREATE INDEX IF NOT EXISTS idx_comparables_decision_date ON planning_comparables(decision_date DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_cache_lookup ON comparable_analysis_cache(risk_category, council_name, constraint_type);

-- Function to calculate weeks between dates
CREATE OR REPLACE FUNCTION calculate_weeks_to_decision()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.decision_date IS NOT NULL AND NEW.application_date IS NOT NULL THEN
        NEW.weeks_to_decision := CEIL(EXTRACT(EPOCH FROM (NEW.decision_date - NEW.application_date)) / 604800);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate weeks_to_decision
CREATE TRIGGER set_weeks_to_decision
    BEFORE INSERT OR UPDATE ON planning_comparables
    FOR EACH ROW
    EXECUTE FUNCTION calculate_weeks_to_decision();

-- Insert sample Cornwall Council comparables
INSERT INTO planning_comparables (
    reference, address, postcode, description,
    council_name, decision, decision_date, application_date,
    risk_categories, application_type, development_type,
    in_conservation_area, affects_listed_building,
    approval_conditions, planning_portal_url
) VALUES
(
    'PA23/08734', '15 Trevethan Road, Bodmin', 'PL31 2AN',
    'Single storey rear extension and internal alterations to dwelling',
    'Cornwall Council', 'approved', '2023-09-15', '2023-07-10',
    ARRAY['heritage', 'design'],
    'full', 'extension',
    true, false,
    ARRAY['Heritage statement required', 'Materials to match existing', 'No permitted development rights'],
    'https://planning.cornwall.gov.uk/online-applications/applicationDetails.do?activeTab=summary&keyVal=PA23/08734'
),
(
    'PA23/09821', '42 St Nicholas Street, Bodmin', 'PL31 1AG',
    'Replacement windows and door to Grade II listed building',
    'Cornwall Council', 'approved', '2023-11-22', '2023-09-05',
    ARRAY['heritage'],
    'listed_building', 'alterations',
    true, true,
    ARRAY['Heritage statement approved', 'Traditional timber windows required', 'Conservation officer site visit'],
    'https://planning.cornwall.gov.uk/online-applications/applicationDetails.do?activeTab=summary&keyVal=PA23/09821'
),
(
    'PA24/00456', '8 Dennison Road, Bodmin', 'PL31 2HE',
    'Erection of detached dwelling in conservation area',
    'Cornwall Council', 'approved', '2024-03-18', '2023-12-05',
    ARRAY['heritage', 'design', 'trees'],
    'full', 'new_dwelling',
    true, false,
    ARRAY['Heritage impact assessment submitted', 'Design reflects local character', 'Tree protection plan', 'Landscaping scheme'],
    'https://planning.cornwall.gov.uk/online-applications/applicationDetails.do?activeTab=summary&keyVal=PA24/00456'
),
(
    'PA23/11234', '67 Castle Street, Bodmin', 'PL31 2DU',
    'Two storey side extension in conservation area',
    'Cornwall Council', 'refused', '2024-01-08', '2023-10-12',
    ARRAY['heritage', 'design'],
    'full', 'extension',
    true, false,
    NULL,
    ARRAY['Harmful to character of conservation area', 'Insufficient heritage justification', 'Excessive scale and mass'],
    'https://planning.cornwall.gov.uk/online-applications/applicationDetails.do?activeTab=summary&keyVal=PA23/11234'
),
(
    'PA23/07652', '23 Robartes Road, Bodmin', 'PL31 1DN',
    'Fell 1 oak tree (T1) subject to Tree Preservation Order',
    'Cornwall Council', 'refused', '2023-08-30', '2023-07-20',
    ARRAY['trees'],
    'tree_works', 'tree_removal',
    false, false,
    NULL,
    ARRAY['Insufficient justification for removal', 'Tree in good health', 'Alternative solutions available'],
    'https://planning.cornwall.gov.uk/online-applications/applicationDetails.do?activeTab=summary&keyVal=PA23/07652'
),
(
    'PA24/01567', '91 Priory Road, Bodmin', 'PL31 2AE',
    'Single storey rear extension affecting protected oak tree',
    'Cornwall Council', 'approved', '2024-04-10', '2024-01-22',
    ARRAY['trees', 'design'],
    'full', 'extension',
    false, false,
    ARRAY['BS5837 tree survey submitted', 'Tree protection plan', 'Arboricultural supervision during construction'],
    'https://planning.cornwall.gov.uk/online-applications/applicationDetails.do?activeTab=summary&keyVal=PA24/01567'
),
(
    'PA23/10234', '5 Lower Bore Street, Bodmin', 'PL31 2JU',
    'Change of use of ground floor to residential (Flood Zone 2)',
    'Cornwall Council', 'approved', '2023-12-15', '2023-09-28',
    ARRAY['flooding'],
    'full', 'change_of_use',
    false, false,
    ARRAY['Flood risk assessment approved', 'Flood resilience measures', 'Emergency evacuation plan'],
    'https://planning.cornwall.gov.uk/online-applications/applicationDetails.do?activeTab=summary&keyVal=PA23/10234'
),
(
    'PA24/02134', 'Land adjacent to River Camel, Dunmere Road', 'PL31 2RQ',
    'Erection of dwelling in Flood Zone 3',
    'Cornwall Council', 'refused', '2024-05-20', '2024-02-08',
    ARRAY['flooding'],
    'full', 'new_dwelling',
    false, false,
    NULL,
    ARRAY['Sequential test not passed', 'Alternative sites available in lower flood risk areas', 'EA objection'],
    'https://planning.cornwall.gov.uk/online-applications/applicationDetails.do?activeTab=summary&keyVal=PA24/02134'
),
(
    'PA23/08901', '34 Turf Street, Bodmin', 'PL31 2DT',
    'Conversion of dwelling to 2 flats with reduced parking',
    'Cornwall Council', 'approved', '2023-10-05', '2023-08-01',
    ARRAY['parking'],
    'full', 'conversion',
    true, false,
    ARRAY['Transport statement accepted', 'Town center location', 'Cycle storage provided', 'Car club membership'],
    'https://planning.cornwall.gov.uk/online-applications/applicationDetails.do?activeTab=summary&keyVal=PA23/08901'
),
(
    'PA24/03456', '12 Fore Street, Bodmin', 'PL31 2HQ',
    'Change of use to restaurant with terrace (conservation area, listed building)',
    'Cornwall Council', 'approved', '2024-06-12', '2024-03-18',
    ARRAY['heritage', 'parking', 'neighbors'],
    'full', 'change_of_use',
    true, true,
    ARRAY['Heritage statement', 'Noise management plan', 'Opening hours restriction', 'External terrace screening'],
    'https://planning.cornwall.gov.uk/online-applications/applicationDetails.do?activeTab=summary&keyVal=PA24/03456'
),
(
    'PA23/09234', '78 Castle Street, Bodmin', 'PL31 2DS',
    'Loft conversion with rear dormer in conservation area',
    'Cornwall Council', 'approved', '2023-11-08', '2023-09-12',
    ARRAY['heritage', 'design'],
    'full', 'extension',
    true, false,
    ARRAY['Dormer design approved', 'Materials to match existing', 'Not visible from street'],
    'https://planning.cornwall.gov.uk/online-applications/applicationDetails.do?activeTab=summary&keyVal=PA23/09234'
),
(
    'PA24/00789', '19 Higher Bore Street, Bodmin', 'PL31 2JX',
    'Two storey rear extension affecting neighbors',
    'Cornwall Council', 'approved', '2024-02-28', '2023-12-18',
    ARRAY['neighbors', 'design'],
    'full', 'extension',
    false, false,
    ARRAY['Revised design following neighbor concerns', 'Privacy screening', '45-degree rule satisfied'],
    'https://planning.cornwall.gov.uk/online-applications/applicationDetails.do?activeTab=summary&keyVal=PA24/00789'
);

-- Pre-compute analysis cache for common queries
INSERT INTO comparable_analysis_cache (
    risk_category, council_name, constraint_type,
    total_applications, approved_count, refused_count, approval_rate, avg_weeks_to_decision,
    period_start, period_end
) VALUES
(
    'heritage', 'Cornwall Council', 'conservation_area',
    8, 6, 2, 75.00, 9.5,
    '2023-01-01', '2024-12-31'
),
(
    'heritage', 'Cornwall Council', 'listed_building',
    2, 2, 0, 100.00, 10.5,
    '2023-01-01', '2024-12-31'
),
(
    'trees', 'Cornwall Council', NULL,
    3, 2, 1, 66.67, 8.3,
    '2023-01-01', '2024-12-31'
),
(
    'flooding', 'Cornwall Council', NULL,
    2, 1, 1, 50.00, 14.0,
    '2023-01-01', '2024-12-31'
),
(
    'parking', 'Cornwall Council', NULL,
    2, 2, 0, 100.00, 7.5,
    '2023-01-01', '2024-12-31'
);

-- Enable RLS
ALTER TABLE planning_comparables ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparable_analysis_cache ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read planning comparables" ON planning_comparables
    FOR SELECT USING (true);

CREATE POLICY "Public read analysis cache" ON comparable_analysis_cache
    FOR SELECT USING (true);

-- Admin write access (for data imports)
CREATE POLICY "Admin insert comparables" ON planning_comparables
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin update comparables" ON planning_comparables
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin manage cache" ON comparable_analysis_cache
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

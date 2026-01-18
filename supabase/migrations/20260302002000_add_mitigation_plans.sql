-- Enhanced Mitigation Plans Schema
-- Provides step-by-step action plans with costs, timelines, and specialist links

-- Mitigation steps library (reusable action templates)
CREATE TABLE IF NOT EXISTS mitigation_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    step_name TEXT NOT NULL,
    step_description TEXT NOT NULL,
    risk_category TEXT NOT NULL,
    step_order INTEGER NOT NULL,

    -- Cost estimates
    cost_min INTEGER,
    cost_max INTEGER,
    cost_notes TEXT,

    -- Timeline
    timeline_weeks_min INTEGER,
    timeline_weeks_max INTEGER,
    timeline_notes TEXT,

    -- Specialist requirements
    specialist_type TEXT,
    specialist_required BOOLEAN DEFAULT false,

    -- Why this step matters
    rationale TEXT,
    success_impact TEXT,

    -- External links
    specialist_directory_url TEXT,
    guidance_url TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Specialist types reference
CREATE TABLE IF NOT EXISTS specialist_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    specialist_type TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    typical_cost_range TEXT,
    directory_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User mitigation plan tracking (optional - for future progress tracking)
CREATE TABLE IF NOT EXISTS user_mitigation_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    project_id UUID NOT NULL,
    step_id UUID REFERENCES mitigation_steps(id) ON DELETE CASCADE,

    status TEXT DEFAULT 'not_started',
    actual_cost INTEGER,
    actual_weeks INTEGER,
    notes TEXT,

    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mitigation_steps_category ON mitigation_steps(risk_category);
CREATE INDEX IF NOT EXISTS idx_mitigation_steps_order ON mitigation_steps(risk_category, step_order);
CREATE INDEX IF NOT EXISTS idx_user_progress_project ON user_mitigation_progress(project_id);

-- Insert specialist types
INSERT INTO specialist_types (specialist_type, display_name, description, typical_cost_range, directory_url) VALUES
('heritage_consultant', 'Heritage Consultant', 'Prepares heritage statements and impact assessments for listed buildings and conservation areas', 'GBP800-GBP2,500 per report', 'https://www.ihbc.org.uk/consultants_directory/'),
('arboricultural_consultant', 'Arboricultural Consultant', 'Conducts tree surveys, impact assessments, and provides advice on tree protection', 'GBP400-GBP1,500 per survey', 'https://www.trees.org.uk/'),
('ecologist', 'Ecological Consultant', 'Surveys for protected species, habitats, and provides mitigation strategies', 'GBP600-GBP2,000 per survey', 'https://cieem.net/i-am/consultant-directory/'),
('flood_consultant', 'Flood Risk Consultant', 'Prepares flood risk assessments and drainage strategies', 'GBP1,000-GBP3,000 per FRA', 'https://www.ciwem.org/'),
('planning_consultant', 'Planning Consultant', 'Advises on planning strategy, policy compliance, and manages applications', 'GBP150-GBP300 per hour', 'https://www.rtpi.org.uk/'),
('landscape_architect', 'Landscape Architect', 'Designs landscaping schemes and visual impact assessments', 'GBP800-GBP2,500 per scheme', 'https://www.landscapeinstitute.org/'),
('structural_engineer', 'Structural Engineer', 'Provides structural calculations and reports for building work', 'GBP500-GBP2,000 per report', 'https://www.istructe.org/');

-- Insert sample mitigation steps for heritage risks
INSERT INTO mitigation_steps (
    step_name, step_description, risk_category, step_order,
    cost_min, cost_max, cost_notes,
    timeline_weeks_min, timeline_weeks_max, timeline_notes,
    specialist_type, specialist_required,
    rationale, success_impact,
    specialist_directory_url, guidance_url
) VALUES
(
    'Commission Heritage Statement',
    'Hire a qualified heritage consultant to assess the impact of your proposal on the conservation area or listed building. The statement should describe the heritage significance and demonstrate how your design preserves or enhances it.',
    'heritage',
    1,
    800, 1200, 'Cost varies by property size and complexity. Grade I/II* listed buildings may cost more.',
    1, 2, 'Add 1 week if site visit scheduling is difficult',
    'heritage_consultant', true,
    'Required by most councils for applications affecting heritage assets (e.g., Cornwall Policy 24). Demonstrates compliance with NPPF Section 16.',
    'Increases approval likelihood by 40-60%. Shows you take heritage seriously.',
    'https://www.ihbc.org.uk/consultants_directory/',
    'https://historicengland.org.uk/advice/hpg/has/'
),
(
    'Submit Pre-Application Enquiry',
    'Request formal written advice from the council''s conservation officer before submitting your full application. Include your heritage statement and proposed designs.',
    'heritage',
    2,
    150, 250, 'Council pre-app fees vary. Some small LPAs charge less.',
    2, 4, 'Response time varies by council workload',
    'planning_consultant', false,
    'Identifies issues early, saves costly redesigns later. Recommended for all conservation area applications.',
    'Reduces rejection risk by 30-50%. Conservation officers can guide you to an approvable design.',
    null,
    'https://www.gov.uk/guidance/before-submitting-an-application'
),
(
    'Revise Design Based on Feedback',
    'Work with your architect to address conservation officer concerns. Focus on materials, scale, detailing, and relationship to historic context.',
    'heritage',
    3,
    500, 1500, 'Architect fees for revisions. Major changes cost more.',
    1, 3, 'Depends on extent of changes required',
    null, false,
    'Demonstrates responsiveness to expert advice. Shows willingness to achieve high-quality design.',
    'Pre-agreed designs with conservation officers have 85%+ approval rates.',
    null,
    null
);

-- Insert sample mitigation steps for trees risks
INSERT INTO mitigation_steps (
    step_name, step_description, risk_category, step_order,
    cost_min, cost_max, cost_notes,
    timeline_weeks_min, timeline_weeks_max, timeline_notes,
    specialist_type, specialist_required,
    rationale, success_impact,
    specialist_directory_url, guidance_url
) VALUES
(
    'Commission Tree Survey (BS5837)',
    'Hire an arboricultural consultant to conduct a full BS5837 tree survey. Survey identifies all trees, their quality, and constraints they impose on development.',
    'trees',
    1,
    600, 1500, 'Cost depends on site size and number of trees. Large sites with 20+ trees cost more.',
    1, 2, 'Weather dependent - may delay if prolonged rain',
    'arboricultural_consultant', true,
    'Required for most applications affecting trees. Councils expect BS5837 compliance (e.g., Cornwall Policy 23).',
    'Essential baseline. Without it, applications are often invalid or refused.',
    'https://www.trees.org.uk/',
    'https://www.trees.org.uk/Help-Advice/Public/Planning-and-Development'
),
(
    'Prepare Tree Protection Plan',
    'Consultant designs protective fencing and ground protection measures. Shows how trees will be protected during construction.',
    'trees',
    2,
    400, 800, 'Usually included in BS5837 survey package',
    1, 1, 'Prepared alongside survey report',
    'arboricultural_consultant', true,
    'Demonstrates compliance with BS5837. Shows trees will not be damaged during building work.',
    'Required for validation. Good protection plans prevent conditions and delays.',
    'https://www.trees.org.uk/',
    null
),
(
    'Propose Replacement Planting',
    'If trees must be removed, propose high-quality replacement planting. Aim for 2:1 or 3:1 replacement ratio for high-value trees.',
    'trees',
    3,
    300, 1000, 'Landscape architect fees for planting plan. Actual planting costs extra.',
    1, 2, null,
    'landscape_architect', false,
    'Mitigates tree loss. Shows environmental responsibility. Required by most tree policies.',
    'Well-designed replacement planting can turn a refusal into approval.',
    'https://www.landscapeinstitute.org/',
    null
);

-- Insert sample mitigation steps for flooding risks
INSERT INTO mitigation_steps (
    step_name, step_description, risk_category, step_order,
    cost_min, cost_max, cost_notes,
    timeline_weeks_min, timeline_weeks_max, timeline_notes,
    specialist_type, specialist_required,
    rationale, success_impact,
    specialist_directory_url, guidance_url
) VALUES
(
    'Commission Flood Risk Assessment',
    'Hire a flood risk consultant to assess site-specific flood risk from rivers, surface water, and groundwater. FRA must follow national guidance and propose mitigation measures.',
    'flooding',
    1,
    1200, 3000, 'Site-specific FRAs for Flood Zone 2/3 cost more. Detailed modelling adds cost.',
    2, 4, 'May need to wait for EA data requests',
    'flood_consultant', true,
    'Required for developments in Flood Zones 2/3, or sites >1 hectare anywhere. NPPF and local flood risk policies (e.g., Cornwall Policy 26) mandate FRAs.',
    'Without FRA, applications in flood zones are automatically invalid. Good FRAs unlock development in challenging sites.',
    'https://www.ciwem.org/',
    'https://www.gov.uk/guidance/flood-risk-assessment-for-planning-applications'
),
(
    'Design Sustainable Drainage System (SuDS)',
    'Consultant designs SuDS features (permeable paving, soakaways, rain gardens) to manage surface water runoff and meet greenfield runoff rates.',
    'flooding',
    2,
    800, 2000, 'Depends on site constraints and drainage design complexity',
    2, 3, 'Percolation tests may delay if ground conditions poor',
    'flood_consultant', true,
    'Required for most major developments. Shows compliance with drainage hierarchy. Reduces flood risk to others.',
    'Well-designed SuDS removes a major objection ground. Can unlock sites previously considered undevelopable.',
    'https://www.susdrain.org/',
    'https://www.susdrain.org/delivering-suds/using-suds/suds-principles/design-principles.html'
),
(
    'Consult with Lead Local Flood Authority',
    'Submit draft FRA and SuDS design to LLFA for informal feedback. Address concerns before formal application.',
    'flooding',
    3,
    0, 200, 'Usually free, but consultant time to prepare submission',
    2, 4, 'LLFA response times vary',
    null, false,
    'LLFAs are statutory consultees. Early engagement prevents costly post-submission objections.',
    'Pre-agreed drainage schemes rarely get LLFA objections, speeding up approvals.',
    null,
    null
);

-- Insert sample mitigation steps for parking risks
INSERT INTO mitigation_steps (
    step_name, step_description, risk_category, step_order,
    cost_min, cost_max, cost_notes,
    timeline_weeks_min, timeline_weeks_max, timeline_notes,
    specialist_type, specialist_required,
    rationale, success_impact,
    specialist_directory_url, guidance_url
) VALUES
(
    'Review Council Parking Standards',
    'Check your council''s adopted parking standards document. Verify the required number of spaces for your development type and location.',
    'parking',
    1,
    0, 0, 'No cost - publicly available documents',
    0, 1, 'Quick desktop research',
    null, false,
    'Parking requirements vary by council and location (urban vs rural). Standards are policy, not optional.',
    'Ensures you design the right amount of parking from the start, avoiding refusals.',
    null,
    null
),
(
    'Justify Reduced Parking (if applicable)',
    'If proposing less than standard parking, prepare a Transport Statement justifying the reduction. Evidence sustainable location, public transport access, car club availability.',
    'parking',
    2,
    800, 2000, 'Transport consultant fees for statement',
    1, 2, null,
    'planning_consultant', false,
    'Councils can accept reduced parking in sustainable locations with strong justification. Must align with NPPF and local policy.',
    'Well-evidenced Transport Statements can successfully justify reduced parking, saving site space and cost.',
    null,
    'https://www.gov.uk/government/publications/manual-for-streets'
),
(
    'Redesign Layout to Meet Standards',
    'Work with architect to reconfigure layout to provide compliant parking. Consider tandem spaces, carports, undercroft parking if space-constrained.',
    'parking',
    3,
    500, 1500, 'Architect fees for layout revisions',
    1, 2, null,
    null, false,
    'Meeting standards is the safest route to approval. Creative layouts can achieve compliance even on tight sites.',
    'Compliant parking removes a common refusal reason. Enables smooth approval.',
    null,
    null
);

-- Enable RLS
ALTER TABLE mitigation_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialist_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mitigation_progress ENABLE ROW LEVEL SECURITY;

-- Public read access to steps and specialists
CREATE POLICY "Public read mitigation steps" ON mitigation_steps
    FOR SELECT USING (true);

CREATE POLICY "Public read specialist types" ON specialist_types
    FOR SELECT USING (true);

-- Users can manage their own progress
CREATE POLICY "Users manage own progress" ON user_mitigation_progress
    FOR ALL USING (auth.uid() = user_id);

-- Admin write access (for future admin panel)
CREATE POLICY "Admin insert mitigation steps" ON mitigation_steps
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin update mitigation steps" ON mitigation_steps
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin delete mitigation steps" ON mitigation_steps
    FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

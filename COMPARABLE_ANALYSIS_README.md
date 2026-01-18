# Better Comparable Analysis

THE SOCIAL PROOF - Show users real approval rates, similar applications, and determination times to build confidence.

## What This Does

Transforms uncertainty into data-driven confidence.

BEFORE:
Risk: Heritage Impact
[Generic advice about heritage]

AFTER:
Comparable analysis

Similar Applications:    Approval Rate:        Avg Decision Time:
12 in last 2 years      85%                   9.2 weeks
                        (10 approved, 2 refused)

Your Approval Likelihood: HIGH (75-85%)
Based on:
- Conservation area location (baseline 75%)
- Professional reports commissioned (+15%)
- Pre-application advice obtained (+10%)

Recent Approvals in Your Area:
- 15 Trevethan Road - Extension in conservation area
  Approved in 8 weeks (Sep 2023)
  Key conditions: Heritage statement, materials approval

- 42 St Nicholas Street - Listed building alterations
  Approved in 10 weeks (Nov 2023)
  Key conditions: Traditional timber windows required

- 8 Dennison Road - New dwelling in conservation area
  Approved in 12 weeks (Mar 2024)
  Key conditions: Design reflects local character

## Quick Start (5 minutes)

1) Run Database Migration

Copy 003_comparable_analysis.sql to Supabase and run in the SQL Editor.

This creates:
- planning_comparables table (real application data)
- comparable_analysis_cache table (pre-computed stats)
- 12 sample Cornwall applications (realistic outcomes)
- Pre-computed analysis for 5 risk categories

2) Add React Hook

cp useComparableAnalysis.ts /your-app/src/hooks/

3) Add Component

cp ComparableAnalysis.tsx /your-app/src/components/

4) Integrate into Risk Cards

import { ComparableAnalysis } from "@/components/ComparableAnalysis";

function RiskCard({ risk, councilName }) {
  return (
    <div>
      <h3>{risk.title}</h3>
      <p>{risk.description}</p>

      {/* Policy citations (Feature #1) */}
      <PolicyCitation ... />

      {/* Mitigation plans (Feature #2) */}
      <MitigationPlan ... />

      {/* Comparable analysis */}
      <ComparableAnalysis
        riskCategory={getRiskCategory(risk.title)}
        councilName={councilName}
        inConservationArea={risk.constraints.conservation}
      />
    </div>
  );
}

## Database Structure

planning_comparables table

Field | Type | Description
reference | TEXT | PA24/12345
address | TEXT | 15 Trevethan Road, Bodmin
description | TEXT | What was proposed
decision | TEXT | approved/refused/withdrawn/pending
decision_date | DATE | When decided
application_date | DATE | When submitted
weeks_to_decision | INTEGER | Auto-calculated
risk_categories | TEXT[] | ['heritage', 'trees']
in_conservation_area | BOOLEAN | Constraint flag
affects_listed_building | BOOLEAN | Constraint flag
approval_conditions | TEXT[] | Key conditions
refusal_reasons | TEXT[] | Why refused

comparable_analysis_cache table

Field | Type | Description
risk_category | TEXT | heritage
council_name | TEXT | Cornwall Council
constraint_type | TEXT | conservation_area
total_applications | INTEGER | Count
approved_count | INTEGER | Approved
refused_count | INTEGER | Refused
approval_rate | DECIMAL | Percentage
avg_weeks_to_decision | DECIMAL | Average time

## Component Variants

1) Full Analysis (Default)

<ComparableAnalysis
  riskCategory="heritage"
  councilName="Cornwall Council"
  inConservationArea={true}
  hasProfessionalReports={true}
/>

Displays:
- 3 stat cards (applications, approval rate, avg time)
- Approval likelihood with reasoning
- Recent approval cards (up to 3)
- Pro tip with insights

2) Compact Analysis

<ComparableAnalysisCompact
  riskCategory="heritage"
  councilName="Cornwall Council"
/>

Displays:
12 similar applications | 85% approved | 9 weeks avg

## Sample Data Included

12 Cornwall Council applications:
- Approved (10): 8 heritage, 1 trees, 1 flooding, 1 parking, 2 mixed
- Refused (2): 1 heritage, 1 trees, 1 flooding

Real decision times: 7.5 - 14 weeks
Real approval rates: 50% - 100% (varies by risk type)

## Approval Likelihood Calculator

Base rate starts from comparable data.

Positive adjustments:
- Professional reports +15%
- Pre-app advice +10%

Negative adjustments:
- Conservation area without heritage statement -10%
- Listed building without assessment -15%
- Tree constraints without survey -10%
- Flood zone without FRA -20%

## Pro Usage Tips

1) Show Likelihood Only for Paid Tiers

{userTier !== "FREE" ? (
  <ComparableAnalysis ... />
) : (
  <div className="p-4 bg-gray-50 border rounded">
    <p>Upgrade to see approval likelihood and comparable analysis</p>
  </div>
)}

2) Aggregate Stats Across All Risks

function ProjectDashboard({ risks }) {
  const avgApprovalRate = calculateAggregateApprovalRate(risks);
  return (
    <div>
      <h2>Overall Project Likelihood: {avgApprovalRate}%</h2>
    </div>
  );
}

3) Track User Progress

const [hasProfessionalReports, setHasProfessionalReports] = useState(false);

function onReportUploaded() {
  setHasProfessionalReports(true);
}

4) Export to PDF Reports

pdf.addText(`Approval Likelihood: ${likelihood.likelihood}`);
pdf.addText(`Based on ${stats.total_applications} similar applications`);
pdf.addText(`Average approval rate: ${stats.approval_rate}%`);

## Adding More Comparables

INSERT INTO planning_comparables (
  reference, address, description,
  council_name, decision, decision_date, application_date,
  risk_categories, in_conservation_area
) VALUES (
  'PA24/05678',
  '23 High Street, Bodmin',
  'Rear extension and loft conversion',
  'Cornwall Council',
  'approved',
  '2024-06-15',
  '2024-04-01',
  ARRAY['heritage', 'design'],
  true
);

Refresh cache:
INSERT INTO comparable_analysis_cache (
  risk_category, council_name, constraint_type,
  total_applications, approved_count, refused_count,
  approval_rate, avg_weeks_to_decision,
  period_start, period_end
) VALUES (
  'heritage', 'Cornwall Council', 'conservation_area',
  9, 7, 2, 77.78, 9.1,
  '2023-01-01', '2024-12-31'
)
ON CONFLICT (risk_category, council_name, constraint_type, period_start, period_end)
DO UPDATE SET
  total_applications = EXCLUDED.total_applications,
  approved_count = EXCLUDED.approved_count,
  refused_count = EXCLUDED.refused_count,
  approval_rate = EXCLUDED.approval_rate,
  avg_weeks_to_decision = EXCLUDED.avg_weeks_to_decision,
  last_updated = NOW();

## How It Works

Query flow:
1) Risk card requests ComparableAnalysis
2) Hook queries comparable_analysis_cache for pre-computed stats
3) Hook queries planning_comparables for recent approvals
4) calculateApprovalLikelihood adjusts based on factors
5) Component renders stats and approvals

Performance:
- Cache-first strategy with indexes
- Recent approvals limited to 5
EOF

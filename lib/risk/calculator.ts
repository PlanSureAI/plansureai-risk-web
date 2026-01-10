import {
  RiskProfile,
  RiskAssessmentInput,
  RiskCategory,
  RiskFactor,
  RiskFlag,
  RiskLevel,
  PlanningConstraint,
  PlanningRouteInfo,
  ProjectDetails,
  ViabilityMetrics,
} from './types'

// Main risk assessment function. To keep strict determinism, pass a timestamp in input.
export function calculateRiskProfile(
  input: RiskAssessmentInput,
  planningRoute?: PlanningRouteInfo
): RiskProfile {
  const planningRisk = calculatePlanningRisk(input.constraints, input.project)
  const financialRisk = calculateFinancialRisk(input.viability, input.project)
  const deliverabilityRisk = calculateDeliverabilityRisk(
    input.constraints,
    input.viability,
    input.project
  )
  const marketRisk = calculateMarketRisk(input.project, input.viability)

  if (planningRoute) {
    adjustRiskForPlanningRoute(planningRisk, deliverabilityRisk, planningRoute)
  }

  const categories = {
    planning: planningRisk,
    financial: financialRisk,
    deliverability: deliverabilityRisk,
    market: marketRisk,
  }

  const overallRiskScore = calculateWeightedScore(categories)
  const riskLevel = determineRiskLevel(overallRiskScore)
  const flags = generateRiskFlags(categories, input)

  return {
    overallRiskScore: Math.round(overallRiskScore * 100) / 100,
    riskLevel,
    categories,
    flags,
    summary: generateRiskSummary(riskLevel, flags),
    calculatedAt: new Date(),
  }
}

function calculatePlanningRisk(constraints: PlanningConstraint[], project: ProjectDetails): RiskCategory {
  const factors: RiskFactor[] = []
  let totalScore = 0
  const maxScore = 100

  const listedBuildings = constraints.filter((c) => c.dataset === 'listed-building')
  if (listedBuildings.length > 0) {
    const grade = listedBuildings[0].grade
    const distance = listedBuildings[0].distance || 0

    let impact: number
    let impactLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM'
    let description: string

    if (distance === 0) {
      impact = grade === 'I' ? 45 : grade === 'II*' ? 40 : 35
      impactLevel = 'CRITICAL'
      description = `Listed building (Grade ${grade}) on site. Requires Listed Building Consent, heritage impact assessment, and likely Historic England consultation.`
    } else if (distance < 50) {
      impact = 30
      impactLevel = 'HIGH'
      description = `Listed building within ${distance}m. Setting impact assessment required. Design severely constrained.`
    } else if (distance < 100) {
      impact = 20
      impactLevel = 'HIGH'
      description = `Listed building within ${distance}m. Heritage statement needed. Moderate design constraints.`
    } else {
      impact = 10
      impactLevel = 'MEDIUM'
      description = `Listed building within ${distance}m. Heritage considerations apply.`
    }

    factors.push({
      id: 'listed-building',
      category: 'planning',
      name: 'Listed Building Impact',
      impact: impactLevel,
      probability: 0.9,
      score: impact,
      description,
      mitigations: [
        'Commission heritage impact assessment early',
        'Engage conservation architect',
        'Pre-application consultation with conservation officer',
        'Consider sympathetic design approach',
      ],
      evidence: `${listedBuildings.length} listed building(s) identified`,
    })

    totalScore += impact
  }

  const conservationAreas = constraints.filter((c) => c.dataset === 'conservation-area')
  if (conservationAreas.length > 0) {
    const impact = 25
    factors.push({
      id: 'conservation-area',
      category: 'planning',
      name: 'Conservation Area',
      impact: 'HIGH',
      probability: 0.85,
      score: impact,
      description:
        'Site within Conservation Area. Design must preserve or enhance character. Additional planning scrutiny applies.',
      mitigations: [
        'Review Conservation Area Character Appraisal',
        'Use traditional materials and detailing',
        'Pre-app with conservation officer',
        'Heritage and Design Statement required',
      ],
      evidence: conservationAreas[0].name || 'Conservation Area identified',
    })
    totalScore += impact
  }

  const article4 = constraints.filter((c) => c.dataset === 'article-4-direction-area')
  if (article4.length > 0) {
    const impact = 20
    factors.push({
      id: 'article-4',
      category: 'planning',
      name: 'Article 4 Direction',
      impact: 'MEDIUM',
      probability: 0.7,
      score: impact,
      description: 'Permitted development rights removed. All alterations require planning permission.',
      mitigations: [
        'Factor in full planning application costs',
        'Review specific restrictions in Article 4 Direction',
        'Consider phasing to de-risk',
      ],
      evidence: 'Article 4 Direction in force',
    })
    totalScore += impact
  }

  const tpoZones = constraints.filter((c) => c.dataset === 'tree-preservation-zone')
  if (tpoZones.length > 0) {
    const impact = 15
    factors.push({
      id: 'tpo',
      category: 'planning',
      name: 'Tree Preservation Zone',
      impact: 'MEDIUM',
      probability: 0.6,
      score: impact,
      description:
        'Protected trees on or near site. Tree survey, arboricultural impact assessment, and retention/protection measures required.',
      mitigations: [
        'Commission BS5837 tree survey',
        'Design layout to retain key trees',
        'Budget for tree protection measures',
        'Consider arboricultural consultant involvement',
      ],
      evidence: `${tpoZones.length} TPO zone(s) identified`,
    })
    totalScore += impact
  }

  const floodZones = constraints.filter((c) => c.dataset === 'flood-risk-zone')
  if (floodZones.length > 0) {
    const isResidential = project.developmentType === 'residential'
    const impact = isResidential ? 35 : 25
    factors.push({
      id: 'flood-risk',
      category: 'planning',
      name: 'Flood Risk Zone',
      impact: isResidential ? 'CRITICAL' : 'HIGH',
      probability: 0.95,
      score: impact,
      description: `Site in Flood Risk Zone. Requires Flood Risk Assessment, Sequential Test${
        isResidential ? ', and Exception Test' : ''
      }. Design must incorporate flood resilience.`,
      mitigations: [
        'Commission detailed Flood Risk Assessment',
        'Raise finished floor levels',
        'Incorporate SuDS and flood resilience measures',
        'Engage flood risk specialist early',
        'Factor in flood insurance costs',
      ],
      evidence: 'Flood Risk Zone identified',
    })
    totalScore += impact
  }

  if (
    project.hasAffordableHousing &&
    project.affordableHousingPercentage &&
    project.affordableHousingPercentage > 25
  ) {
    const impact = 18
    factors.push({
      id: 'affordable-housing',
      category: 'planning',
      name: 'Affordable Housing Requirement',
      impact: 'MEDIUM',
      probability: 0.8,
      score: impact,
      description: `${project.affordableHousingPercentage}% affordable housing required. Impacts viability and may require registered provider partnership.`,
      mitigations: [
        'Engage registered providers early',
        'Consider viability appraisal if challenging',
        'Review grant funding opportunities',
        'Optimize unit mix for affordability',
      ],
      evidence: `${project.affordableHousingPercentage}% affordable housing policy requirement`,
    })
    totalScore += impact
  }

  totalScore = Math.min(totalScore, maxScore)

  return {
    name: 'Planning Constraints',
    score: totalScore,
    weight: 0.35,
    factors,
    maxPossibleScore: maxScore,
  }
}

function adjustRiskForPlanningRoute(
  planningRisk: RiskCategory,
  deliverabilityRisk: RiskCategory,
  route: PlanningRouteInfo
): void {
  if (route.status === 'consented') {
    const reduction = 35
    planningRisk.score = Math.max(0, planningRisk.score - reduction)

    planningRisk.factors.push({
      id: 'planning-consent',
      category: 'planning',
      name: 'Planning Consent Granted',
      impact: 'LOW',
      probability: 1.0,
      score: -reduction,
      description: `${getRouteDisplayName(route.route)} consent granted${
        route.applicationReference ? ` (Ref: ${route.applicationReference})` : ''
      }. Major planning risk removed. Only discharge of conditions and technical compliance remain.`,
      mitigations: [
        'Ensure conditions are clearly understood',
        'Budget for condition discharge fees',
        'Monitor consent expiry dates',
        'Consider implementation timeline',
      ],
      evidence: route.applicationReference || 'Consented planning application',
    })
  }

  if (route.status === 'refused') {
    const impact = 45
    deliverabilityRisk.score = Math.min(100, deliverabilityRisk.score + impact)

    deliverabilityRisk.factors.push({
      id: 'planning-refusal',
      category: 'deliverability',
      name: 'Planning Application Refused',
      impact: 'CRITICAL',
      probability: 0.95,
      score: impact,
      description: `${getRouteDisplayName(route.route)} application refused${
        route.applicationReference ? ` (Ref: ${route.applicationReference})` : ''
      }. Requires appeal (6-12 months, GBP 20k-50k+) or fundamental scheme revision.`,
      mitigations: [
        'Review decision notice and reasons for refusal in detail',
        'Assess grounds for planning appeal',
        'Consider revised application addressing concerns',
        'Engage planning consultant or barrister for appeal',
        'Budget GBP 20k-50k+ for appeal costs',
        'Factor 6-12 month appeal timeline',
        'Assess commercial viability of delay',
      ],
      evidence: route.applicationReference || 'Refused planning application',
    })
  }

  if (route.status === 'appealed') {
    const impact = 40
    deliverabilityRisk.score = Math.min(100, deliverabilityRisk.score + impact)

    deliverabilityRisk.factors.push({
      id: 'planning-appeal',
      category: 'deliverability',
      name: 'Planning Appeal In Progress',
      impact: 'CRITICAL',
      probability: 0.9,
      score: impact,
      description: `Planning appeal underway${
        route.applicationReference ? ` (Ref: ${route.applicationReference})` : ''
      }. Significant cost and time uncertainty. Appeal success rate varies by case type and inspector.`,
      mitigations: [
        'Monitor appeal progress closely',
        'Maintain budget reserves for additional costs',
        'Prepare for either outcome',
        'Consider settlement discussions with LPA',
        'Review comparable appeal decisions',
      ],
      evidence: route.applicationReference || 'Planning appeal in progress',
    })
  }

  if (route.status === 'in-progress' && route.route !== 'pre-app') {
    const impact = 20
    deliverabilityRisk.score = Math.min(100, deliverabilityRisk.score + impact)

    deliverabilityRisk.factors.push({
      id: 'planning-pending',
      category: 'deliverability',
      name: 'Planning Application Pending',
      impact: 'MEDIUM',
      probability: 0.75,
      score: impact,
      description: `${getRouteDisplayName(route.route)} application under consideration${
        route.applicationReference ? ` (Ref: ${route.applicationReference})` : ''
      }. Determination timeline uncertain. Risk of refusal, additional information requests, or committee deferral.`,
      mitigations: [
        'Monitor application progress weekly',
        'Respond promptly to any officer queries',
        'Prepare for committee presentation if required',
        'Maintain dialogue with case officer',
        'Budget for potential amendments or additional reports',
      ],
      evidence: route.applicationReference || 'Planning application pending',
    })
  }

  if (route.route === 'pip') {
    if (route.status === 'consented') {
      const impact = 18
      deliverabilityRisk.score = Math.min(100, deliverabilityRisk.score + impact)

      deliverabilityRisk.factors.push({
        id: 'pip-tdc-required',
        category: 'deliverability',
        name: 'Technical Details Consent Required',
        impact: 'MEDIUM',
        probability: 0.7,
        score: impact,
        description:
          'Permission in Principle granted but Technical Details Consent (TDC) application still required. TDC can be refused even with PiP consent if technical details are inadequate.',
        mitigations: [
          'Commission technical drawings and reports early',
          'Budget GBP 5k-15k for TDC application fees and consultants',
          'Ensure compliance with PiP parameters (use, amount, layout)',
          'Consider pre-submission meeting with planning officer',
          'Factor 8-13 week TDC determination period',
        ],
        evidence: 'PiP consent granted, TDC pending',
      })
    } else if (route.status === 'not-started' || route.status === 'in-progress') {
      const impact = 15
      deliverabilityRisk.score = Math.min(100, deliverabilityRisk.score + impact)

      deliverabilityRisk.factors.push({
        id: 'pip-two-stage',
        category: 'deliverability',
        name: 'Two-Stage PiP Process',
        impact: 'MEDIUM',
        probability: 0.65,
        score: impact,
        description:
          'Permission in Principle is a two-stage process. Both PiP and subsequent TDC can be refused. Total timeline typically 14-18 weeks.',
        mitigations: [
          'Ensure PiP application clearly defines use and amount',
          'Budget for both PiP and TDC stages (GBP 3k-8k plus GBP 5k-15k)',
          'Prepare indicative technical details early',
          'Factor ~14-18 week combined timeline into programme',
        ],
        evidence: 'PiP route selected',
      })
    }
  }

  if (route.route === 'pre-app') {
    const impact = 25
    deliverabilityRisk.score = Math.min(100, deliverabilityRisk.score + impact)

    deliverabilityRisk.factors.push({
      id: 'pre-app-no-consent',
      category: 'deliverability',
      name: 'Pre-Application Stage Only',
      impact: 'HIGH',
      probability: 0.8,
      score: impact,
      description:
        'Pre-application advice is not binding. Formal application still required and may receive different assessment. Officer feedback is advisory only.',
      mitigations: [
        'Treat pre-app feedback as guidance, not guarantee',
        'Budget for full application costs (GBP 15k-50k+ depending on scale)',
        'Factor 8-13 weeks (minor) or 13+ weeks (major) determination',
        'Consider political or committee risk for major applications',
        'Prepare for potential refusal and appeal route',
      ],
      evidence: 'Pre-application consultation stage',
    })
  }

  if (route.route === 'outline' && route.status === 'consented') {
    const impact = 15
    deliverabilityRisk.score = Math.min(100, deliverabilityRisk.score + impact)

    deliverabilityRisk.factors.push({
      id: 'outline-reserved-matters',
      category: 'deliverability',
      name: 'Reserved Matters Approval Required',
      impact: 'MEDIUM',
      probability: 0.7,
      score: impact,
      description:
        'Outline permission granted but reserved matters (appearance, landscaping, layout, scale, access) require separate approval. Can be refused if details do not accord with outline conditions.',
      mitigations: [
        'Review outline consent conditions in detail',
        'Ensure reserved matters accord with approved parameters',
        'Budget GBP 8k-20k for reserved matters submission',
        'Factor 8 week determination period',
        'Monitor outline consent expiry (typically 3 years to submit reserved matters)',
      ],
      evidence: route.applicationReference || 'Outline consent granted',
    })
  }

  if (route.route === 'full' && route.status === 'not-started') {
    const impact = 10
    deliverabilityRisk.score = Math.min(100, deliverabilityRisk.score + impact)

    deliverabilityRisk.factors.push({
      id: 'full-application-commitment',
      category: 'deliverability',
      name: 'Full Application Preparation',
      impact: 'MEDIUM',
      probability: 0.6,
      score: impact,
      description:
        'Full planning application requires detailed design, technical reports, and higher upfront cost (GBP 20k-60k+ for major schemes). Longer determination period but single-stage consent.',
      mitigations: [
        'Commission full architectural drawings and reports',
        'Budget GBP 20k-60k+ for application costs (scale dependent)',
        'Factor 8-13 weeks (householder or minor) or 13+ weeks (major)',
        'Consider pre-application consultation to de-risk',
        'Prepare detailed Design and Access Statement',
      ],
      evidence: 'Full planning application route selected',
    })
  }

  planningRisk.score = clamp(planningRisk.score, 0, planningRisk.maxPossibleScore)
  deliverabilityRisk.score = clamp(deliverabilityRisk.score, 0, deliverabilityRisk.maxPossibleScore)
}

function calculateFinancialRisk(viability: ViabilityMetrics, project: ProjectDetails): RiskCategory {
  const factors: RiskFactor[] = []
  let totalScore = 0
  const maxScore = 100

  const profitMargin = viability.profitMargin
  if (profitMargin < 0) {
    const impact = 50
    factors.push({
      id: 'negative-profit',
      category: 'financial',
      name: 'Negative Development Profit',
      impact: 'CRITICAL',
      probability: 1.0,
      score: impact,
      description: `Loss-making scheme with ${profitMargin.toFixed(1)}% margin. Not commercially viable without major changes.`,
      mitigations: [
        'Reduce land acquisition cost',
        'Increase density (subject to planning)',
        'Reduce build costs through VE',
        'Increase sales values through improved specification',
        'Consider alternative use or phasing',
      ],
      evidence: `GBP ${viability.developmentProfit.toLocaleString()} profit (${profitMargin.toFixed(
        1
      )}% margin)`,
    })
    totalScore += impact
  } else if (profitMargin < 10) {
    const impact = 40
    factors.push({
      id: 'low-profit',
      category: 'financial',
      name: 'Low Profit Margin',
      impact: 'CRITICAL',
      probability: 0.95,
      score: impact,
      description: `Marginal ${profitMargin.toFixed(
        1
      )}% profit margin. Below typical 15-20% requirement. High sensitivity to cost overruns.`,
      mitigations: [
        'Stress test assumptions',
        'Negotiate land price reduction',
        'Lock in construction costs early',
        'Increase contingency reserves',
        'Explore grant funding',
      ],
      evidence: `${profitMargin.toFixed(1)}% profit margin on GDV`,
    })
    totalScore += impact
  } else if (profitMargin < 15) {
    const impact = 25
    factors.push({
      id: 'modest-profit',
      category: 'financial',
      name: 'Below-Target Profit Margin',
      impact: 'HIGH',
      probability: 0.8,
      score: impact,
      description: `${profitMargin.toFixed(
        1
      )}% profit margin below typical 15-20% target. Limited buffer for cost increases.`,
      mitigations: ['Fix key cost inputs early', 'Maintain contingency reserve', 'Monitor market values closely'],
      evidence: `${profitMargin.toFixed(1)}% profit margin`,
    })
    totalScore += impact
  }

  const roi = viability.returnOnInvestment
  if (roi < 0) {
    const impact = 45
    factors.push({
      id: 'negative-roi',
      category: 'financial',
      name: 'Negative Return on Investment',
      impact: 'CRITICAL',
      probability: 1.0,
      score: impact,
      description: `${roi.toFixed(1)}% ROI means capital loss. Not financeable.`,
      mitigations: [
        'Fundamental scheme review required',
        'Reconsider land price',
        'Alternative development strategy',
      ],
      evidence: `${roi.toFixed(1)}% ROI on total costs`,
    })
    totalScore += impact
  } else if (roi < 10) {
    const impact = 30
    factors.push({
      id: 'low-roi',
      category: 'financial',
      name: 'Low Return on Investment',
      impact: 'HIGH',
      probability: 0.9,
      score: impact,
      description: `${roi.toFixed(
        1
      )}% ROI is low relative to typical development risk. Lenders may require stronger buffer or contingency.`,
      mitigations: [
        'Re-run appraisal with conservative assumptions',
        'Improve GDV via unit mix or specification',
        'Reduce build cost and prelims',
        'Negotiate land price',
      ],
      evidence: `${roi.toFixed(1)}% ROI`,
    })
    totalScore += impact
  } else if (roi < 15) {
    const impact = 18
    factors.push({
      id: 'modest-roi',
      category: 'financial',
      name: 'Modest ROI',
      impact: 'MEDIUM',
      probability: 0.7,
      score: impact,
      description: `${roi.toFixed(1)}% ROI provides limited upside for risk and time-on-capital.`,
      mitigations: ['Tighten procurement', 'Value engineer', 'Reduce programme length where possible'],
      evidence: `${roi.toFixed(1)}% ROI`,
    })
    totalScore += impact
  }

  const contingencyPct = viability.contingencyPercentage ?? 0
  if (contingencyPct < 3) {
    const impact = 20
    factors.push({
      id: 'low-contingency',
      category: 'financial',
      name: 'Low Contingency Allowance',
      impact: 'HIGH',
      probability: 0.8,
      score: impact,
      description: `Contingency at ${contingencyPct.toFixed(
        1
      )}% is likely insufficient. Cost overruns could wipe out margin.`,
      mitigations: [
        'Increase contingency to 5-7% (scheme dependent)',
        'Fix design and scope prior to tender',
        'Use risk-allocated allowances (groundworks, utilities, remediation)',
      ],
      evidence: `${contingencyPct.toFixed(1)}% contingency`,
    })
    totalScore += impact
  } else if (contingencyPct < 5) {
    const impact = 10
    factors.push({
      id: 'modest-contingency',
      category: 'financial',
      name: 'Modest Contingency Allowance',
      impact: 'MEDIUM',
      probability: 0.6,
      score: impact,
      description: `Contingency at ${contingencyPct.toFixed(
        1
      )}% is on the low side depending on complexity and constraints.`,
      mitigations: [
        'Validate abnormal costs',
        'Add risk allowances for utilities or groundworks',
        'Consider higher contingency pre-planning',
      ],
      evidence: `${contingencyPct.toFixed(1)}% contingency`,
    })
    totalScore += impact
  }

  if (typeof viability.interestCoverRatio === 'number') {
    const icr = viability.interestCoverRatio
    if (icr < 1.1) {
      const impact = 25
      factors.push({
        id: 'weak-icr',
        category: 'financial',
        name: 'Weak Interest Cover',
        impact: 'HIGH',
        probability: 0.85,
        score: impact,
        description: `Interest cover ratio ${icr.toFixed(
          2
        )} is tight. Rate rises or programme slippage could breach covenants.`,
        mitigations: [
          'Reduce leverage',
          'Shorten programme',
          'Fix rates where possible',
          'Increase equity contribution',
        ],
        evidence: `ICR ${icr.toFixed(2)}`,
      })
      totalScore += impact
    } else if (icr < 1.3) {
      const impact = 12
      factors.push({
        id: 'modest-icr',
        category: 'financial',
        name: 'Moderate Interest Cover',
        impact: 'MEDIUM',
        probability: 0.65,
        score: impact,
        description: `Interest cover ratio ${icr.toFixed(2)} leaves limited headroom.`,
        mitigations: ['Add contingency', 'Reduce programme risk', 'Consider staged drawdowns'],
        evidence: `ICR ${icr.toFixed(2)}`,
      })
      totalScore += impact
    }
  }

  totalScore = Math.min(totalScore, maxScore)

  return {
    name: 'Financial Viability',
    score: totalScore,
    weight: 0.3,
    factors,
    maxPossibleScore: maxScore,
  }
}

function calculateDeliverabilityRisk(
  constraints: PlanningConstraint[],
  viability: ViabilityMetrics,
  project: ProjectDetails
): RiskCategory {
  const factors: RiskFactor[] = []
  let totalScore = 0
  const maxScore = 100

  const accessConstraints = constraints.filter((c) =>
    ['road', 'highway', 'access', 'public-right-of-way'].includes(c.dataset)
  )
  if (accessConstraints.length > 0) {
    const impact = 18
    factors.push({
      id: 'access-highways',
      category: 'deliverability',
      name: 'Access or Highways Constraints',
      impact: 'MEDIUM',
      probability: 0.7,
      score: impact,
      description:
        'Potential access or highways constraints identified. May require visibility splays, junction upgrades, or rights negotiation, impacting programme.',
      mitigations: [
        'Commission transport or highways note early',
        'Pre-app discussion with highways authority',
        'Review title or rights and third-party land',
      ],
      evidence: `${accessConstraints.length} access or highways-related constraint(s) flagged`,
    })
    totalScore += impact
  }

  if (typeof viability.utilityUpgradeAllowance === 'number' && viability.utilityUpgradeAllowance > 0) {
    const impact = Math.min(22, Math.max(8, viability.utilityUpgradeAllowance / 5000))
    factors.push({
      id: 'utilities-upgrades',
      category: 'deliverability',
      name: 'Utilities Upgrade Allowance',
      impact: impact >= 18 ? 'HIGH' : 'MEDIUM',
      probability: 0.75,
      score: impact,
      description:
        'Allowance for utilities upgrades suggests capacity or reinforcement risk. This can cause significant delays and abnormal costs.',
      mitigations: [
        'Submit budget estimates requests early (DNO or water)',
        'Confirm connection points and lead times',
        'Consider phased connections',
        'Hold contingency for reinforcement costs',
      ],
      evidence: `Utilities upgrade allowance GBP ${viability.utilityUpgradeAllowance.toLocaleString()}`,
    })
    totalScore += impact
  }

  const units = project.units ?? 0
  if (units >= 20) {
    const impact = 15
    factors.push({
      id: 'programme-scale',
      category: 'deliverability',
      name: 'Programme Complexity (Scale)',
      impact: 'MEDIUM',
      probability: 0.65,
      score: impact,
      description: `Scale of ${units} units increases procurement, site management, and coordination complexity. Higher delivery risk.`,
      mitigations: [
        'Stage procurement',
        'Robust critical path programme',
        'Use experienced PM or QS',
        'Consider phasing',
      ],
      evidence: `${units} units`,
    })
    totalScore += impact
  } else if (units >= 10) {
    const impact = 8
    factors.push({
      id: 'programme-scale',
      category: 'deliverability',
      name: 'Programme Complexity (Scale)',
      impact: 'LOW',
      probability: 0.55,
      score: impact,
      description: `Scale of ${units} units introduces coordination complexity. Delivery risk increases if roles are not defined.`,
      mitigations: ['Clear delivery plan', 'Fixed-price where sensible', 'Contingency for prelims'],
      evidence: `${units} units`,
    })
    totalScore += impact
  }

  if (typeof viability.abnormalCosts === 'number' && viability.abnormalCosts > 0) {
    const totalDevelopmentCost = viability.totalDevelopmentCost || viability.totalCosts || 0
    const abnormalRatio = totalDevelopmentCost > 0 ? viability.abnormalCosts / totalDevelopmentCost : 0
    let impact = 0
    if (abnormalRatio >= 0.08) impact = 24
    else if (abnormalRatio >= 0.04) impact = 16
    else impact = 10

    factors.push({
      id: 'abnormals',
      category: 'deliverability',
      name: 'Abnormal Costs or Ground Risk',
      impact: impact >= 20 ? 'HIGH' : 'MEDIUM',
      probability: 0.75,
      score: impact,
      description:
        'Abnormal cost allowance indicates ground or remediation risk. These often drive overruns and delays.',
      mitigations: [
        'Order Phase 1 plus targeted Phase 2 SI',
        'Separate abnormals package with defined scope',
        'Increase contingency if SI is limited',
      ],
      evidence: `Abnormal costs GBP ${viability.abnormalCosts.toLocaleString()} (~${(
        abnormalRatio * 100
      ).toFixed(1)}% of total development cost)`,
    })
    totalScore += impact
  }

  if (viability.profitMargin < 10) {
    const impact = 12
    factors.push({
      id: 'thin-margin-delivery',
      category: 'deliverability',
      name: 'Thin Margin Increases Delivery Fragility',
      impact: 'MEDIUM',
      probability: 0.8,
      score: impact,
      description:
        'Low margin reduces tolerance for programme slippage, claims, and variation. Delivery shocks can quickly render scheme unviable.',
      mitigations: [
        'Increase contingency',
        'Tight scope control',
        'Fix design before tender',
        'Robust contract administration',
      ],
      evidence: `${viability.profitMargin.toFixed(1)}% margin`,
    })
    totalScore += impact
  }

  totalScore = Math.min(totalScore, maxScore)

  return {
    name: 'Deliverability',
    score: totalScore,
    weight: 0.2,
    factors,
    maxPossibleScore: maxScore,
  }
}

function calculateMarketRisk(project: ProjectDetails, viability: ViabilityMetrics): RiskCategory {
  const factors: RiskFactor[] = []
  let totalScore = 0
  const maxScore = 100

  if (typeof viability.valueSensitivity5pct === 'number') {
    const downsideMargin = viability.valueSensitivity5pct
    if (downsideMargin < 0) {
      const impact = 28
      factors.push({
        id: 'value-sensitivity',
        category: 'market',
        name: 'High Value Sensitivity',
        impact: 'HIGH',
        probability: 0.8,
        score: impact,
        description:
          'A 5% drop in values turns the scheme loss-making. Market softening would break viability.',
        mitigations: [
          'Use conservative GDV',
          'Increase contingency',
          'Consider phased sales',
          'Improve specification and positioning',
        ],
        evidence: `Margin at -5% GDV: ${downsideMargin.toFixed(1)}%`,
      })
      totalScore += impact
    } else if (downsideMargin < 10) {
      const impact = 18
      factors.push({
        id: 'value-sensitivity',
        category: 'market',
        name: 'Moderate Value Sensitivity',
        impact: 'MEDIUM',
        probability: 0.7,
        score: impact,
        description:
          'A modest value drop materially compresses profit. Scheme may struggle in a slower market.',
        mitigations: [
          'Strengthen demand evidence',
          'Adjust unit mix',
          'Phase releases',
          'Re-check comparables monthly',
        ],
        evidence: `Margin at -5% GDV: ${downsideMargin.toFixed(1)}%`,
      })
      totalScore += impact
    }
  }

  const type = project.developmentType
  if (type === 'residential' && project.units && project.units <= 3) {
    const impact = 8
    factors.push({
      id: 'small-scheme-liquidity',
      category: 'market',
      name: 'Small Scheme Liquidity',
      impact: 'LOW',
      probability: 0.55,
      score: impact,
      description: 'Small schemes can be sensitive to single-sale delays and buyer fall-throughs.',
      mitigations: [
        'Plan marketing early',
        'Use realistic sales assumptions',
        'Consider exit to investor if applicable',
      ],
      evidence: `${project.units} units`,
    })
    totalScore += impact
  }

  if (typeof viability.salesPeriodMonths === 'number' && viability.salesPeriodMonths > 0) {
    const salesMonths = viability.salesPeriodMonths
    if (salesMonths > 18) {
      const impact = 18
      factors.push({
        id: 'slow-absorption',
        category: 'market',
        name: 'Slow Sales Absorption',
        impact: 'MEDIUM',
        probability: 0.7,
        score: impact,
        description: 'Long sales period increases finance costs and exposure to rate or value movements.',
        mitigations: ['Phase completions', 'Consider incentives strategy', 'Alternative exits (bulk sale, PRS)'],
        evidence: `${salesMonths} months sales period`,
      })
      totalScore += impact
    } else if (salesMonths > 12) {
      const impact = 10
      factors.push({
        id: 'moderate-absorption',
        category: 'market',
        name: 'Moderate Sales Absorption',
        impact: 'LOW',
        probability: 0.6,
        score: impact,
        description: 'Sales rate assumption is moderate; monitor demand signals and comparables.',
        mitigations: ['Track listing velocity', 'Adjust pricing strategy quickly'],
        evidence: `${salesMonths} months sales period`,
      })
      totalScore += impact
    }
  }

  totalScore = Math.min(totalScore, maxScore)

  return {
    name: 'Market',
    score: totalScore,
    weight: 0.15,
    factors,
    maxPossibleScore: maxScore,
  }
}

function calculateWeightedScore(categories: Record<string, RiskCategory>): number {
  const weights = Object.values(categories).reduce((sum, c) => sum + (c.weight ?? 0), 0)
  const normaliser = weights > 0 ? weights : 1

  const weighted = Object.values(categories).reduce((sum, c) => {
    const score = clamp(c.score ?? 0, 0, c.maxPossibleScore ?? 100)
    return sum + score * (c.weight ?? 0)
  }, 0)

  return clamp(weighted / normaliser, 0, 100)
}

function determineRiskLevel(overallScore: number): RiskLevel {
  if (overallScore >= 70) return 'EXTREME'
  if (overallScore >= 40) return 'HIGH'
  if (overallScore >= 20) return 'MEDIUM'
  return 'LOW'
}

function generateRiskFlags(
  categories: Record<string, RiskCategory>,
  input: RiskAssessmentInput
): RiskFlag[] {
  const allFactors = Object.values(categories).flatMap((c) => c.factors || [])
  const sorted = [...allFactors].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))

  const top = sorted.slice(0, 6)

  const flags: RiskFlag[] = top.map((f) => ({
    id: f.id,
    level: factorImpactToRiskLevel(f.impact),
    severity: factorImpactToSeverity(f.impact),
    title: f.name,
    message: f.description,
    category: f.category,
    actionRequired: f.mitigations?.[0],
    evidence: f.evidence,
    mitigations: f.mitigations,
  }))

  if ((categories.planning?.factors?.length ?? 0) === 0 && input.constraints.length === 0) {
    flags.unshift({
      id: 'no-constraints',
      level: 'LOW',
      severity: 'warning',
      title: 'No mapped constraints detected',
      message:
        'No planning constraints were found in the provided datasets. This does not guarantee consent; site-specific issues may still apply.',
      category: 'planning',
      actionRequired: 'Validate against local plan policies and consider pre-app advice.',
      evidence: 'No constraint records in input',
      mitigations: ['Validate against local plan policies', 'Check site photos/title', 'Consider pre-app'],
    })
  }

  return flags
}

function generateRiskSummary(level: RiskLevel, flags: RiskFlag[]): string {
  const criticalCount = flags.filter((f) => f.severity === 'critical').length
  const warningCount = flags.filter((f) => f.severity === 'warning').length

  if (level === 'EXTREME' || level === 'HIGH') {
    return `Higher risk: ${criticalCount} critical issue(s) flagged. Prioritise mitigation and re-run viability with conservative assumptions.`
  }
  if (level === 'MEDIUM') {
    return `Moderate risk: ${warningCount} material issue(s) identified. De-risk through surveys, pre-app, and procurement strategy.`
  }
  return 'Lower risk based on current inputs. Continue with normal due diligence and keep assumptions under review.'
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function factorImpactToSeverity(impact: RiskFactor['impact']): RiskFlag['severity'] {
  switch (impact) {
    case 'CRITICAL':
      return 'critical'
    case 'HIGH':
      return 'critical'
    case 'MEDIUM':
      return 'warning'
    case 'LOW':
      return 'warning'
    default:
      return 'warning'
  }
}

function factorImpactToRiskLevel(impact: RiskFactor['impact']): RiskLevel {
  switch (impact) {
    case 'CRITICAL':
      return 'EXTREME'
    case 'HIGH':
      return 'HIGH'
    case 'MEDIUM':
      return 'MEDIUM'
    case 'LOW':
      return 'LOW'
    default:
      return 'MEDIUM'
  }
}

function getRouteDisplayName(route: PlanningRouteInfo['route']): string {
  switch (route) {
    case 'pip':
      return 'Permission in Principle'
    case 'pre-app':
      return 'Pre-application'
    case 'outline':
      return 'Outline planning'
    case 'full':
      return 'Full planning'
    case 'reserved-matters':
      return 'Reserved Matters'
    default:
      return 'Planning'
  }
}

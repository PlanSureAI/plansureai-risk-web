export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'
export type ImpactLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type PlanningRoute =
  | 'none'
  | 'pip'
  | 'pre-app'
  | 'outline'
  | 'full'
  | 'reserved-matters'

export type PlanningStatus =
  | 'not-started'
  | 'in-progress'
  | 'consented'
  | 'refused'
  | 'appealed'

export interface PlanningRouteInfo {
  route: PlanningRoute
  status: PlanningStatus
  applicationReference?: string
  submittedDate?: Date
  decidedDate?: Date
  notes?: string
}
export type ConstraintType =
  | 'conservation-area'
  | 'listed-building'
  | 'article-4-direction-area'
  | 'tree-preservation-zone'
  | 'flood-risk-zone'
  | 'green-belt'
  | 'site-of-special-scientific-interest'
  | 'road'
  | 'highway'
  | 'access'
  | 'public-right-of-way'

export interface PlanningConstraint {
  dataset: ConstraintType
  distance?: number
  name?: string
  grade?: string
  severity?: 'low' | 'medium' | 'high'
}

export interface ViabilityMetrics {
  developmentProfit: number
  profitMargin: number
  returnOnInvestment: number
  totalRevenue: number
  totalCosts: number
  isViable: boolean
  contingencyPercentage?: number
  interestCoverRatio?: number
  utilityUpgradeAllowance?: number
  abnormalCosts?: number
  totalDevelopmentCost?: number
  valueSensitivity5pct?: number
  salesPeriodMonths?: number
}

export interface ProjectDetails {
  developmentType: 'residential' | 'commercial' | 'mixed-use' | 'conversion'
  units?: number
  floorArea?: number
  hasAffordableHousing?: boolean
  affordableHousingPercentage?: number
}

export interface RiskFactor {
  id: string
  category: 'planning' | 'financial' | 'deliverability' | 'market'
  name: string
  impact: ImpactLevel
  probability: number
  score: number
  description: string
  mitigations?: string[]
  evidence?: string
}

export interface RiskCategory {
  name: string
  score: number
  weight: number
  factors: RiskFactor[]
  maxPossibleScore: number
}

export interface RiskFlag {
  id: string
  level: RiskLevel
  severity: 'warning' | 'critical'
  title: string
  message: string
  category: string
  actionRequired?: string
  evidence?: string
  mitigations?: string[]
}

export interface RiskProfile {
  overallRiskScore: number
  riskLevel: RiskLevel
  categories: {
    planning: RiskCategory
    financial: RiskCategory
    deliverability: RiskCategory
    market: RiskCategory
  }
  flags: RiskFlag[]
  summary: string
  calculatedAt: Date
}

export interface RiskAssessmentInput {
  constraints: PlanningConstraint[]
  viability: ViabilityMetrics
  project: ProjectDetails
  location: {
    lat: number
    lng: number
  }
}

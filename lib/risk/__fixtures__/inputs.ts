import type { RiskAssessmentInput } from '../types'

export const INPUT_GREEN: RiskAssessmentInput = {
  constraints: [],
  project: {
    developmentType: 'residential',
    units: 2,
    hasAffordableHousing: false,
    affordableHousingPercentage: 0,
  } as any,
  viability: {
    profitMargin: 22,
    returnOnInvestment: 18,
    developmentProfit: 250000,
    contingencyPercentage: 6,
    totalDevelopmentCost: 1200000,
  } as any,
  location: { lat: 51.5074, lng: -0.1278 },
}

export const INPUT_AMBER: RiskAssessmentInput = {
  constraints: [
    { dataset: 'conservation-area', name: 'Test Conservation Area' } as any,
    { dataset: 'tree-preservation-zone' } as any,
  ],
  project: {
    developmentType: 'residential',
    units: 10,
    hasAffordableHousing: true,
    affordableHousingPercentage: 30,
  } as any,
  viability: {
    profitMargin: 14,
    returnOnInvestment: 12,
    developmentProfit: 180000,
    contingencyPercentage: 3.5,
    totalDevelopmentCost: 2500000,
    abnormalCosts: 120000,
  } as any,
  location: { lat: 51.5074, lng: -0.1278 },
}

export const INPUT_RED: RiskAssessmentInput = {
  constraints: [
    { dataset: 'flood-risk-zone' } as any,
    { dataset: 'listed-building', grade: 'II*', distance: 0 } as any,
  ],
  project: {
    developmentType: 'residential',
    units: 24,
    hasAffordableHousing: true,
    affordableHousingPercentage: 35,
  } as any,
  viability: {
    profitMargin: 6,
    returnOnInvestment: 7,
    developmentProfit: 90000,
    contingencyPercentage: 2,
    totalDevelopmentCost: 3200000,
    interestCoverRatio: 1.05,
    abnormalCosts: 280000,
    utilityUpgradeAllowance: 60000,
  } as any,
  location: { lat: 51.5074, lng: -0.1278 },
}

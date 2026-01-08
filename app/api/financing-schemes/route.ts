import { NextResponse } from 'next/server';
import financingData from '@/data/financing-schemes.json';

interface FinancingScheme {
  name: string;
  description: string;
  maxAmount: number | null;
  eligible: boolean;
  estimatedAmount?: number;
  reason: string;
  [key: string]: any;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectType = searchParams.get('projectType') || 'residential';
  const units = parseInt(searchParams.get('units') || '0');
  const isSME = searchParams.get('isSME') === 'true';
  const isBrownfield = searchParams.get('isBrownfield') === 'true';
  const isSelfBuild = searchParams.get('isSelfBuild') === 'true';
  const affordablePercentage = parseInt(searchParams.get('affordablePercentage') || '0');
  const isRegisteredProvider = searchParams.get('isRegisteredProvider') === 'true';

  const schemes: FinancingScheme[] = [];

  // Greener Homes Grant - All residential
  if (projectType === 'residential') {
    schemes.push({
      ...financingData.greenerHomesGrant,
      eligible: true,
      estimatedAmount: financingData.greenerHomesGrant.maxAmount,
      reason: 'Eligible for residential energy efficiency improvements',
    });
  }

  // Home Building Fund - SME developers 5-500 units
  if (isSME && units >= 5 && units <= 500) {
    schemes.push({
      ...financingData.homeBuildingFund,
      eligible: true,
      estimatedAmount: Math.min(units * 50000, financingData.homeBuildingFund.maxAmount),
      reason: `Eligible as SME developer with ${units} units`,
    });
  } else if (isSME && units > 0 && units < 5) {
    schemes.push({
      ...financingData.homeBuildingFund,
      eligible: false,
      reason: 'Minimum 5 units required for Home Building Fund',
    });
  }

  // Help to Build Equity Loan - Self/custom build
  if (isSelfBuild) {
    schemes.push({
      ...financingData.helpToBuildEquityLoan,
      eligible: true,
      estimatedAmount: undefined,
      reason: 'Eligible for self-build equity loan (up to 20% of value)',
    });
  }

  // Brownfield Land Release Fund - Brownfield sites
  if (isBrownfield && units >= 5) {
    schemes.push({
      ...financingData.brownfieldLandReleaseFund,
      eligible: true,
      estimatedAmount: Math.min(units * 100000, 5000000),
      reason: 'Eligible for brownfield remediation funding',
    });
  }

  // Affordable Homes Guarantee - High affordable %
  if (isRegisteredProvider && affordablePercentage >= 50) {
    schemes.push({
      ...financingData.affordableHomesGuaranteeScheme,
      eligible: true,
      estimatedAmount: undefined,
      reason: `Eligible as registered provider with ${affordablePercentage}% affordable housing`,
    });
  }

  // Social Housing Decarbonisation Fund - 100% affordable/social
  if (isRegisteredProvider && affordablePercentage === 100) {
    const socialUnits = units;
    schemes.push({
      ...financingData.socialHousingDecarbFund,
      eligible: true,
      estimatedAmount: socialUnits * 30000, // Average £30k per unit
      reason: `Eligible for ${socialUnits} social housing units (registered provider)`,
    });
  }

  return NextResponse.json({
    schemes,
    totalPotentialFunding: schemes
      .filter((s) => s.eligible && s.estimatedAmount)
      .reduce((sum, s) => sum + (s.estimatedAmount ?? 0), 0),
  });
}

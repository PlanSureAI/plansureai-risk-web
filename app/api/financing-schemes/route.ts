import { NextResponse } from 'next/server';
import financingData from '@/data/financing-schemes.json';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectType = searchParams.get('projectType') || 'residential';
  const units = parseInt(searchParams.get('units') || '0');
  const isSME = searchParams.get('isSME') === 'true';

  const schemes = [];

  // Check Greener Homes Grant eligibility
  if (projectType === 'residential') {
    schemes.push({
      ...financingData.greenerHomesGrant,
      eligible: true,
      estimatedAmount: financingData.greenerHomesGrant.maxAmount,
      reason: 'Eligible for residential energy efficiency improvements',
    });
  }

  // Check Home Building Fund eligibility
  if (isSME && units >= 5 && units <= 500) {
    schemes.push({
      ...financingData.homeBuildingFund,
      eligible: true,
      estimatedAmount: Math.min(units * 50000, financingData.homeBuildingFund.maxAmount),
      reason: `Eligible as SME developer with ${units} units`,
    });
  } else if (units > 0 && units < 5) {
    schemes.push({
      ...financingData.homeBuildingFund,
      eligible: false,
      reason: 'Minimum 5 units required for Home Building Fund',
    });
  }

  return NextResponse.json({
    schemes,
    totalPotentialFunding: schemes
      .filter((s) => s.eligible)
      .reduce((sum, s) => sum + (s.estimatedAmount || 0), 0),
  });
}

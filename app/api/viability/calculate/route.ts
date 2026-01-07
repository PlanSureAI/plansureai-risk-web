import { NextRequest, NextResponse } from 'next/server';

interface ProjectInputs {
  siteName: string;
  address: string;
  siteArea: number;
  developmentType: 'residential' | 'commercial' | 'mixed';
  units: number;
  grossInternalArea: number;
  affordableHousing: number;
}

export async function POST(request: NextRequest) {
  try {
    const inputs: ProjectInputs = await request.json();

    // Calculate costs based on BCIS data and industry standards
    const costPerSqm = getCostPerSqm(inputs.developmentType);
    const constructionCost = inputs.grossInternalArea * costPerSqm;

    const landCost = estimateLandCost(inputs);
    const professionalFees = constructionCost * 0.12; // 12% of construction
    const s106CIL = inputs.units * 15000; // £15k per unit estimate
    const finance = (constructionCost + landCost) * 0.065 * 2; // 6.5% over 2 years
    const contingency = constructionCost * 0.05; // 5% contingency
    const marketing = constructionCost * 0.03; // 3% marketing

    const costs = {
      landCost,
      constructionCost,
      professionalFees,
      s106CIL,
      finance,
      contingency,
      marketing,
    };

    // Calculate revenue
    const avgUnitValue = getAvgUnitValue(inputs);
    const marketUnits = Math.round(inputs.units * (1 - inputs.affordableHousing / 100));
    const affordableUnits = inputs.units - marketUnits;

    const marketSales = marketUnits * avgUnitValue;
    const affordableSales = affordableUnits * (avgUnitValue * 0.6); // 60% of market value
    const totalRevenue = marketSales + affordableSales;

    const revenue = {
      marketSales,
      affordableSales,
      totalRevenue,
    };

    // Calculate metrics
    const totalCosts = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
    const profit = totalRevenue - totalCosts;
    const profitMargin = (profit / totalRevenue) * 100;
    const roi = (profit / totalCosts) * 100;

    // Determine viability status
    let viabilityStatus: 'viable' | 'marginal' | 'unviable';
    if (profitMargin >= 20 && roi >= 15) {
      viabilityStatus = 'viable';
    } else if (profitMargin >= 15 && roi >= 10) {
      viabilityStatus = 'marginal';
    } else {
      viabilityStatus = 'unviable';
    }

    return NextResponse.json({
      costs,
      revenue,
      profit,
      profitMargin,
      roi,
      viabilityStatus,
    });
  } catch (error) {
    console.error('Viability calculation error:', error);
    return NextResponse.json({ error: 'Failed to calculate viability' }, { status: 500 });
  }
}

function getCostPerSqm(type: string): number {
  // BCIS Q4 2025 rates (example values)
  switch (type) {
    case 'residential':
      return 1800; // £1,800/sqm
    case 'commercial':
      return 2200; // £2,200/sqm
    case 'mixed':
      return 2000; // £2,000/sqm
    default:
      return 1800;
  }
}

function estimateLandCost(inputs: ProjectInputs): number {
  // Simplified land value estimation
  // In production, this would use actual land registry data
  const costPerUnit = 50000; // £50k per unit base
  return inputs.units * costPerUnit;
}

function getAvgUnitValue(inputs: ProjectInputs): number {
  // Simplified unit value estimation
  // In production, this would use Land Registry price data for the area
  const baseValue = 250000; // £250k base
  const giaPerUnit = inputs.grossInternalArea / inputs.units;
  return baseValue + (giaPerUnit - 70) * 3000; // Adjust for size
}

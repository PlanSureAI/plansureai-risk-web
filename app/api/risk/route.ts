import { NextRequest, NextResponse } from 'next/server'
import { calculateRiskProfile } from '@/lib/risk/calculator'
import type { RiskAssessmentInput } from '@/lib/risk/types'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RiskAssessmentInput

    // Optionally validate here (basic shape checks, etc.)
    const profile = calculateRiskProfile(body)

    return NextResponse.json(profile, { status: 200 })
  } catch (err) {
    console.error('Error in /api/risk', err)
    return NextResponse.json({ error: 'Unable to calculate risk profile' }, { status: 400 })
  }
}

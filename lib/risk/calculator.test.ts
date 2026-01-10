import { describe, it, expect } from 'vitest'
import { calculateRiskProfile } from './calculator'
import { INPUT_GREEN, INPUT_AMBER, INPUT_RED } from './__fixtures__/inputs'

describe('risk calculator', () => {
  it('scores green scenario as low-ish risk', () => {
    const res = calculateRiskProfile(INPUT_GREEN)
    expect(res.overallRiskScore).toBeGreaterThanOrEqual(0)
    expect(res.categories.planning.score).toBe(0)
    expect(['LOW', 'MEDIUM']).toContain(res.riskLevel)
    const flag = res.flags.find((f) => f.id === 'no-constraints')
    expect(flag).toBeTruthy()
    expect(flag?.level).toBe('LOW')
    expect(flag?.title).toBe('No mapped constraints detected')
  })

  it('scores amber scenario as medium/high risk', () => {
    const res = calculateRiskProfile(INPUT_AMBER)
    expect(res.categories.planning.score).toBeGreaterThan(0)
    expect(['MEDIUM', 'HIGH']).toContain(res.riskLevel)
    const expected = [
      { id: 'conservation-area', level: 'MEDIUM', title: 'Conservation Area' },
      { id: 'modest-profit', level: 'HIGH', title: 'Below-Target Profit Margin' },
      { id: 'affordable-housing', level: 'MEDIUM', title: 'Affordable Housing Requirement' },
      { id: 'modest-roi', level: 'MEDIUM', title: 'Modest ROI' },
      { id: 'abnormals', level: 'HIGH', title: 'Abnormal Costs or Ground Risk' },
      { id: 'tpo', level: 'MEDIUM', title: 'Tree Preservation Zone' },
    ]
    for (const expectation of expected) {
      const flag = res.flags.find((f) => f.id === expectation.id)
      expect(flag).toBeTruthy()
      expect(flag?.level).toBe(expectation.level)
      expect(flag?.title).toBe(expectation.title)
    }
  })

  it('scores red scenario as high/extreme risk', () => {
    const res = calculateRiskProfile(INPUT_RED)
    expect(res.categories.planning.score).toBeGreaterThanOrEqual(35)
    expect(['HIGH', 'EXTREME']).toContain(res.riskLevel)
    expect(res.flags.length).toBeGreaterThan(0)
    expect(res.flags[0].level).toBeDefined()
    expect(res.flags[0].title).toBeDefined()
    const expected = [
      { id: 'listed-building', level: 'EXTREME', title: 'Listed Building Impact' },
      { id: 'low-profit', level: 'EXTREME', title: 'Low Profit Margin' },
      { id: 'flood-risk', level: 'EXTREME', title: 'Flood Risk Zone' },
      { id: 'low-roi', level: 'HIGH', title: 'Low Return on Investment' },
      { id: 'weak-icr', level: 'HIGH', title: 'Weak Interest Cover' },
      { id: 'abnormals', level: 'HIGH', title: 'Abnormal Costs or Ground Risk' },
    ]
    for (const expectation of expected) {
      const flag = res.flags.find((f) => f.id === expectation.id)
      expect(flag).toBeTruthy()
      expect(flag?.level).toBe(expectation.level)
      expect(flag?.title).toBe(expectation.title)
    }
  })
})

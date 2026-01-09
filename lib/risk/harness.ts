import { calculateRiskProfile } from './calculator'
import { INPUT_GREEN, INPUT_AMBER, INPUT_RED } from './__fixtures__/inputs'

function run(name: string, input: any) {
  const res = calculateRiskProfile(input)
  console.log(`\n=== ${name} ===`)
  console.log(`Level: ${res.riskLevel} | Score: ${res.overallRiskScore}`)
  console.log(
    `Planning ${res.categories.planning.score}, Financial ${res.categories.financial.score}, Deliverability ${res.categories.deliverability.score}, Market ${res.categories.market.score}`
  )
  console.log(
    'Top flags:',
    res.flags
      .slice(0, 3)
      .map((f) => `${f.level}: ${f.title}`)
      .join(' | ')
  )
}

run('GREEN', INPUT_GREEN)
run('AMBER', INPUT_AMBER)
run('RED', INPUT_RED)

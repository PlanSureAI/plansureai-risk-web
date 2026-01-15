import Anthropic from "@anthropic-ai/sdk";
import { RiskAssessment } from "@/app/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function calculateRiskScore(
  documentText: string,
  constraints: Array<{
    type: string;
    description: string;
    severity: "high" | "medium" | "low";
  }>
): Promise<RiskAssessment> {
  const constraintSummary = constraints
    .map((c) => `${c.type} (${c.severity}): ${c.description}`)
    .join("\n");

  const prompt = `
You are an expert UK planning consultant. Analyze this planning application for risk.

SITE CONSTRAINTS:
${constraintSummary}

DOCUMENT CONTENT (first 3000 characters):
${documentText.substring(0, 3000)}

Provide a detailed risk assessment in the following JSON format:
{
  "overall_score": <0-100 number>,
  "risk_level": "<low|amber|red>",
  "top_risks": [
    {
      "category": "<constraint type>",
      "severity": "<high|medium|low>",
      "description": "<specific risk and why it matters>"
    },
    <up to 3 more>
  ],
  "policy_gaps": ["<gap1>", "<gap2>"],
  "compliance_notes": "<summary of compliance status>",
  "timeline_estimate": <estimated months to decision>,
  "key_success_factors": ["<factor1>", "<factor2>"],
  "recommended_actions": ["<action1>", "<action2>"]
}

Be specific, practical, and based on real UK planning experience.
`;

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  const assessment = JSON.parse(content.text) as RiskAssessment;

  return {
    overall_score: assessment.overall_score || 50,
    risk_level: assessment.risk_level || "amber",
    top_risks: assessment.top_risks || [],
    policy_gaps: assessment.policy_gaps || [],
    compliance_notes: assessment.compliance_notes || "",
    timeline_estimate: assessment.timeline_estimate || 12,
    key_success_factors: assessment.key_success_factors || [],
    recommended_actions: assessment.recommended_actions || [],
  };
}

export function categorizeRiskLevel(score: number): "low" | "amber" | "red" {
  if (score < 33) return "low";
  if (score < 66) return "amber";
  return "red";
}

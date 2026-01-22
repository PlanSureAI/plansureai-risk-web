import OpenAI from "openai";

type MitigationStep = {
  title: string;
  description: string;
  cost_gbp_min?: number | null;
  cost_gbp_max?: number | null;
  timeline_weeks_min?: number | null;
  timeline_weeks_max?: number | null;
  specialist?: string | null;
};

export type MitigationPlan = {
  summary: string;
  steps: MitigationStep[];
};

type RiskFactor = {
  title: string;
  description: string;
  severity: string;
  category: string;
  mitigation?: string;
};

type RiskAnalysis = {
  level: string;
  score: number;
  tagline?: string;
  topRisks?: RiskFactor[];
  allRisks?: RiskFactor[];
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate mitigation plan for risk factors via OpenAI.
 */
export async function generateMitigationPlan(
  riskAnalysis: RiskAnalysis,
  site: { id?: string; site_name?: string | null; address?: string | null } | null
): Promise<MitigationPlan | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  const risks = (riskAnalysis.topRisks ?? riskAnalysis.allRisks ?? []).slice(0, 6);
  if (risks.length === 0) return null;

  const prompt = {
    instruction:
      "Generate a concise mitigation plan for a UK planning risk assessment. Return JSON only.",
    site: {
      id: site?.id ?? null,
      name: site?.site_name ?? null,
      address: site?.address ?? null,
      risk_score: riskAnalysis.score,
      risk_level: riskAnalysis.level,
    },
    risks: risks.map((risk) => ({
      title: risk.title,
      description: risk.description,
      severity: risk.severity,
      category: risk.category,
      mitigation_hint: risk.mitigation ?? null,
    })),
    output_schema: {
      summary: "string (1-2 sentences)",
      steps: [
        {
          title: "string",
          description: "string (1-2 sentences)",
          cost_gbp_min: "number | null",
          cost_gbp_max: "number | null",
          timeline_weeks_min: "number | null",
          timeline_weeks_max: "number | null",
          specialist: "string | null",
        },
      ],
    },
  };

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content:
          "You are a UK planning consultant. Provide practical mitigation steps, with realistic costs and timelines in GBP and weeks.",
      },
      { role: "user", content: JSON.stringify(prompt) },
    ],
    response_format: { type: "json_object" } as const,
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? "";
  try {
    const parsed = JSON.parse(raw) as MitigationPlan;
    if (!parsed?.summary || !Array.isArray(parsed.steps)) return null;
    return parsed;
  } catch (err) {
    console.error("Mitigation plan parse failed. Raw:", raw);
    return null;
  }
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders })
  }

  const {
    site_id,
    site_name,
    address,
    local_planning_authority,
    ai_outcome,
    ai_risk_summary,
    key_planning_considerations,
    objection_likelihood,
  } = await req.json()

  const prompt = `
You are a senior UK planning consultant providing a confidence score for planning permission likelihood.

Site: ${site_name}
Address: ${address}
Local Planning Authority: ${local_planning_authority}
AI Outcome: ${ai_outcome}
Risk Summary: ${ai_risk_summary}
Key Planning Considerations: ${key_planning_considerations}
Objection Likelihood: ${objection_likelihood}

Task:
1. Assign a planning confidence score from 0-100
2. Provide exactly 3 short bullet reasons (one sentence each)

Scoring bands:
- 80-100: High planning confidence (Green outcome likely)
- 55-79: Moderate planning confidence (Amber, conditions/mitigation needed)
- 0-54: Low planning confidence (Red, significant obstacles)

Focus on:
- Policy support and allocation status
- Access and technical constraints
- Known objections and neighbour/stakeholder risk
- Realistic mitigation paths

Return ONLY valid JSON in this exact format:
{
  "score": 72,
  "reasons": [
    "Policy support: Draft allocation in Local Plan, no obvious conflicts.",
    "Access: Direct connection to adopted highway, visibility splay acceptable.",
    "Risk: Noise constraints near railway likely to require mitigation."
  ]
}

Rules:
- Be realistic and evidence-based
- Use professional UK planning language
- Do not speculate or guarantee outcomes
- Keep each reason to one sentence
`

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  })

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content ?? "{}"

  let parsed
  try {
    parsed = JSON.parse(content)
  } catch (e) {
    console.error("Failed to parse JSON response", e)
    return new Response(JSON.stringify({ error: "Invalid response format" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  )

  const { error } = await supabase
    .from("sites")
    .update({
      planning_confidence_score: parsed?.score,
      confidence_reasons: Array.isArray(parsed?.reasons) ? parsed.reasons : null,
    })
    .eq("id", site_id)

  if (error) {
    console.error("Error persisting planning confidence", error)
  }

  return new Response(JSON.stringify(parsed), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
})

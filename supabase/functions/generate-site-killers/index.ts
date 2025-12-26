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

  try {
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
You are a senior UK planning consultant identifying the top planning risks that could block consent.

Site: ${site_name}
Address: ${address}
Local Planning Authority: ${local_planning_authority}
AI Outcome: ${ai_outcome}
Risk Summary: ${ai_risk_summary}
Key Planning Considerations: ${key_planning_considerations}
Objection Likelihood: ${objection_likelihood}

Task:
Identify the TOP 3 planning risks that could kill this site (prevent planning permission).

For each risk, provide:
- risk: Short title (3-6 words)
- impact: Brief explanation (1-2 sentences)
- mitigation: Realistic mitigation strategy (1-2 sentences)

Return ONLY valid JSON in this exact format:
{
  "killers": [
    {
      "risk": "Highway access constraints",
      "impact": "Substandard visibility splays and inadequate junction capacity could trigger highway objection.",
      "mitigation": "Commission highway assessment and explore land acquisition for improved sightlines."
    },
    {
      "risk": "Heritage impact on Grade II asset",
      "impact": "Proximity to listed building may result in heritage objection from conservation officer.",
      "mitigation": "Engage heritage consultant early and explore design modifications to reduce visual impact."
    },
    {
      "risk": "Insufficient affordable housing provision",
      "impact": "Policy requires 30% affordable, scheme proposes 20%, creating policy conflict.",
      "mitigation": "Re-run viability or increase affordable percentage to policy-compliant level."
    }
  ]
}

Rules:
- Focus on REAL blocking risks, not minor concerns
- Be specific to THIS site's constraints
- Prioritize risks by severity and likelihood
- Mitigation must be realistic and actionable
- Use professional UK planning language
- Do not speculate or invent issues
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

    const killers = parsed?.killers as
      | { risk: string; impact: string; mitigation: string }[]
      | undefined

    const { error } = await supabase
      .from("sites")
      .update({
        site_killers: Array.isArray(killers) ? killers : null,
      })
      .eq("id", site_id)

    if (error) {
      console.error("Error persisting site killers", error)
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Unexpected error generating site killers", error)
    return new Response(JSON.stringify({ error: error?.message ?? "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})

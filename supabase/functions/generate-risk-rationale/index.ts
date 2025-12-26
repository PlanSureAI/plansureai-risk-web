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
    risk_status,
    key_planning_considerations,
    objection_likelihood,
  } = await req.json()

  const prompt = `
You are a senior UK planning consultant.

Write a short rationale (4–5 sentences) explaining:

1. Why this site is assessed as ${risk_status.toUpperCase()} rather than RED.
2. What realistic steps could move the assessment to GREEN.

Site: ${site_name}
Address: ${address}
Local Planning Authority: ${local_planning_authority}
Risk Status: ${risk_status}
Objection Likelihood: ${objection_likelihood}

Key Planning Considerations:
${key_planning_considerations}

Rules:
- Be realistic and planning-led
- Do not speculate
- No guarantees
- Use professional UK planning language
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
      temperature: 0.3,
    }),
  })

  const data = await response.json()
  const rationale = data.choices?.[0]?.message?.content ?? ""

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  )

  const { error } = await supabase
    .from("sites")
    .update({ risk_rationale: rationale })
    .eq("id", site_id)

  if (error) {
    console.error("Error persisting risk rationale", error)
  }

  return new Response(JSON.stringify({ rationale }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
})

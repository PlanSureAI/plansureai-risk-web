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

  const { site_id, risk_assessment_id } = await req.json()
  if (!site_id) {
    return new Response(
      JSON.stringify({ error: "site_id is required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  )

  const plan_markdown = [
    "## Mitigation plan",
    "- Review constraints and policy conflicts.",
    "- Engage with LPA for pre-app feedback.",
    "- Commission required surveys and adjust scheme.",
    "",
    "## Evidence",
    "- Pull comparable approvals/refusals for precedent.",
  ].join("\n")

  const { data: plan, error: planError } = await supabase
    .from("mitigation_plans")
    .insert({
      site_id,
      risk_assessment_id: risk_assessment_id ?? null,
      plan_markdown,
    })
    .select()
    .single()

  if (planError || !plan) {
    console.error("Failed to insert mitigation plan", planError)
    return new Response(
      JSON.stringify({ error: "Failed to create mitigation plan" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }

  return new Response(
    JSON.stringify({ mitigation_plan_id: plan.id }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  )
})

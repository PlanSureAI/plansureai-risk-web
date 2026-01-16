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

  const { site_id, planning_document_id } = await req.json()
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

  const { data: assessment, error: insertError } = await supabase
    .from("risk_assessments")
    .insert({
      site_id,
      planning_document_id: planning_document_id ?? null,
      overall_score: 0,
      overall_confidence: 0,
      headline_risk_colour: "amber",
      primary_killers: [],
      summary_markdown: "Risk assessment pending.",
      created_by: null,
    })
    .select()
    .single()

  if (insertError || !assessment) {
    console.error("Failed to insert risk assessment", insertError)
    return new Response(
      JSON.stringify({ error: "Failed to create risk assessment" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }

  return new Response(
    JSON.stringify({ risk_assessment_id: assessment.id }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  )
})

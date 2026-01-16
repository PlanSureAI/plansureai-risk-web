import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

type Stats = {
  count: number
  approvals: number
  refusals: number
  approval_rate: number
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders })
  }

  const { site_id } = await req.json()
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

  const { data: comps, error: compsError } = await supabase
    .from("comparable_applications")
    .select("decision")
    .eq("site_id", site_id)

  if (compsError) {
    console.error("Failed to fetch comparables", compsError)
    return new Response(
      JSON.stringify({ error: "Failed to fetch comparables" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }

  const approvals = (comps ?? []).filter((c) => c.decision === "approved").length
  const refusals = (comps ?? []).filter((c) => c.decision === "refused").length
  const count = comps?.length ?? 0
  const approval_rate = count > 0 ? Math.round((approvals / count) * 100) : 0

  const stats: Stats = { count, approvals, refusals, approval_rate }
  const summary = `Comparable applications: ${count}. Approval rate ${approval_rate}%.`

  const { data: summaryRow, error: summaryError } = await supabase
    .from("comparable_summaries")
    .insert({
      site_id,
      summary_markdown: summary,
      stats_json: stats,
    })
    .select()
    .single()

  if (summaryError) {
    console.error("Failed to insert comparable summary", summaryError)
    return new Response(
      JSON.stringify({ error: "Failed to create summary" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }

  return new Response(
    JSON.stringify({ comparable_summary_id: summaryRow.id, stats }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  )
})

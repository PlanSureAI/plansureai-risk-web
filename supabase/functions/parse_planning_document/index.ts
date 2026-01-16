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

  const { planning_document_id } = await req.json()
  if (!planning_document_id) {
    return new Response(
      JSON.stringify({ error: "planning_document_id is required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  )

  const { data: doc, error: docError } = await supabase
    .from("planning_documents")
    .select("id, file_path")
    .eq("id", planning_document_id)
    .single()

  if (docError || !doc) {
    return new Response(
      JSON.stringify({ error: "Planning document not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }

  const { error: updateError } = await supabase
    .from("planning_documents")
    .update({ parsed: true, parsed_at: new Date().toISOString(), parse_error: null })
    .eq("id", planning_document_id)

  if (updateError) {
    console.error("Failed to update planning_documents", updateError)
  }

  return new Response(
    JSON.stringify({ planning_document_id, parsed: true }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  )
})

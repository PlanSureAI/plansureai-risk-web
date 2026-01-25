import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import AssessmentClient from "./assessment-client";

export const dynamic = "force-dynamic";

export default async function AssessmentPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: site } = await supabase
    .from("sites")
    .select(
      "id, site_name, address, postcode, local_planning_authority, risk_profile, ai_outcome, ai_risk_summary, key_planning_considerations, objection_likelihood, planning_confidence_score"
    )
    .eq("id", params.id)
    .single();

  if (!site) {
    notFound();
  }

  const { data: finance } = await supabase
    .from("finance_assessments")
    .select("verdict, confidence, confidence_level, summary, blocking_items, next_steps, updated_at")
    .eq("site_id", params.id)
    .maybeSingle();

  return <AssessmentClient site={site} finance={finance ?? null} />;
}

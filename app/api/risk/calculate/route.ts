import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase";
import { calculateRiskScore } from "@/app/lib/risk-calculator";

export async function POST(request: NextRequest) {
  try {
    const { siteId } = await request.json();

    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }

    const { data: site, error: siteError } = await supabaseAdmin
      .from("sites")
      .select("*, planning_constraints(*), documents(*)")
      .eq("id", siteId)
      .single();

    if (siteError || !site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const latestDoc = site.documents?.[0];
    const documentText = latestDoc?.extracted_text || "";

    if (!documentText) {
      return NextResponse.json(
        { error: "No document text available for risk calculation" },
        { status: 400 }
      );
    }

    const riskScore = await calculateRiskScore(
      documentText,
      site.planning_constraints || []
    );

    await supabaseAdmin
      .from("sites")
      .update({
        risk_score: riskScore.overall_score,
        risk_level: riskScore.risk_level,
        risk_assessment: riskScore,
        updated_at: new Date().toISOString(),
      })
      .eq("id", siteId);

    return NextResponse.json({
      success: true,
      assessment: riskScore,
    });
  } catch (error) {
    console.error("Risk calculation error:", error);
    return NextResponse.json(
      { error: "Failed to calculate risk", details: String(error) },
      { status: 500 }
    );
  }
}

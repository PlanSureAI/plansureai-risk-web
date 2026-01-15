import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase";
import { PortfolioMetrics } from "@/app/types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId parameter required" }, { status: 400 });
    }

    const { data: sites, error } = await supabaseAdmin
      .from("sites")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    if (!sites || sites.length === 0) {
      const emptyMetrics: PortfolioMetrics = {
        total_sites: 0,
        total_units: 0,
        estimated_gdv: 0,
        by_risk_level: { low: 0, amber: 0, red: 0 },
        average_risk_score: 0,
        total_floor_area_sqm: 0,
        sites_with_approvals: 0,
        sites_pending_decision: 0,
      };

      return NextResponse.json({
        success: true,
        metrics: emptyMetrics,
        sites: [],
      });
    }

    const metrics: PortfolioMetrics = {
      total_sites: sites.length,
      total_units: sites.reduce((sum, s) => sum + (s.estimated_units || 0), 0),
      estimated_gdv: sites.reduce((sum, s) => sum + (s.estimated_gdv || 0), 0),
      by_risk_level: {
        low: sites.filter((s) => s.risk_level === "low").length,
        amber: sites.filter((s) => s.risk_level === "amber").length,
        red: sites.filter((s) => s.risk_level === "red").length,
      },
      average_risk_score:
        sites.reduce((sum, s) => sum + (s.risk_score || 0), 0) / sites.length,
      total_floor_area_sqm: sites.reduce(
        (sum, s) => sum + (s.floor_area_sqm || 0),
        0
      ),
      sites_with_approvals: sites.filter((s) => s.status === "approved").length,
      sites_pending_decision: sites.filter((s) => s.status === "pending").length,
    };

    return NextResponse.json({
      success: true,
      metrics,
      sites: sites.map((s) => ({
        id: s.id,
        name: s.name,
        location: s.location,
        risk_level: s.risk_level,
        risk_score: s.risk_score,
        estimated_units: s.estimated_units,
        estimated_gdv: s.estimated_gdv,
        status: s.status,
      })),
    });
  } catch (error) {
    console.error("Error calculating metrics:", error);
    return NextResponse.json(
      { error: "Failed to calculate metrics", details: String(error) },
      { status: 500 }
    );
  }
}

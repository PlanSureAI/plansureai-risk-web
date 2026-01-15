import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { userId, alertType, frequency, regions, email } = await request.json();

    if (!userId || !alertType || !frequency || !regions || !email) {
      return NextResponse.json(
        { error: "userId, alertType, frequency, regions, and email are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("alert_subscriptions")
      .insert({
        user_id: userId,
        alert_type: alertType,
        frequency,
        regions,
        email,
        enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      alert_id: data.id,
      message: `${alertType} alerts scheduled ${frequency}`,
    });
  } catch (error) {
    console.error("Error scheduling alerts:", error);
    return NextResponse.json(
      { error: "Failed to schedule alerts", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId parameter required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("alert_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("enabled", true);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      alerts: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts", details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const alertId = searchParams.get("alertId");

    if (!alertId) {
      return NextResponse.json({ error: "alertId parameter required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("alert_subscriptions")
      .update({ enabled: false })
      .eq("id", alertId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "Alert subscription disabled",
    });
  } catch (error) {
    console.error("Error deleting alert:", error);
    return NextResponse.json(
      { error: "Failed to delete alert", details: String(error) },
      { status: 500 }
    );
  }
}

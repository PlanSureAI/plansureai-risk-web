import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { siteId, expiresInDays = 30, recipientEmail } = await request.json();

    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const { data, error } = await supabaseAdmin
      .from("shares")
      .insert({
        token,
        site_id: siteId,
        expires_at: expiresAt.toISOString(),
        recipient_email: recipientEmail || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    const { data: site } = await supabaseAdmin
      .from("sites")
      .select("name, location")
      .eq("id", siteId)
      .single();

    if (recipientEmail && site) {
      console.log(`Would send share email to ${recipientEmail} for site ${site.name}`);
    }

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/share/${token}`;

    return NextResponse.json({
      success: true,
      shareUrl,
      token,
      expiresAt,
    });
  } catch (error) {
    console.error("Error creating share:", error);
    return NextResponse.json(
      { error: "Failed to create share", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "token parameter required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("shares")
      .select("*, sites(*)")
      .eq("token", token)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Share not found" }, { status: 404 });
    }

    if (new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ error: "Share has expired" }, { status: 410 });
    }

    await supabaseAdmin.from("share_views").insert({
      share_id: data.id,
      viewed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      site: {
        id: data.sites.id,
        name: data.sites.name,
        location: data.sites.location,
        risk_score: data.sites.risk_score,
        risk_level: data.sites.risk_level,
        risk_assessment: data.sites.risk_assessment,
        estimated_units: data.sites.estimated_units,
        estimated_gdv: data.sites.estimated_gdv,
      },
    });
  } catch (error) {
    console.error("Error retrieving share:", error);
    return NextResponse.json(
      { error: "Failed to retrieve share", details: String(error) },
      { status: 500 }
    );
  }
}

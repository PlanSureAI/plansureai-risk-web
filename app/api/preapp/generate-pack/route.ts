import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase";
import { Client as AnthropicClient } from "@anthropic-ai/sdk";

const anthropic = new AnthropicClient({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface PreAppContent {
  site_location_plan: string;
  constraints_summary: string;
  policy_compliance_checklist: string[];
  draft_planning_statement: string;
  likely_conditions: string[];
  information_required: string[];
  estimated_timeline: string;
  key_policy_references: string[];
  success_factors: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { siteId } = await request.json();

    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }

    const { data: site, error: siteError } = await supabaseAdmin
      .from("sites")
      .select(
        `
        *,
        planning_constraints(*),
        documents(*)
      `
      )
      .eq("id", siteId)
      .single();

    if (siteError || !site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const packContent = await generatePackContent(site, anthropic);

    const { data: pack, error: packError } = await supabaseAdmin
      .from("preapp_packs")
      .insert({
        site_id: siteId,
        content: packContent,
        generated_at: new Date().toISOString(),
        status: "ready",
      })
      .select()
      .single();

    if (packError) {
      throw packError;
    }

    await supabaseAdmin.from("activity_logs").insert({
      site_id: siteId,
      action: "preapp_pack_generated",
      metadata: {
        pack_id: pack.id,
      },
    });

    return NextResponse.json({
      success: true,
      pack_id: pack.id,
      content: packContent,
      message: "Pre-app pack generated successfully",
    });
  } catch (error) {
    console.error("Error generating pre-app pack:", error);
    return NextResponse.json(
      { error: "Failed to generate pack", details: String(error) },
      { status: 500 }
    );
  }
}

async function generatePackContent(
  site: any,
  client: AnthropicClient
): Promise<PreAppContent> {
  const constraints = site.planning_constraints
    ?.map((c: any) => `${c.type}: ${c.description}`)
    .join("\n");

  const documentText = site.documents?.[0]?.extracted_text || "";

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `
          You are a UK planning consultant. Generate a comprehensive pre-application pack for this site:
          
          SITE NAME: ${site.name}
          LOCATION: ${site.location}
          LOCAL AUTHORITY: ${site.local_authority}
          
          CONSTRAINTS:
          ${constraints || "No specific constraints identified"}
          
          DOCUMENT EXCERPT (first 2000 chars):
          ${documentText.substring(0, 2000)}
          
          Generate a detailed pre-application pack in JSON format with these sections:
          {
            "site_location_plan": "Description of location plan - what should be shown on site plan with grid references, boundaries, surrounding land uses",
            "constraints_summary": "Executive summary of all constraints affecting the site",
            "policy_compliance_checklist": ["item1", "item2", "item3"] (5-8 items specific to this location/scheme),
            "draft_planning_statement": "A 3-4 paragraph draft planning statement explaining the proposal, site context, and policy compliance",
            "likely_conditions": ["condition1", "condition2", "condition3"] (common conditions for this type of development),
            "information_required": ["info1", "info2", "info3"] (specific supporting information needed for pre-app meeting),
            "estimated_timeline": "X weeks - estimated timeline to planning decision",
            "key_policy_references": ["policy1", "policy2"] (specific local policies that apply),
            "success_factors": ["factor1", "factor2"] (what will be critical for approval)
          }
          
          Be specific, practical, and based on real UK planning experience.
        `,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  const packContent = JSON.parse(content.text) as PreAppContent;

  return {
    site_location_plan:
      packContent.site_location_plan ||
      "Standard location plan showing site boundaries and context",
    constraints_summary:
      packContent.constraints_summary || "See policy constraints list above",
    policy_compliance_checklist: packContent.policy_compliance_checklist || [],
    draft_planning_statement:
      packContent.draft_planning_statement ||
      "Development proposal to be detailed at pre-application stage",
    likely_conditions: packContent.likely_conditions || [],
    information_required: packContent.information_required || [],
    estimated_timeline: packContent.estimated_timeline || "12 weeks",
    key_policy_references: packContent.key_policy_references || [],
    success_factors: packContent.success_factors || [],
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const packId = searchParams.get("packId");

    if (!packId) {
      return NextResponse.json({ error: "packId parameter required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("preapp_packs")
      .select("*")
      .eq("id", packId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Pack not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      pack: data,
    });
  } catch (error) {
    console.error("Error retrieving pack:", error);
    return NextResponse.json(
      { error: "Failed to retrieve pack", details: String(error) },
      { status: 500 }
    );
  }
}

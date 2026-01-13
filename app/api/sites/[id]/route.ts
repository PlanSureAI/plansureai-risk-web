import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const payload = (await request.json()) as {
    lender_strategy_notes?: string | null;
  };

  if (!id) {
    return NextResponse.json({ error: "site id required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("sites")
    .update({ lender_strategy_notes: payload.lender_strategy_notes ?? null })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

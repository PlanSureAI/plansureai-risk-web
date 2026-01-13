import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";

type FeedbackPayload = {
  interactionId: string;
  answerQuality: number;
  comment?: string;
};

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await req.json()) as FeedbackPayload;
  if (!payload?.interactionId || !payload?.answerQuality) {
    return NextResponse.json({ error: "interactionId and answerQuality required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("planner_ai_feedback")
    .update({
      answer_quality: payload.answerQuality,
      comment: payload.comment ?? null,
    })
    .eq("id", payload.interactionId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

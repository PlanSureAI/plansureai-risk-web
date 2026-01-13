"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";

export type CreateSiteState = {
  error: string | null;
};

export const initialState: CreateSiteState = {
  error: null,
};

export async function createSite(
  _prevState: CreateSiteState,
  formData: FormData
): Promise<CreateSiteState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Error loading user for site creation", userError);
    redirect("/login?next=/sites/new");
  }

  const site_name = (formData.get("site_name") as string | null)?.trim() || null;
  const address = (formData.get("address") as string | null)?.trim() || null;
  const reference_code =
    (formData.get("reference_code") as string | null)?.trim() || null;
  const local_planning_authority =
    (formData.get("local_planning_authority") as string | null)?.trim() || null;
  const status = (formData.get("status") as string | null)?.trim() || null;
  const askingPriceRaw = formData.get("asking_price") as string | null;
  const asking_price =
    askingPriceRaw && askingPriceRaw.trim() !== ""
      ? Number(askingPriceRaw)
      : null;
  const proposedUnitsRaw = formData.get("proposed_units") as string | null;
  const proposed_units =
    proposedUnitsRaw && proposedUnitsRaw.trim() !== ""
      ? Number(proposedUnitsRaw)
      : null;
  const notes = (formData.get("notes") as string | null)?.trim() || null;

  if (!site_name) {
    return { error: "Site name is required" };
  }
  if (!address) {
    return { error: "Address is required" };
  }
  if (!status) {
    return { error: "Status is required" };
  }

  const { data, error } = await supabase
    .from("sites")
    .insert([
      {
        user_id: user.id,
        site_name,
        address,
        reference_code,
        local_planning_authority,
        status,
        asking_price,
        proposed_units,
        planning_summary: notes,
      },
    ])
    .select("id")
    .single();

  if (error || !data) {
    console.error("Error creating site", error);
    return {
      error: "Failed to create site. Please try again.",
    };
  }

  // refresh list + go straight to detail view
  revalidatePath("/sites");
  redirect(`/sites/${data.id}`);
}

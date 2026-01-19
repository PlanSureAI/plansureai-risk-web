"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function toNullableString(value: FormDataEntryValue | null) {
  const str = value?.toString().trim();
  return str ? str : null;
}

export async function addBrokerContact(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.from("broker_contacts").insert({
    user_id: user!.id,
    name: toNullableString(formData.get("name")),
    firm: toNullableString(formData.get("firm")),
    email: toNullableString(formData.get("email")),
    phone: toNullableString(formData.get("phone")),
    notes: toNullableString(formData.get("notes")),
  });

  if (error) throw error;

  revalidatePath("/brokers");
}

export async function deleteBrokerContact(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing broker id");

  const { error } = await supabase.from("broker_contacts").delete().eq("id", id);
  if (error) throw error;

  revalidatePath("/brokers");
}

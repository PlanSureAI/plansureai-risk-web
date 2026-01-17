import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";
import PoliciesAdminClient from "./policies-admin-client";

const ADMIN_EMAILS = [
  "your-email@domain.com",
  "admin@domain.com",
];

export default async function PoliciesAdminPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email || !ADMIN_EMAILS.includes(user.email)) {
    redirect("/sites");
  }

  return <PoliciesAdminClient />;
}

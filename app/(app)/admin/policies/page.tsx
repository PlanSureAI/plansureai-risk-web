import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PoliciesAdminClient from "./policies-admin-client";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export default async function PoliciesAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email?.toLowerCase() ?? "";
  if (!user || !email || !ADMIN_EMAILS.includes(email)) {
    redirect("/sites");
  }

  return <PoliciesAdminClient />;
}

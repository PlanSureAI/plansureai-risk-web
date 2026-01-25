import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import FinanceClient from "./finance-client";

export const dynamic = "force-dynamic";

export default async function FinancePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: site } = await supabase
    .from("sites")
    .select("id, site_name, address, postcode, local_planning_authority")
    .eq("id", params.id)
    .single();

  if (!site) {
    notFound();
  }

  return <FinanceClient site={site} />;
}

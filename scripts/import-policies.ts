import fs from "fs";
import { parse } from "csv-parse/sync";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

type PolicyRow = {
  authority: string;
  policy_reference: string;
  policy_title: string;
  policy_category: string;
  strictness: string;
  policy_text: string;
  local_plan_name?: string;
  adopted_date?: string;
  review_date?: string;
};

async function importPolicies(filePath: string) {
  const csv = fs.readFileSync(filePath, "utf8");
  const rows = parse(csv, { columns: true }) as PolicyRow[];

  for (const row of rows) {
    const { error } = await supabase.from("local_plan_policies").insert({
      authority: row.authority,
      policy_reference: row.policy_reference,
      policy_title: row.policy_title,
      policy_category: row.policy_category,
      strictness: row.strictness,
      policy_text: row.policy_text,
      local_plan_name: row.local_plan_name || null,
      adopted_date: row.adopted_date || null,
      review_date: row.review_date || null,
    });

    if (error) {
      console.error("Failed to import", row.authority, row.policy_reference, error);
    } else {
      console.log(`Imported ${row.authority} ${row.policy_reference}`);
    }
  }
}

const filePath = process.argv[2] || "./scripts/local-plan-policies.csv";
importPolicies(filePath).catch((err) => {
  console.error(err);
  process.exit(1);
});

#!/usr/bin/env node

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type CSVRow = {
  authority: string;
  reference: string;
  address: string;
  postcode: string;
  description: string;
  units: string;
  decision: string;
  submitted_date: string;
  decision_date: string;
  planning_portal_url: string;
  refusal_reasons?: string;
};

async function importCSV(filePath: string) {
  const resolvedPath = path.resolve(filePath);
  console.log(`Reading CSV from: ${resolvedPath}`);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(resolvedPath, "utf-8");
  const rows: CSVRow[] = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`Found ${rows.length} applications to import`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    try {
      if (!row.reference || !row.address || !row.authority) {
        console.warn("Skipping row: Missing required fields");
        skipped += 1;
        continue;
      }

      const refusalReasons = row.refusal_reasons
        ? row.refusal_reasons
            .split(";")
            .map((reason) => reason.trim())
            .filter(Boolean)
        : null;

      const submittedDate = row.submitted_date ? parseDate(row.submitted_date) : null;
      const decisionDate = row.decision_date ? parseDate(row.decision_date) : null;

      const { error } = await supabase.from("planning_applications").insert({
        authority: row.authority.trim(),
        reference: row.reference.trim(),
        address: row.address.trim(),
        postcode: row.postcode?.trim() || null,
        description: row.description?.trim() || null,
        units: row.units ? Number.parseInt(row.units, 10) : null,
        decision: row.decision?.trim().toLowerCase() || null,
        submitted_date: submittedDate,
        decision_date: decisionDate,
        planning_portal_url: row.planning_portal_url?.trim() || null,
        refusal_reasons: refusalReasons,
        development_type: "residential",
      });

      if (error) {
        if (error.code === "23505") {
          console.log(`Skipped (duplicate): ${row.reference}`);
          skipped += 1;
        } else {
          console.error(`Error importing ${row.reference}: ${error.message}`);
          errors += 1;
        }
      } else {
        console.log(`Imported: ${row.reference} - ${row.address}`);
        imported += 1;
      }
    } catch (err) {
      console.error("Error processing row:", err);
      errors += 1;
    }
  }

  console.log("\nImport Summary:");
  console.log(`  Imported: ${imported}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Total: ${rows.length}`);
}

function parseDate(dateStr: string): string | null {
  const formats = [
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
    /^(\d{4})-(\d{2})-(\d{2})$/,
    /^(\d{2})-(\d{2})-(\d{4})$/,
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (!match) continue;

    if (format === formats[0] || format === formats[2]) {
      const [, day, month, year] = match;
      return `${year}-${month}-${day}`;
    }

    return dateStr;
  }

  console.warn(`Invalid date format: ${dateStr}`);
  return null;
}

const args = process.argv.slice(2);
const filePath = args[0] || "./scripts/planning-data.csv";

if (args.includes("--help") || args.includes("-h")) {
  console.log(`
Planning Data Import Script

Usage:
  npm run import-planning-data [file-path]

Arguments:
  file-path   Path to CSV file (default: ./scripts/planning-data.csv)

Examples:
  npm run import-planning-data ./data/cornwall-planning.csv
  `);
  process.exit(0);
}

console.log("Starting import...\n");
importCSV(filePath)
  .then(() => {
    console.log("\nImport complete!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\nImport failed:", err);
    process.exit(1);
  });

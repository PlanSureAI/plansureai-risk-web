import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

type ConstraintRow = {
  constraint_type: string;
  reference?: string;
  name?: string;
  lpa_code: string;
  geometry?: any;
  data: Record<string, any>;
};

async function main() {
  const rawDir = path.join(__dirname, "../data/raw");
  const outFile = path.join(__dirname, "../data/birmingham-constraints.jsonl");
  const out = fs.createWriteStream(outFile, { flags: "w" });

  let totalCount = 0;

  // 1. Conservation areas
  console.log("Processing conservation areas...");
  const conservationCsv = fs.readFileSync(
    path.join(rawDir, "conservation-area.csv"),
    "utf8"
  );
  const conservationRows = parse(conservationCsv, { columns: true });

  for (const row of conservationRows) {
    // Filter for Birmingham only
    if (
      row.organisation !== "local-authority:BIR" &&
      row["local-planning-authority"] !== "local-authority:BIR"
    ) {
      continue;
    }

    const constraint: ConstraintRow = {
      constraint_type: "conservation_area",
      reference: row.reference || row["conservation-area"],
      name: row.name,
      lpa_code: "birmingham",
      geometry: row.geometry ? JSON.parse(row.geometry) : null,
      data: row
    };
    out.write(JSON.stringify(constraint) + "\n");
    totalCount++;
  }

  // 2. Listed buildings
  console.log("Processing listed buildings...");
  const listedCsv = fs.readFileSync(
    path.join(rawDir, "listed-building-outline.csv"),
    "utf8"
  );
  const listedRows = parse(listedCsv, { columns: true });

  for (const row of listedRows) {
    if (
      row.organisation !== "local-authority:BIR" &&
      row["local-planning-authority"] !== "local-authority:BIR"
    ) {
      continue;
    }

    const constraint: ConstraintRow = {
      constraint_type: "listed_building",
      reference: row.reference || row["listed-building-outline"],
      name: row.name,
      lpa_code: "birmingham",
      geometry: row.geometry ? JSON.parse(row.geometry) : null,
      data: row
    };
    out.write(JSON.stringify(constraint) + "\n");
    totalCount++;
  }

  // 3. Article 4 directions
  console.log("Processing Article 4 directions...");
  const article4Csv = fs.readFileSync(
    path.join(rawDir, "article-4-direction-area.csv"),
    "utf8"
  );
  const article4Rows = parse(article4Csv, { columns: true });

  for (const row of article4Rows) {
    if (
      row.organisation !== "local-authority:BIR" &&
      row["local-planning-authority"] !== "local-authority:BIR"
    ) {
      continue;
    }

    const constraint: ConstraintRow = {
      constraint_type: "article_4_direction",
      reference: row.reference || row["article-4-direction-area"],
      name: row.name,
      lpa_code: "birmingham",
      geometry: row.geometry ? JSON.parse(row.geometry) : null,
      data: row
    };
    out.write(JSON.stringify(constraint) + "\n");
    totalCount++;
  }

  out.end();
  console.log(`✅ Wrote ${totalCount} Birmingham constraints to ${outFile}`);
}

main().catch(console.error);

import fs from "fs";
import path from "path";

type ApplicationRow = {
  lpa_code: string;
  lpa_reference: string;
  planning_data_id?: string | null;
  aggregator_application_id?: string | null;
  address_text?: string | null;
  description_text?: string | null;
  development_type?: string | null;
  received_date?: string | null;
  validated_date?: string | null;
  decision_date?: string | null;
  status?: string | null;
  decision?: string | null;
  uprns?: string[];
  site_centroid?: { lat: number; lng: number } | null;
  site_polygon?: any | null;
  last_synced_at?: string | null;
};

async function main() {
  // TODO: replace this with real fetch from PlanningAPI.uk / scraper.
  const sample: ApplicationRow[] = [
    {
      lpa_code: "CORNWALL",
      lpa_reference: "PA25/08856",
      planning_data_id: null,
      aggregator_application_id: null,
      address_text: "Land south of Church Road, Example Village, Cornwall",
      description_text: "Construction of 6 dwellings with associated access, parking and landscaping.",
      development_type: "Minor Dwellings",
      received_date: "2025-08-01",
      validated_date: "2025-08-05",
      decision_date: "2025-11-10",
      status: "decided",
      decision: "granted",
      uprns: ["100012345678"],
      site_centroid: { lat: 50.123456, lng: -5.123456 },
      site_polygon: null,
      last_synced_at: new Date().toISOString()
    }
  ];

  const outDir = path.join(process.cwd(), "data");
  const outFile = path.join(outDir, "cornwall-applications.jsonl");

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const stream = fs.createWriteStream(outFile, { encoding: "utf8" });
  for (const row of sample) {
    stream.write(JSON.stringify(row) + "\n");
  }
  stream.end();

  stream.on("finish", () => {
    console.log(`Wrote ${sample.length} rows to ${outFile}`);
  });
}

main().catch((err) => {
  console.error("Error in fetch-cornwall:", err);
  process.exit(1);
});

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function main() {
    // TODO: replace this with real fetch from PlanningAPI.uk / scraper.
    const sample = [
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
    const outDir = path_1.default.join(process.cwd(), "data");
    const outFile = path_1.default.join(outDir, "cornwall-applications.jsonl");
    if (!fs_1.default.existsSync(outDir)) {
        fs_1.default.mkdirSync(outDir, { recursive: true });
    }
    const stream = fs_1.default.createWriteStream(outFile, { encoding: "utf8" });
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

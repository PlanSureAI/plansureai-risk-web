"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function fetchApplications() {
    // TODO: replace with real Planning.data.gov.uk endpoint filtered to Birmingham.
    const url = "https://www.planning.data.gov.uk/planning-applications?lpa=birmingham&limit=100";
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed fetch ${url}: HTTP ${res.status}`);
    }
    const json = await res.json();
    const records = Array.isArray(json.records)
        ? json.records
        : Array.isArray(json.items)
            ? json.items
            : [];
    return records.map((item) => ({
        lpa_code: "birmingham",
        lpa_reference: item.reference ?? item.lpa_reference ?? item.id ?? "UNKNOWN_REF",
        planning_data_id: item.id ?? null,
        aggregator_application_id: null,
        address_text: item.site_address ?? item.address ?? null,
        description_text: item.description ?? null,
        development_type: item.development_type ?? null,
        received_date: item.received_date ?? null,
        validated_date: item.validated_date ?? null,
        decision_date: item.decision_date ?? item.decision?.date ?? null,
        status: item.status ?? null,
        decision: item.decision ?? null,
        uprns: item.uprns ?? item.uprn ?? null,
        site_centroid: item.site_centroid_lat && item.site_centroid_lng
            ? { lat: Number(item.site_centroid_lat), lng: Number(item.site_centroid_lng) }
            : null,
        site_polygon: item.site_polygon ?? null,
        last_synced_at: new Date().toISOString()
    }));
}
async function main() {
    const outDir = path_1.default.join(process.cwd(), "data");
    const outPath = path_1.default.join(outDir, "birmingham-applications.jsonl");
    if (!fs_1.default.existsSync(outDir)) {
        fs_1.default.mkdirSync(outDir, { recursive: true });
    }
    let rows = [];
    try {
        rows = await fetchApplications();
    }
    catch (err) {
        console.error("Fetch failed, falling back to sample:", err);
        rows = [
            {
                lpa_code: "birmingham",
                lpa_reference: "2024/00001/PA",
                status: "approved",
                decision_date: "2024-06-12",
                last_synced_at: new Date().toISOString()
            }
        ];
    }
    const stream = fs_1.default.createWriteStream(outPath, { flags: "w", encoding: "utf8" });
    for (const row of rows) {
        stream.write(JSON.stringify(row) + "\n");
    }
    stream.end();
    stream.on("finish", () => {
        console.log(`Wrote ${rows.length} rows to ${outPath}`);
    });
}
main().catch((err) => {
    console.error("Error in fetch-birmingham:", err);
    process.exit(1);
});

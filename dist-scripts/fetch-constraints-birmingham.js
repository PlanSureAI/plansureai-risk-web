"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const sync_1 = require("csv-parse/sync");
async function main() {
    const rawDir = path_1.default.join(__dirname, "../data/raw");
    const outFile = path_1.default.join(__dirname, "../data/birmingham-constraints.jsonl");
    const out = fs_1.default.createWriteStream(outFile, { flags: "w" });
    let totalCount = 0;
    // 1. Conservation areas
    console.log("Processing conservation areas...");
    const conservationCsv = fs_1.default.readFileSync(path_1.default.join(rawDir, "conservation-area.csv"), "utf8");
    const conservationRows = (0, sync_1.parse)(conservationCsv, { columns: true });
    for (const row of conservationRows) {
        // Filter for Birmingham only
        if (row.organisation !== "local-authority:BIR" &&
            row["local-planning-authority"] !== "local-authority:BIR") {
            continue;
        }
        const constraint = {
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
    const listedCsv = fs_1.default.readFileSync(path_1.default.join(rawDir, "listed-building-outline.csv"), "utf8");
    const listedRows = (0, sync_1.parse)(listedCsv, { columns: true });
    for (const row of listedRows) {
        if (row.organisation !== "local-authority:BIR" &&
            row["local-planning-authority"] !== "local-authority:BIR") {
            continue;
        }
        const constraint = {
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
    const article4Csv = fs_1.default.readFileSync(path_1.default.join(rawDir, "article-4-direction-area.csv"), "utf8");
    const article4Rows = (0, sync_1.parse)(article4Csv, { columns: true });
    for (const row of article4Rows) {
        if (row.organisation !== "local-authority:BIR" &&
            row["local-planning-authority"] !== "local-authority:BIR") {
            continue;
        }
        const constraint = {
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

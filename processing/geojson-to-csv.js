import fs from "fs";
import path from "path";

// --- CLI arguments ---
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error("Usage: node geojson-to-csv.js <input.geojson> [output.csv]");
  process.exit(1);
}

const inputFile = args[0];
const outputFile =
  args[1] || path.basename(inputFile, path.extname(inputFile)) + ".csv";

// --- Load GeoJSON ---
const geojson = JSON.parse(fs.readFileSync(inputFile, "utf8"));

// Table property definitions
const tableProperties = [
  { key: "City_x", label: "City", unit: "" },
  { key: "id", label: "Cell ID", unit: "" },
  { key: "LCZ", label: "LCZ", unit: "" },
  { key: "description", label: "Description", unit: "" },
  { key: "Building height", label: "Building height", unit: "m" },
  { key: "Height varability", label: "Height variability", unit: "m" },
  { key: "Sky view factor", label: "Sky view factor", unit: "-" },
  { key: "Frontal area index", label: "Frontal area index", unit: "-" },
  { key: "Aspect ratio", label: "Aspect ratio", unit: "-" },
  { key: "Building cover fraction", label: "Building cover fraction", unit: "-" },
  {
    key: "Impervious surface cover fraction",
    label: "Impervious surface cover fraction",
    unit: "-",
  },
  {
    key: "Pervious surface cover fraction",
    label: "Pervious surface cover fraction",
    unit: "-",
  },
  { key: "Water cover fraction", label: "Water cover fraction", unit: "-" },
  { key: "Intersections", label: "Road intersections", unit: "-" },
  { key: "Length primary road", label: "Length primary roads", unit: "m" },
  { key: "Length secondary road", label: "Length secondary roads", unit: "m" },
  { key: "Length highway", label: "Length highway", unit: "m" },
  { key: "LST_mean", label: "LST", unit: "°C" },
  { key: "Irradiance_S", label: "Irradiance_S", unit: "kWh/m²" },
  { key: "Irradiance_W", label: "Irradiance_W", unit: "kWh/m²" },
];

// Generate CSV headers
const headers = tableProperties.map((p) =>
  p.unit ? `${p.label} (${p.unit})` : p.label
);

// Collect all rows
const rows = geojson.features.map((feature) =>
  tableProperties.map((p) => {
    let val = feature.properties[p.key];
    // Escape commas and quotes in strings
    if (typeof val === "string") {
      val = `"${val.replace(/"/g, '""')}"`;
    }
    return val ?? "";
  })
);

// Build CSV string
const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

// --- Save CSV ---
fs.writeFileSync(outputFile, "\uFEFF" + csvContent, "utf8");

console.log(`✅ CSV generated: ${outputFile}`);
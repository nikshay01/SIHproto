import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Standard e-waste categories
const EWASTE_CATALOG = {
  ITEW: [
    "Laptops & Computers",
    "Smartphones & Tablets",
    "Printers & Scanners",
    "Servers & Networking Gear",
    "Cables, Adapters & Circuit Boards (PCBs)"
  ],
  CEEW: [
    "Televisions & Monitory Displays",
    "Audio Systems & Speakers",
    "Set-Top Boxes & DVD Players",
    "Cameras & CCTV Equipment"
  ],
  APPLIANCES_LARGE: [
    "Refrigerators & Freezers",
    "Washing Machines & Dryers",
    "Air Conditioners & Coolers"
  ],
  APPLIANCES_SMALL: [
    "Microwaves & Electric Ovens",
    "Vacuum Cleaners & Irons",
    "Kitchen Blenders & Small Appliances"
  ],
  BATTERIES: [
    "Lithium-ion Batteries (Phones, Laptops, EVs)",
    "Lead-Acid Batteries & Inverters",
    "Nickel-Cadmium & Button Cells"
  ],
  SOLAR_PV: [
    "Solar PV Modules & Panels",
    "Solar Inverters & Controllers"
  ],
  MEDICAL: [
    "Diagnostic Monitors & Medical Electronics",
    "Laboratory Testing Equipment"
  ]
};

function determineAcceptedEwaste(facility) {
  const name = (facility.name || "").toLowerCase();
  const type = facility.type || "Collection Center";
  const capacity = facility.capacity_mta || facility.capacityMta || 0;

  let acceptedTypes = new Set();
  let acceptedCategories = new Set();
  let hazardousHandled = new Set(["Lead", "Printed Circuit Boards (PCBs)"]);
  let specializations = [];

  // Base assignments by Facility Type
  if (type === "Recycler") {
    // Recyclers handle wide variety
    EWASTE_CATALOG.ITEW.forEach(i => acceptedTypes.add(i));
    EWASTE_CATALOG.CEEW.forEach(i => acceptedTypes.add(i));
    acceptedCategories.add("ITEW");
    acceptedCategories.add("CEEW");
    acceptedCategories.add("Batteries");
    hazardousHandled.add("Mercury");
    hazardousHandled.add("Cadmium");
    hazardousHandled.add("Lithium");
    hazardousHandled.add("Flame Retardants");

    if (capacity > 3000) {
      EWASTE_CATALOG.APPLIANCES_LARGE.forEach(i => acceptedTypes.add(i));
      EWASTE_CATALOG.APPLIANCES_SMALL.forEach(i => acceptedTypes.add(i));
      EWASTE_CATALOG.BATTERIES.forEach(i => acceptedTypes.add(i));
      acceptedCategories.add("Large Appliances");
      acceptedCategories.add("Small Appliances");
      specializations.push("Industrial Pyrometallurgical / Hydrometallurgical Refining");
      specializations.push("Precious Metals Extraction (Gold, Silver, Copper)");
    } else {
      EWASTE_CATALOG.APPLIANCES_SMALL.forEach(i => acceptedTypes.add(i));
      EWASTE_CATALOG.BATTERIES.slice(0, 2).forEach(i => acceptedTypes.add(i));
      acceptedCategories.add("Small Appliances");
      specializations.push("Component Desoldering & Material Shredding");
    }
  } else if (type === "Dismantler") {
    EWASTE_CATALOG.ITEW.forEach(i => acceptedTypes.add(i));
    EWASTE_CATALOG.CEEW.slice(0, 3).forEach(i => acceptedTypes.add(i));
    EWASTE_CATALOG.APPLIANCES_SMALL.forEach(i => acceptedTypes.add(i));
    acceptedCategories.add("ITEW");
    acceptedCategories.add("CEEW");
    acceptedCategories.add("Small Appliances");
    hazardousHandled.add("Mercury");
    hazardousHandled.add("Cadmium");
    specializations.push("Manual Depollution & Component Segregation");
    specializations.push("PCB & Wire Harness Dismantling");
  } else if (type === "Refurbisher") {
    // Refurbishers focus on IT and consumer electronics
    acceptedTypes.add("Laptops & Computers");
    acceptedTypes.add("Smartphones & Tablets");
    acceptedTypes.add("Servers & Networking Gear");
    acceptedTypes.add("Televisions & Monitory Displays");
    acceptedTypes.add("Printers & Scanners");
    acceptedCategories.add("ITEW");
    acceptedCategories.add("CEEW");
    hazardousHandled.add("Lithium");
    specializations.push("Component-Level Repair & Testing");
    specializations.push("Data Sanitization & Secondary Life Optimization");
  } else {
    // Collection Center
    acceptedTypes.add("Smartphones & Tablets");
    acceptedTypes.add("Laptops & Computers");
    acceptedTypes.add("Cables, Adapters & Circuit Boards (PCBs)");
    acceptedTypes.add("Lithium-ion Batteries (Phones, Laptops, EVs)");
    acceptedTypes.add("Televisions & Monitory Displays");
    acceptedTypes.add("Small Household Appliances");
    acceptedCategories.add("ITEW");
    acceptedCategories.add("CEEW");
    acceptedCategories.add("Batteries");
    hazardousHandled.add("Lithium");
    specializations.push("Authorized Consumer Drop-off & Aggregation");
    specializations.push("EPR Certificate Generation Support");
  }

  // Specific keyword bonuses
  if (name.includes("battery") || name.includes("lead") || name.includes("power") || name.includes("energy")) {
    EWASTE_CATALOG.BATTERIES.forEach(i => acceptedTypes.add(i));
    acceptedCategories.add("Batteries");
    hazardousHandled.add("Lithium");
    hazardousHandled.add("Lead-Acid Electrolytes");
    specializations.push("Battery Neutralization & Black Mass Recovery");
  }

  if (name.includes("solar") || name.includes("pv") || name.includes("sun") || name.includes("green")) {
    EWASTE_CATALOG.SOLAR_PV.forEach(i => acceptedTypes.add(i));
    acceptedCategories.add("Solar PV");
    specializations.push("Silicon Wafer & Glass Delamination");
  }

  if (name.includes("medical") || name.includes("health") || name.includes("care") || name.includes("bio")) {
    EWASTE_CATALOG.MEDICAL.forEach(i => acceptedTypes.add(i));
    acceptedCategories.add("Medical Electronics");
    hazardousHandled.add("Radiation Shielding Elements");
    specializations.push("Medical Device Decontamination & Component Recovery");
  }

  return {
    accepted_ewaste_types: Array.from(acceptedTypes),
    accepted_categories: Array.from(acceptedCategories),
    hazardous_materials_handled: Array.from(hazardousHandled),
    specializations: specializations.length > 0 ? specializations : ["Authorized Statutory Recycling Under E-Waste Rules 2022"]
  };
}

function processFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  console.log(`Processing: ${filePath}...`);
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);

  const facilities = data.all_facilities || data.facilities || (Array.isArray(data) ? data : []);
  let count = 0;

  for (const fac of facilities) {
    const enrichment = determineAcceptedEwaste(fac);
    fac.accepted_ewaste_types = enrichment.accepted_ewaste_types;
    fac.accepted_categories = enrichment.accepted_categories;
    fac.hazardous_materials_handled = enrichment.hazardous_materials_handled;
    fac.specializations = enrichment.specializations;
    count++;
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`✓ Enriched ${count} facilities in ${filePath}`);
}

const filePaths = [
  path.join(__dirname, "../data/e-waste-facilities/all_facilities_fixed.json"),
  path.join(__dirname, "../data/e-waste-facilities/all_facilities.json"),
  path.join(__dirname, "../../data/e-waste-facilities/all_facilities_fixed.json"),
  path.join(__dirname, "../../data/e-waste-facilities/all_facilities.json")
];

for (const fp of filePaths) {
  processFile(fp);
}

console.log("Enrichment complete!");

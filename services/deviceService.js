import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { calculateDeviceCredits } from "./creditEngine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, "../data/device_composition.json");

let deviceCatalog = [];
let metadata = {};

function loadDatabase() {
  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    const json = JSON.parse(raw);
    metadata = json.metadata || {};
    deviceCatalog = (json.devices || []).map(device => {
      const creditInfo = calculateDeviceCredits(device);
      return {
        ...device,
        calculatedCredits: creditInfo.estimatedCredits,
        recoverableMaterials: creditInfo.materials
      };
    });
  } catch (err) {
    console.error("Failed to load device composition database:", err);
    deviceCatalog = [];
  }
}

// Initial load
loadDatabase();

export function getAllDevices() {
  return deviceCatalog;
}

export function getCategories() {
  const set = new Set(deviceCatalog.map(d => d.category));
  return Array.from(set).sort();
}

export function getBrands(category = null) {
  const filtered = category ? deviceCatalog.filter(d => d.category.toLowerCase() === category.toLowerCase()) : deviceCatalog;
  const set = new Set(filtered.map(d => d.brand));
  return Array.from(set).sort();
}

export function getModels(category = null, brand = null) {
  let filtered = deviceCatalog;
  if (category) {
    filtered = filtered.filter(d => d.category.toLowerCase() === category.toLowerCase());
  }
  if (brand) {
    filtered = filtered.filter(d => d.brand.toLowerCase() === brand.toLowerCase());
  }
  return filtered.map(d => ({
    id: d.id,
    category: d.category,
    brand: d.brand,
    model: d.model,
    releaseYear: d.releaseYear,
    weightGrams: d.weightGrams,
    calculatedCredits: d.calculatedCredits,
    visualFeatures: d.visualFeatures
  }));
}

export function getDeviceById(id) {
  return deviceCatalog.find(d => d.id === id) || null;
}

export function findDeviceByBrandAndModel(brand, model) {
  if (!brand || !model) return null;
  const b = brand.trim().toLowerCase();
  const m = model.trim().toLowerCase();

  return deviceCatalog.find(d => {
    const dbB = d.brand.toLowerCase();
    const dbM = d.model.toLowerCase();
    return (dbB.includes(b) || b.includes(dbB)) && (dbM.includes(m) || m.includes(dbM));
  }) || null;
}

export function searchDevices(query = "") {
  const q = query.trim().toLowerCase();
  if (!q) return deviceCatalog;

  return deviceCatalog.filter(d => 
    d.brand.toLowerCase().includes(q) ||
    d.model.toLowerCase().includes(q) ||
    d.category.toLowerCase().includes(q) ||
    (d.visualFeatures && d.visualFeatures.toLowerCase().includes(q))
  );
}

export function getMetadata() {
  return metadata;
}

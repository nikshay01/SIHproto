import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { calculateDeviceCredits } from "./creditEngine.js";
import { deviceCache } from "./cacheService.js";
import DeviceComposition from "../models/DeviceComposition.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_DB_PATH = path.join(__dirname, "../../data/device_composition.json");

let inMemoryDevices = [];
let metadata = {};

function loadLocalDatabase() {
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const raw = fs.readFileSync(LOCAL_DB_PATH, "utf-8");
      const json = JSON.parse(raw);
      metadata = json.metadata || {};
      inMemoryDevices = (json.devices || []).map(device => {
        try {
          const creditInfo = calculateDeviceCredits(device);
          return {
            ...device,
            calculatedCredits: creditInfo.estimatedCredits,
            recoverableMaterials: creditInfo.materials,
            environmentalImpact: creditInfo.environmentalImpact
          };
        } catch (mapErr) {
          console.warn(`Failed to calculate credits for device ${device.id || device.model}:`, mapErr.message);
          // Return device without calculated fields
          return {
            ...device,
            calculatedCredits: 0,
            recoverableMaterials: {},
            environmentalImpact: {}
          };
        }
      });
    }
  } catch (err) {
    console.error("Failed to load local device composition database:", err.message);
  }
}

// Initial load of local cache
loadLocalDatabase();

export async function getAllDevices() {
  const cacheKey = "devices:all";
  const cached = deviceCache.get(cacheKey);
  if (cached) return cached;

  try {
    const mongoDevices = await DeviceComposition.find().lean();
    if (mongoDevices && mongoDevices.length > 0) {
      const formatted = mongoDevices.map(d => {
        const creditInfo = calculateDeviceCredits(d);
        return {
          id: d.deviceId || d._id.toString(),
          category: d.category,
          brand: d.brand,
          model: d.model,
          releaseYear: d.releaseYear,
          weightGrams: d.weightGrams,
          visualFeatures: d.visualFeatures,
          materials: d.materials,
          hazardousElements: d.hazardousElements,
          calculatedCredits: creditInfo.estimatedCredits,
          recoverableMaterials: creditInfo.materials,
          environmentalImpact: creditInfo.environmentalImpact
        };
      });
      deviceCache.set(cacheKey, formatted);
      return formatted;
    }
  } catch (e) {
    // Fall back to in-memory
  }

  deviceCache.set(cacheKey, inMemoryDevices);
  return inMemoryDevices;
}

export async function getCategories() {
  const devices = await getAllDevices();
  const set = new Set(devices.map(d => d.category));
  return Array.from(set).sort();
}

export async function getBrands(category = null) {
  const devices = await getAllDevices();
  const filtered = category ? devices.filter(d => d.category.toLowerCase() === category.toLowerCase()) : devices;
  const set = new Set(filtered.map(d => d.brand));
  return Array.from(set).sort();
}

export async function getModels(category = null, brand = null) {
  const devices = await getAllDevices();
  let filtered = devices;
  if (category) {
    filtered = filtered.filter(d => d.category.toLowerCase() === category.toLowerCase());
  }
  if (brand) {
    filtered = filtered.filter(d => d.brand.toLowerCase() === brand.toLowerCase());
  }
  return filtered.map(d => ({
    id: d.id || d.deviceId,
    category: d.category,
    brand: d.brand,
    model: d.model,
    releaseYear: d.releaseYear,
    weightGrams: d.weightGrams,
    calculatedCredits: d.calculatedCredits,
    visualFeatures: d.visualFeatures,
    materials: d.materials,
    environmentalImpact: d.environmentalImpact
  }));
}

export async function getDeviceById(id) {
  if (!id) return null;
  const devices = await getAllDevices();
  return devices.find(d => (d.id === id || d.deviceId === id)) || null;
}

export async function findDeviceByBrandAndModel(brand, model) {
  if (!brand || !model) return null;
  const b = brand.trim().toLowerCase();
  const m = model.trim().toLowerCase();

  const devices = await getAllDevices();
  return devices.find(d => {
    const dbB = (d.brand || "").toLowerCase();
    const dbM = (d.model || "").toLowerCase();
    return (dbB.includes(b) || b.includes(dbB)) && (dbM.includes(m) || m.includes(dbM));
  }) || null;
}

export async function searchDevices(query = "") {
  const q = query.trim().toLowerCase();
  const devices = await getAllDevices();
  if (!q) return devices;

  return devices.filter(d => 
    (d.brand && d.brand.toLowerCase().includes(q)) ||
    (d.model && d.model.toLowerCase().includes(q)) ||
    (d.category && d.category.toLowerCase().includes(q)) ||
    (d.visualFeatures && d.visualFeatures.toLowerCase().includes(q))
  );
}

export function getMetadata() {
  return metadata;
}

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { facilityCache, geoDistanceCache } from "./cacheService.js";
import { executeRegionalQuery, executeScatterGatherQuery } from "./shardRouter.js";
import Facility from "../models/Facility.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXED_DATASET_PATH = path.join(__dirname, "../../data/e-waste-facilities/all_facilities_fixed.json");

let inMemoryFacilities = [];
let datasetMetadata = {};
let stateWiseSummary = [];

function loadFixedDataset() {
  try {
    if (fs.existsSync(FIXED_DATASET_PATH)) {
      const raw = fs.readFileSync(FIXED_DATASET_PATH, "utf-8");
      const json = JSON.parse(raw);
      datasetMetadata = json.metadata || {};
      stateWiseSummary = json.state_wise_summary || [];
      inMemoryFacilities = (json.all_facilities || []).map(f => ({
        id: f.id,
        facilityId: f.id,
        name: f.name,
        type: f.type,
        address: f.address,
        district: f.district,
        state: f.state,
        capacityMta: f.capacity_mta || 0,
        capacity_mta: f.capacity_mta || 0,
        isAuthorized: f.is_authorized ?? true,
        authorizationStatus: f.authorization_status || "Authorized",
        authorizationBy: f.authorization_by || "SPCB / CPCB",
        regulatoryCompliance: f.regulatory_compliance || "E-Waste (Management) Rules, 2022",
        contact: {
          phone: f.contact?.phone || "",
          tollFree: f.contact?.toll_free || "",
          email: f.contact?.email || "",
          website: f.contact?.website || "",
          contactPerson: f.contact?.contact_person || ""
        },
        location: {
          latitude: f.location?.latitude || 20.5937,
          longitude: f.location?.longitude || 78.9629,
          googleMapsUrl: f.location?.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(f.name + ", " + f.address)}`,
          coordinatesUrl: f.location?.coordinates_url || `https://www.google.com/maps?q=${f.location?.latitude || 20.5937},${f.location?.longitude || 78.9629}`,
          formattedAddress: f.location?.formatted_address || f.address
        },
        status: f.status || "Active"
      }));
    }
  } catch (err) {
    console.error("Failed to load fixed facilities dataset:", err.message);
  }
}

// Initial load
loadFixedDataset();

/**
 * Haversine formula for calculating real-world kilometer distance between two GPS coordinates
 */
export function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export async function getAllFacilities() {
  const cacheKey = "facilities:master_list";
  const cached = facilityCache.get(cacheKey);
  if (cached) return cached;

  try {
    const mongoData = await Facility.find({ isAuthorized: true }).lean();
    if (mongoData && mongoData.length > 0) {
      const formatted = mongoData.map(f => ({
        id: f.facilityId,
        facilityId: f.facilityId,
        name: f.name,
        type: f.type,
        address: f.address,
        district: f.district,
        state: f.state,
        capacityMta: f.capacityMta,
        capacity_mta: f.capacityMta,
        isAuthorized: f.isAuthorized,
        authorizationStatus: f.authorizationStatus,
        authorizationBy: f.authorizationBy,
        regulatoryCompliance: f.regulatoryCompliance,
        contact: f.contact,
        location: {
          latitude: f.location?.latitude || (f.location?.coordinates ? f.location.coordinates[1] : 20.5937),
          longitude: f.location?.longitude || (f.location?.coordinates ? f.location.coordinates[0] : 78.9629),
          googleMapsUrl: f.location?.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(f.name + ", " + f.address)}`,
          coordinatesUrl: `https://www.google.com/maps?q=${f.location?.latitude || 20.5937},${f.location?.longitude || 78.9629}`,
          formattedAddress: f.location?.formattedAddress || f.address
        },
        status: f.status
      }));
      facilityCache.set(cacheKey, formatted);
      return formatted;
    }
  } catch (e) {
    // MongoDB unavailable, use fixed dataset
  }

  facilityCache.set(cacheKey, inMemoryFacilities);
  return inMemoryFacilities;
}

export async function queryFacilities({
  state = null,
  type = null,
  minCapacity = 0,
  search = "",
  userLat = null,
  userLng = null,
  sortBy = "distance_asc",
  limit = 500,
  offset = 0
}) {
  let list = await getAllFacilities();

  // 1. Filter by State
  if (state && state !== "ALL") {
    list = list.filter(f => f.state.toLowerCase() === state.toLowerCase());
  }

  // 2. Filter by Facility Type
  if (type && type !== "ALL") {
    list = list.filter(f => f.type.toLowerCase() === type.toLowerCase());
  }

  // 3. Filter by Capacity
  const minCapNum = Number(minCapacity) || 0;
  if (minCapNum > 0) {
    list = list.filter(f => (f.capacityMta || f.capacity_mta || 0) >= minCapNum);
  }

  // 4. Global Text Search
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(f =>
      (f.name && f.name.toLowerCase().includes(q)) ||
      (f.address && f.address.toLowerCase().includes(q)) ||
      (f.district && f.district.toLowerCase().includes(q)) ||
      (f.state && f.state.toLowerCase().includes(q)) ||
      (f.facilityId && f.facilityId.toLowerCase().includes(q)) ||
      (f.type && f.type.toLowerCase().includes(q))
    );
  }

  // 5. Calculate Distances if user location provided
  const hasUserCoords = userLat != null && userLng != null;
  list = list.map(f => {
    let distanceKm = null;
    if (hasUserCoords && f.location?.latitude && f.location?.longitude) {
      distanceKm = calculateHaversineDistanceKm(
        Number(userLat),
        Number(userLng),
        Number(f.location.latitude),
        Number(f.location.longitude)
      );
    }
    return {
      ...f,
      distanceKm,
      distance_km: distanceKm
    };
  });

  // 6. Sort
  list.sort((a, b) => {
    switch (sortBy) {
      case "distance_asc":
        if (a.distanceKm == null && b.distanceKm == null) return 0;
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      case "capacity_desc":
        return (b.capacityMta || 0) - (a.capacityMta || 0);
      case "capacity_asc":
        return (a.capacityMta || 0) - (b.capacityMta || 0);
      case "name_asc":
        return (a.name || "").localeCompare(b.name || "");
      case "state_asc":
        return (a.state || "").localeCompare(b.state || "");
      default:
        return 0;
    }
  });

  const total = list.length;
  const paginated = list.slice(offset, offset + limit);

  return {
    total,
    count: paginated.length,
    facilities: paginated
  };
}

export async function getFacilityById(id) {
  if (!id) return null;
  const list = await getAllFacilities();
  return list.find(f => f.id === id || f.facilityId === id) || null;
}

export function getStateSummaries() {
  return stateWiseSummary;
}

export function getDatasetMetadata() {
  return datasetMetadata;
}

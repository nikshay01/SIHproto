/**
 * Regional Database Sharding Configuration & Topology Map
 * Partitions India's 36 States & UTs across 6 Virtual Database Shards
 * for optimized geospatial lookup, localized querying, and high horizontal scalability.
 */

export const REGIONAL_SHARDS = {
  SHARD_NORTH: {
    id: "SHARD_NORTH",
    name: "Northern Region Shard",
    states: [
      "Delhi", "Haryana", "Punjab", "Rajasthan", "Uttar Pradesh", 
      "Uttarakhand", "Himachal Pradesh", "Jammu and Kashmir", "Ladakh", "Chandigarh"
    ],
    primaryGeoBounds: { minLat: 26.5, maxLat: 37.0, minLng: 73.0, maxLng: 84.5 }
  },
  SHARD_SOUTH: {
    id: "SHARD_SOUTH",
    name: "Southern Region Shard",
    states: [
      "Karnataka", "Tamil Nadu", "Telangana", "Andhra Pradesh", 
      "Kerala", "Puducherry", "Lakshadweep", "Andaman and Nicobar Islands"
    ],
    primaryGeoBounds: { minLat: 8.0, maxLat: 20.0, minLng: 72.0, maxLng: 93.5 }
  },
  SHARD_WEST: {
    id: "SHARD_WEST",
    name: "Western Region Shard",
    states: [
      "Maharashtra", "Gujarat", "Goa", "Dadra and Nagar Haveli and Daman and Diu"
    ],
    primaryGeoBounds: { minLat: 15.0, maxLat: 24.5, minLng: 68.0, maxLng: 80.5 }
  },
  SHARD_EAST: {
    id: "SHARD_EAST",
    name: "Eastern Region Shard",
    states: [
      "West Bengal", "Bihar", "Jharkhand", "Odisha"
    ],
    primaryGeoBounds: { minLat: 17.5, maxLat: 27.5, minLng: 81.5, maxLng: 89.5 }
  },
  SHARD_CENTRAL: {
    id: "SHARD_CENTRAL",
    name: "Central Region Shard",
    states: [
      "Madhya Pradesh", "Chhattisgarh"
    ],
    primaryGeoBounds: { minLat: 17.8, maxLat: 26.8, minLng: 74.0, maxLng: 84.0 }
  },
  SHARD_NORTHEAST: {
    id: "SHARD_NORTHEAST",
    name: "North-Eastern Region Shard",
    states: [
      "Assam", "Arunachal Pradesh", "Manipur", "Meghalaya", 
      "Mizoram", "Nagaland", "Sikkim", "Tripura"
    ],
    primaryGeoBounds: { minLat: 21.8, maxLat: 29.5, minLng: 88.0, maxLng: 97.5 }
  }
};

/**
 * Maps a state name to its corresponding regional shard ID
 * @param {string} stateName 
 * @returns {string} Shard ID
 */
export function getShardForState(stateName) {
  if (!stateName) return "SHARD_NORTH";
  const normalized = stateName.trim().toLowerCase();

  for (const [shardKey, config] of Object.entries(REGIONAL_SHARDS)) {
    const match = config.states.some(s => s.toLowerCase() === normalized || normalized.includes(s.toLowerCase()));
    if (match) return shardKey;
  }
  return "SHARD_NORTH"; // Default fallback shard
}

/**
 * Consistent Hash function for partitioning User transactions/wallets across shards
 * @param {string} key 
 * @returns {string} Shard ID
 */
export function getShardForUser(userId = "guest-user") {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const shardKeys = Object.keys(REGIONAL_SHARDS);
  const index = Math.abs(hash) % shardKeys.length;
  return shardKeys[index];
}

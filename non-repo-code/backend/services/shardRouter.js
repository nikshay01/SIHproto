import { REGIONAL_SHARDS, getShardForState, getShardForUser } from "../config/shardingConfig.js";
import { facilityCache } from "./cacheService.js";
import Facility from "../models/Facility.js";

// Shard performance metrics tracker
const shardMetrics = {
  SHARD_NORTH: { queries: 0, totalLatencyMs: 0, itemsCount: 0 },
  SHARD_SOUTH: { queries: 0, totalLatencyMs: 0, itemsCount: 0 },
  SHARD_WEST: { queries: 0, totalLatencyMs: 0, itemsCount: 0 },
  SHARD_EAST: { queries: 0, totalLatencyMs: 0, itemsCount: 0 },
  SHARD_CENTRAL: { queries: 0, totalLatencyMs: 0, itemsCount: 0 },
  SHARD_NORTHEAST: { queries: 0, totalLatencyMs: 0, itemsCount: 0 }
};

/**
 * Executes a targeted regional query on the mapped shard partition
 * @param {string} stateName 
 * @param {Object} filterOptions 
 * @returns {Promise<Array>}
 */
export async function executeRegionalQuery(stateName, filterOptions = {}) {
  const shardId = getShardForState(stateName);
  const startTime = Date.now();

  try {
    const query = { state: new RegExp(`^${stateName}$`, "i"), ...filterOptions };
    const results = await Facility.find(query).lean();
    
    const latency = Date.now() - startTime;
    recordShardMetrics(shardId, latency, results.length);

    return {
      shardId,
      shardName: REGIONAL_SHARDS[shardId].name,
      executionMode: "TARGETED_SHARD_ROUTING",
      count: results.length,
      latencyMs: latency,
      data: results
    };
  } catch (err) {
    console.warn(`Shard ${shardId} query failed, falling back:`, err.message);
    return null;
  }
}

/**
 * Scatter-gather fan-out query across all regional shards in parallel
 * @param {Object} filterQuery 
 * @returns {Promise<Object>}
 */
export async function executeScatterGatherQuery(filterQuery = {}) {
  const startTime = Date.now();
  const shardKeys = Object.keys(REGIONAL_SHARDS);

  const promises = shardKeys.map(async (shardKey) => {
    const shard = REGIONAL_SHARDS[shardKey];
    const shardStart = Date.now();
    
    const query = {
      state: { $in: shard.states.map(s => new RegExp(`^${s}$`, "i")) },
      ...filterQuery
    };

    const data = await Facility.find(query).lean();
    const latency = Date.now() - shardStart;
    recordShardMetrics(shardKey, latency, data.length);

    return {
      shardId: shardKey,
      shardName: shard.name,
      count: data.length,
      latencyMs: latency,
      data
    };
  });

  const shardResults = await Promise.all(promises);
  const totalLatency = Date.now() - startTime;

  const combinedData = shardResults.flatMap(r => r.data);

  return {
    executionMode: "PARALLEL_SCATTER_GATHER",
    totalShards: shardKeys.length,
    totalCount: combinedData.length,
    totalLatencyMs: totalLatency,
    shardBreakdown: shardResults.map(r => ({
      shardId: r.shardId,
      name: r.shardName,
      count: r.count,
      latencyMs: r.latencyMs
    })),
    data: combinedData
  };
}

function recordShardMetrics(shardId, latencyMs, count) {
  if (shardMetrics[shardId]) {
    shardMetrics[shardId].queries++;
    shardMetrics[shardId].totalLatencyMs += latencyMs;
    shardMetrics[shardId].itemsCount = count;
  }
}

export function getShardTopologyMetrics() {
  return Object.entries(REGIONAL_SHARDS).map(([key, config]) => {
    const m = shardMetrics[key] || { queries: 0, totalLatencyMs: 0, itemsCount: 0 };
    const avgLatency = m.queries > 0 ? (m.totalLatencyMs / m.queries).toFixed(2) : "0.00";
    return {
      shardId: key,
      name: config.name,
      statesCovered: config.states.length,
      statesList: config.states,
      totalQueriesExecuted: m.queries,
      avgLatencyMs: Number(avgLatency),
      health: "HEALTHY",
      status: "ONLINE",
      geoBounds: config.primaryGeoBounds
    };
  });
}

import express from "express";
import os from "os";
import { getShardTopologyMetrics } from "../services/shardRouter.js";
import { facilityCache, deviceCache, geoDistanceCache } from "../services/cacheService.js";
import { DB_STATE } from "../config/database.js";

const router = express.Router();

router.get("/metrics", (req, res) => {
  const memoryUsage = process.memoryUsage();
  const shards = getShardTopologyMetrics();

  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    system: {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      freeMemoryMb: Math.round(os.freemem() / 1024 / 1024),
      totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
      uptimeSeconds: Math.floor(os.uptime())
    },
    process: {
      pid: process.pid,
      workerId: process.env.WORKER_ID || "worker-1",
      uptimeSeconds: Math.floor(process.uptime()),
      heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      rssMb: Math.round(memoryUsage.rss / 1024 / 1024)
    },
    database: {
      ...DB_STATE
    },
    caching: {
      facilitiesCache: facilityCache.getStats(),
      devicesCache: deviceCache.getStats(),
      geoDistanceCache: geoDistanceCache.getStats()
    },
    sharding: {
      totalShards: shards.length,
      shards
    }
  });
});

router.get("/topology", (req, res) => {
  const shards = getShardTopologyMetrics();

  res.json({
    ok: true,
    architecture: {
      gateway: "Express Cluster Master / Round-Robin Load Balancer",
      workerInstances: Math.min(4, os.cpus().length || 1),
      databasePartitioning: "6-Region Virtual State Partitioning (North, South, West, East, Central, NorthEast)",
      cacheStrategy: "In-Memory LRU with TTL Eviction & Tagged Invalidation",
      aiVisionEngine: "NVIDIA NIM / Llama 3.2 11B Vision Instruct",
      concurrencyEngine: "Optimistic Locking & Atomic Balance Increments ($inc)"
    },
    shards
  });
});

export default router;

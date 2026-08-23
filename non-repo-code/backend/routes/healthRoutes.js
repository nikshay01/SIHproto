import express from "express";
import { DB_STATE } from "../config/database.js";
import { getAllDevices } from "../services/deviceService.js";
import { getAllFacilities } from "../services/facilityService.js";
import { CREDIT_CONFIG } from "../services/creditEngine.js";

const router = express.Router();

router.get("/health", async (req, res) => {
  const devices = await getAllDevices();
  const facilities = await getAllFacilities();
  const nvidiaKey = process.env.NVIDIA_NIM_KEY || process.env.NVIDIA_API_KEY;

  res.json({
    ok: true,
    server: "E-Cycle India Enterprise Platform",
    version: "2.0.0",
    status: "HEALTHY",
    uptimeSeconds: Math.floor(process.uptime()),
    pid: process.pid,
    workerId: process.env.WORKER_ID || "worker-primary",
    database: DB_STATE,
    facilitiesCount: facilities.length,
    deviceCatalogCount: devices.length,
    aiVisionConfigured: Boolean(nvidiaKey),
    creditEngineVersion: CREDIT_CONFIG.version,
    features: [
      "Clustered Express Process Load Balancer",
      "Regional Database Shard Routing (6 Regions)",
      "MongoDB Atlas with In-Memory Resilient Fallback",
      "Multi-Tier LRU Memory Cache",
      "NVIDIA Llama 3.2 Vision Multi-Modal Relay",
      "CPCB / SPCB 421 Authorized Facilities Locator",
      "Atomic Credit Wallet & Anti-Fraud Double-Spend Protection",
      "Asynchronous Immutable Audit Ledger"
    ]
  });
});

router.get("/credit-config", (req, res) => {
  res.json({
    ok: true,
    config: CREDIT_CONFIG
  });
});

export default router;

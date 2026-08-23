import cluster from "cluster";
import os from "os";
import dotenv from "dotenv";
import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { getAllDevices } from "./services/deviceService.js";
import { getAllFacilities } from "./services/facilityService.js";

dotenv.config();

const PORT = Number(process.env.PORT) || 5001;
const ENABLE_CLUSTER = process.env.ENABLE_CLUSTER === "true";
const NUM_WORKERS = Math.min(4, os.cpus().length || 1);

async function startWorkerServer() {
  // Connect to Database
  await connectDatabase();

  // Pre-warm device and facility caches
  const devices = await getAllDevices();
  const facilities = await getAllFacilities();

  const server = app.listen(PORT, () => {
    console.log("==========================================================");
    console.log("  🌿 E-CYCLE INDIA • ADVANCED SYSTEM DESIGN BACKEND");
    console.log("==========================================================");
    console.log(`  🚀 Server Running at:    http://localhost:${PORT}`);
    console.log(`  ⚡ Process Worker ID:    ${process.pid}`);
    console.log(`  📦 Authorized Units:     ${facilities.length} Facilities (36 States)`);
    console.log(`  🔬 Composition Catalog:  ${devices.length} Devices Pre-loaded`);
    console.log(`  🤖 AI Vision Engine:     ${process.env.NVIDIA_NIM_KEY || process.env.NVIDIA_API_KEY ? "CONFIGURED (Llama 3.2 Vision)" : "SIMULATED FORENSICS"}`);
    console.log(`  🗄️ Database Sharding:    6 Regional Virtual Shards Online`);
    console.log("==========================================================");
  });

  // Graceful Shutdown
  const gracefulShutdown = (signal) => {
    console.log(`\nReceived ${signal}. Shutting down worker ${process.pid} gracefully...`);
    server.close(() => {
      console.log(`Worker ${process.pid} closed connections.`);
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}

// Master Process in Cluster Mode
if (ENABLE_CLUSTER && cluster.isPrimary) {
  console.log(`[Cluster Master] PID: ${process.pid} is spawning ${NUM_WORKERS} worker instances...`);

  for (let i = 0; i < NUM_WORKERS; i++) {
    cluster.fork({ WORKER_ID: `worker-${i + 1}` });
  }

  cluster.on("exit", (worker, code, signal) => {
    console.warn(`[Cluster Supervisor] Worker ${worker.process.pid} died (code: ${code}, signal: ${signal}). Spawning replacement...`);
    cluster.fork();
  });
} else {
  startWorkerServer();
}

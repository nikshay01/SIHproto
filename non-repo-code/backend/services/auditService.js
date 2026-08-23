import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import AuditLog from "../models/AuditLog.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUDIT_FILE = path.join(__dirname, "../../data/audit_logs.json");

let inMemoryAuditLogs = [];
let isFlushing = false;
const queue = [];

function loadLocalAuditLogs() {
  try {
    if (fs.existsSync(AUDIT_FILE)) {
      const raw = fs.readFileSync(AUDIT_FILE, "utf-8");
      inMemoryAuditLogs = JSON.parse(raw).logs || [];
    }
  } catch (err) {
    console.error("Error loading local audit logs:", err.message);
  }
}

loadLocalAuditLogs();

function persistLocalAuditLogs() {
  try {
    fs.writeFileSync(AUDIT_FILE, JSON.stringify({ logs: inMemoryAuditLogs.slice(0, 500) }, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing audit logs:", err.message);
  }
}

// Background batch queue worker (runs every 3 seconds)
setInterval(async () => {
  if (queue.length === 0 || isFlushing) return;
  isFlushing = true;
  const batch = queue.splice(0, 50);

  try {
    await AuditLog.insertMany(batch, { ordered: false });
  } catch (e) {
    // Mongo offline or already logged
  } finally {
    isFlushing = false;
  }
}, 3000);

export function recordAudit({ transactionId, userId, actor, action, previousStatus, newStatus, details }) {
  const logEntry = {
    logId: `AUD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    timestamp: new Date().toISOString(),
    transactionId: transactionId || null,
    userId: userId || null,
    actor: actor || "SYSTEM",
    action,
    previousStatus: previousStatus || null,
    newStatus: newStatus || null,
    details: details || {}
  };

  inMemoryAuditLogs.unshift(logEntry);
  if (inMemoryAuditLogs.length > 500) inMemoryAuditLogs.length = 500;
  persistLocalAuditLogs();

  // Enqueue for async MongoDB write
  queue.push(logEntry);

  return logEntry;
}

export async function getAuditLogs(limit = 100) {
  try {
    const mongoLogs = await AuditLog.find().sort({ timestamp: -1 }).limit(limit).lean();
    if (mongoLogs && mongoLogs.length > 0) return mongoLogs;
  } catch (e) {
    // Fall back to memory
  }
  return inMemoryAuditLogs.slice(0, limit);
}

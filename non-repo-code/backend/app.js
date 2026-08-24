import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

// Middlewares
import { requestTracer } from "./middleware/requestTracer.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Routes
import healthRoutes from "./routes/healthRoutes.js";
import systemRoutes from "./routes/systemRoutes.js";
import deviceRoutes from "./routes/deviceRoutes.js";
import verifyRoutes from "./routes/verifyRoutes.js";
import facilityRoutes from "./routes/facilityRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import pickupRoutes from "./routes/pickupRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { classifyGeneralEwasteImage } from "./services/aiVisionService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security and Performance Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // allow leaflet tiles and camera stream
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(compression());
app.use(express.json({ limit: "16mb" })); // 16MB limit for camera snapshots
app.use(express.urlencoded({ extended: true, limit: "16mb" }));

// Request Tracing and Structured Logging
app.use(requestTracer);
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(":method :url :status :res[content-length] - :response-time ms [req-id: :res[x-request-id]]"));
}

// Global Rate Limiter (120 reqs/min)
app.use("/api", rateLimiter(120, 60000));

// ============================================================================
// API ROUTE MOUNTING
// ============================================================================
app.use("/api", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/verify", verifyRoutes);
app.use("/api/facility", facilityRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/pickup", pickupRoutes);
app.use("/api/audit", auditRoutes);

// General E-Waste AI Scanner Endpoint (Used by Evaluate Scanner)
app.post("/api/analyze", async (req, res, next) => {
  try {
    const { image } = req.body;
    if (!image || typeof image !== "string") {
      return res.status(400).json({ error: "Missing base64 image data URL in 'image' field." });
    }
    const result = await classifyGeneralEwasteImage(image);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Fallback for static assets in production
const distPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(distPath));

// Error Handler
app.use(errorHandler);

export default app;

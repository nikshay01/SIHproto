import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Modular Services
import { 
  getAllDevices, 
  getCategories, 
  getBrands, 
  getModels, 
  getDeviceById, 
  findDeviceByBrandAndModel, 
  searchDevices,
  getMetadata as getDeviceMetadata
} from "./services/deviceService.js";

import { 
  CREDIT_CONFIG, 
  calculateDeviceCredits, 
  calculateCreditsFromMaterials 
} from "./services/creditEngine.js";

import { 
  verifyDeviceImage 
} from "./services/aiVerificationService.js";

import {
  createVerificationTransaction,
  getTransactionById,
  getUserTransactions,
  getAllTransactions,
  facilityVerifyTransaction,
  facilityRejectTransaction,
  getOrCreateWallet,
  redeemUserCredits,
  getAuditLogs
} from "./services/verificationStore.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || process.env.NVIDIA_NIM_KEY;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json({ limit: "16mb" }));

// Serve static files from root directory
app.use(express.static(__dirname));

// ============================================================================
// SYSTEM & HEALTH CHECK ENDPOINTS
// ============================================================================

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    server: "e-cycle-india-unified-portal",
    version: "2.0.0",
    features: [
      "AI E-Waste Vision Classification",
      "AI Device Claim Verification",
      "Anti-Fraud Detection Matrix",
      "Centralized Material-Based Credit Calculation",
      "CPCB/SPCB Facility Locator & Map",
      "Facility Physical Verification Portal",
      "User Reward Credits Wallet"
    ],
    nvidiaKeyConfigured: Boolean(NVIDIA_API_KEY),
    facilitiesEndpoint: "/data/e-waste-facilities/all_facilities.json",
    deviceCatalogCount: getAllDevices().length
  });
});

app.get("/api/credit-config", (req, res) => {
  res.json({
    ok: true,
    config: CREDIT_CONFIG
  });
});

// ============================================================================
// DEVICE COMPOSITION & CATALOG ENDPOINTS
// ============================================================================

app.get("/api/devices/categories", (req, res) => {
  try {
    const categories = getCategories();
    res.json({ ok: true, categories });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/devices/brands", (req, res) => {
  try {
    const category = req.query.category || null;
    const brands = getBrands(category);
    res.json({ ok: true, category, brands });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/devices/list", (req, res) => {
  try {
    const { category, brand, search } = req.query;
    let list;
    if (search) {
      list = searchDevices(search);
    } else {
      list = getModels(category, brand);
    }
    res.json({ ok: true, count: list.length, devices: list });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/devices/:id", (req, res) => {
  try {
    const device = getDeviceById(req.params.id);
    if (!device) {
      return res.status(404).json({ ok: false, error: `Device with ID '${req.params.id}' not found.` });
    }
    res.json({ ok: true, device });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================================================================
// AI DEVICE VERIFICATION & RECYCLING CLAIM ENDPOINTS
// ============================================================================

/**
 * Claim and Verify Device via AI Vision
 */
app.post("/api/verify/claim-and-verify", async (req, res) => {
  try {
    const {
      userId = "guest-user",
      claimedCategory = "Smartphone",
      claimedBrand = "Apple",
      claimedModel = "iPhone 13",
      deviceId = null,
      image
    } = req.body;

    if (!image || typeof image !== "string") {
      return res.status(400).json({
        ok: false,
        error: "Missing image payload. Send a base64 image data URL in the 'image' field."
      });
    }

    if (!claimedBrand || !claimedModel) {
      return res.status(400).json({
        ok: false,
        error: "Missing claimed device information. 'claimedBrand' and 'claimedModel' are required."
      });
    }

    // Step 1: Run AI Verification against visual evidence
    const aiResult = await verifyDeviceImage({
      claimedCategory,
      claimedBrand,
      claimedModel,
      image
    });

    // Step 2: Fetch composition reference data for credit calculation
    let targetDevice = deviceId ? getDeviceById(deviceId) : null;
    if (!targetDevice) {
      targetDevice = findDeviceByBrandAndModel(claimedBrand, claimedModel);
    }

    // If exact device model isn't in DB, create standard category fallback composition
    if (!targetDevice) {
      targetDevice = {
        category: claimedCategory,
        brand: claimedBrand,
        model: claimedModel,
        weightGrams: 200,
        materials: {
          copper: { amountGrams: 15.0, recoveryRate: 0.90 },
          aluminium: { amountGrams: 20.0, recoveryRate: 0.90 },
          plastics: { amountGrams: 40.0, recoveryRate: 0.70 },
          other: { amountGrams: 100.0, recoveryRate: 0.50 }
        }
      };
    }

    // Step 3: Calculate Estimated Credits strictly on backend
    const creditCalculation = calculateDeviceCredits(targetDevice);

    // Step 4: Create Verification Transaction Record & Audit Trail
    const transaction = createVerificationTransaction({
      userId,
      claimedDevice: {
        category: claimedCategory,
        brand: claimedBrand,
        model: claimedModel
      },
      detectedDevice: aiResult.detectedDevice,
      aiVerification: aiResult,
      estimatedCredits: creditCalculation.estimatedCredits,
      materialsBreakdown: creditCalculation.materials,
      deviceId: targetDevice.id || null
    });

    const userWallet = getOrCreateWallet(userId);

    res.json({
      ok: true,
      transaction,
      aiVerification: aiResult,
      creditCalculation,
      wallet: userWallet
    });
  } catch (err) {
    console.error("Claim and verify error:", err);
    res.status(500).json({
      ok: false,
      error: "Server error during device claim verification.",
      details: err.message
    });
  }
});

/**
 * Fetch a single transaction by ID (for QR scan and status check)
 */
app.get("/api/verify/transaction/:transactionId", (req, res) => {
  try {
    const tx = getTransactionById(req.params.transactionId);
    if (!tx) {
      return res.status(404).json({
        ok: false,
        error: `Transaction '${req.params.transactionId}' not found.`
      });
    }
    res.json({ ok: true, transaction: tx });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * Fetch all transactions for a user
 */
app.get("/api/verify/user/:userId", (req, res) => {
  try {
    const list = getUserTransactions(req.params.userId);
    res.json({ ok: true, count: list.length, transactions: list });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================================================================
// FACILITY PHYSICAL VERIFICATION & ANTI-FRAUD ENDPOINTS
// ============================================================================

/**
 * Facility Physical Verification Confirmation (Awards Official Credits)
 */
app.post("/api/verify/facility-confirm", (req, res) => {
  try {
    const {
      transactionId,
      facilityId = "FAC-AUTH-01",
      facilityName = "Authorized E-Waste Facility",
      inspectorName = "Staff Officer",
      inspectorNotes = "Physical device matches claim and accepted for scientific recycling."
    } = req.body;

    if (!transactionId) {
      return res.status(400).json({ ok: false, error: "Missing required 'transactionId'." });
    }

    const result = facilityVerifyTransaction({
      transactionId,
      facilityId,
      facilityName,
      inspectorName,
      inspectorNotes
    });

    res.json({
      ok: true,
      message: `Transaction ${transactionId} successfully verified. ${result.transaction.verifiedCredits} E-Waste Credits officially issued.`,
      transaction: result.transaction,
      wallet: result.wallet
    });
  } catch (err) {
    console.error("Facility confirmation error:", err.message);
    res.status(400).json({
      ok: false,
      error: err.message
    });
  }
});

/**
 * Facility Physical Rejection (No Credits Issued)
 */
app.post("/api/verify/facility-reject", (req, res) => {
  try {
    const {
      transactionId,
      facilityId = "FAC-AUTH-01",
      facilityName = "Authorized E-Waste Facility",
      inspectorName = "Staff Officer",
      rejectionReason = "Physical inspection revealed ineligible or non-matching electronic waste."
    } = req.body;

    if (!transactionId) {
      return res.status(400).json({ ok: false, error: "Missing required 'transactionId'." });
    }

    const result = facilityRejectTransaction({
      transactionId,
      facilityId,
      facilityName,
      inspectorName,
      rejectionReason
    });

    res.json({
      ok: true,
      message: `Transaction ${transactionId} has been marked as REJECTED. No reward credits issued.`,
      transaction: result.transaction,
      wallet: result.wallet
    });
  } catch (err) {
    console.error("Facility rejection error:", err.message);
    res.status(400).json({
      ok: false,
      error: err.message
    });
  }
});

// ============================================================================
// USER WALLET & REWARDS REDEMPTION ENDPOINTS
// ============================================================================

/**
 * Get User Wallet and Transaction History
 */
app.get("/api/wallet/:userId", (req, res) => {
  try {
    const userId = req.params.userId || "guest-user";
    const wallet = getOrCreateWallet(userId);
    const userTransactions = getUserTransactions(userId);

    res.json({
      ok: true,
      wallet,
      transactions: userTransactions
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * Redeem Available Reward Credits
 */
app.post("/api/wallet/redeem", (req, res) => {
  try {
    const {
      userId = "guest-user",
      amount,
      rewardId = "eco-voucher",
      rewardTitle = "Eco Partner Voucher"
    } = req.body;

    if (!amount) {
      return res.status(400).json({ ok: false, error: "Missing required 'amount' to redeem." });
    }

    const result = redeemUserCredits({
      userId,
      amount,
      rewardId,
      rewardTitle
    });

    res.json({
      ok: true,
      message: `Successfully redeemed ${amount} credits for ${rewardTitle}.`,
      wallet: result.wallet,
      redemption: result.redemption
    });
  } catch (err) {
    console.error("Wallet redemption error:", err.message);
    res.status(400).json({
      ok: false,
      error: err.message
    });
  }
});

/**
 * Audit Trail Endpoint
 */
app.get("/api/audit/logs", (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    const logs = getAuditLogs(limit);
    res.json({ ok: true, count: logs.length, logs });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================================================================
// EXISTING AI VISION ENDPOINT (PRESERVED)
// ============================================================================

app.post("/api/analyze", async (req, res) => {
  try {
    if (!NVIDIA_API_KEY) {
      return res.status(500).json({
        error: "NVIDIA API key is not configured. Please set NVIDIA_API_KEY or NVIDIA_NIM_KEY in .env"
      });
    }

    const { image } = req.body;

    if (!image || typeof image !== "string") {
      return res.status(400).json({
        error: "Missing image payload. Send a base64 data URL in the 'image' field."
      });
    }

    if (!image.startsWith("data:image/")) {
      return res.status(400).json({
        error: "Invalid image format. Expected an image data URL (data:image/...)."
      });
    }

    const prompt = `Analyze the image as an e-waste identification and classification system.

Identify the electronic/electrical item shown in the image and determine its classification.

IMPORTANT OUTPUT RULES:
1. Return ONLY ONE valid JSON object.
2. Do NOT return markdown.
3. Do NOT use code fences.
4. Do NOT provide explanations before or after the JSON.
5. Do NOT include additional fields outside the schema.
6. All fields in the schema are mandatory.
7. "is_ewaste" MUST be a boolean.
8. "confidence" MUST be a number between 0 and 1.
9. If the item is an electrical/electronic device, component, accessory, charger, adapter, cable, battery, PCB, or similar electronic equipment, classify it as e-waste.
10. Base the classification primarily on what is visually identifiable.
11. If the exact item cannot be identified, use the closest reasonable classification and lower confidence.
12. Never return null, undefined, or omit a field.

Return EXACTLY:
{
  "is_ewaste": true,
  "item": "string",
  "category": "string",
  "subcategory": "string",
  "confidence": 0.0,
  "condition": "New | Used | Damaged | Broken | Partially Damaged | Unknown",
  "description": "string"
}

FIELD DEFINITIONS:
- is_ewaste: whether the visible object qualifies as e-waste.
- item: specific item name, e.g. USB Power Adapter, Laptop, Smartphone, LCD Monitor, Keyboard, PCB, Hard Drive, Lithium-ion Battery.
- category: broad category, e.g. IT & Telecommunication, Consumer Electronics, Large Appliances, Small Appliances, Electronic Components, Batteries, Cables & Accessories.
- subcategory: specific classification within category.
- confidence: decimal from 0 to 1.
- condition: visible physical condition.
- description: concise visual description including relevant distinguishing characteristics, wear, or physical damage.

Remember: your entire response must be ONLY the JSON object.`;

    const nvidiaResponse = await fetch(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NVIDIA_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "meta/llama-3.2-11b-vision-instruct",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: prompt
                },
                {
                  type: "image_url",
                  image_url: {
                    url: image
                  }
                }
              ]
            }
          ],
          max_tokens: 500,
          temperature: 0.2
        })
      }
    );

    const raw = await nvidiaResponse.text();

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return res.status(502).json({
        error: "NVIDIA API returned a non-JSON response.",
        details: raw.slice(0, 1000)
      });
    }

    if (!nvidiaResponse.ok) {
      return res.status(nvidiaResponse.status).json({
        error: "NVIDIA API request failed.",
        details: data
      });
    }

    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(502).json({
        error: "NVIDIA response did not contain model output.",
        details: data
      });
    }

    function extractJsonObject(text) {
      if (!text || typeof text !== "string") return null;

      let cleaned = text.trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");

      if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        return null;
      }

      const jsonText = cleaned.slice(firstBrace, lastBrace + 1);

      try {
        return JSON.parse(jsonText);
      } catch (error) {
        console.error("JSON parse failed on extracted slice:", jsonText);
        return null;
      }
    }

    const result = extractJsonObject(content);

    if (!result) {
      return res.status(502).json({
        error: "Vision model returned invalid JSON format.",
        rawModelResponse: content
      });
    }

    const normalized = {
      is_ewaste: Boolean(result.is_ewaste),
      item: String(result.item ?? "Unknown"),
      category: String(result.category ?? "General Electronics"),
      subcategory: String(result.subcategory ?? "Unspecified"),
      confidence: Math.max(0, Math.min(1, Number(result.confidence) || 0)),
      condition: String(result.condition ?? "Unknown"),
      description: String(result.description ?? "")
    };

    res.json(normalized);
  } catch (error) {
    console.error("Unified Analysis error:", error);
    res.status(500).json({
      error: "Server error while analyzing image.",
      details: error.message
    });
  }
});

// ============================================================================
// SERVER LISTENER
// ============================================================================

app.listen(PORT, () => {
  console.log("==================================================");
  console.log("E-CYCLE INDIA - UNIFIED AI & FACILITY PORTAL");
  console.log("==================================================");
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`NVIDIA Vision Key: ${NVIDIA_API_KEY ? "CONFIGURED" : "MISSING"}`);
  console.log(`Device Composition Database: ${getAllDevices().length} devices loaded`);
  console.log("==================================================");
});

import express from "express";
import { verifyDeviceImage, classifyGeneralEwasteImage, generateEwasteEducationalContent } from "../services/aiVisionService.js";
import { getDeviceById, findDeviceByBrandAndModel } from "../services/deviceService.js";
import { calculateDeviceCredits } from "../services/creditEngine.js";
import {
  createVerificationTransaction,
  getTransactionById,
  getUserTransactions,
  facilityVerifyTransaction,
  facilityRejectTransaction,
  getOrCreateWallet
} from "../services/walletService.js";

const router = express.Router();

/**
 * Claim and Verify Device via AI Vision
 */
router.post("/claim-and-verify", async (req, res, next) => {
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
    let targetDevice = deviceId ? await getDeviceById(deviceId) : null;
    if (!targetDevice) {
      targetDevice = await findDeviceByBrandAndModel(claimedBrand, claimedModel);
    }

    // Fallback composition if not in catalog
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

    // Step 3: Calculate Estimated Credits on backend
    const creditCalculation = calculateDeviceCredits(targetDevice);

    // Step 4: Create Verification Transaction Record & Audit Trail
    const transaction = await createVerificationTransaction({
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
      deviceId: targetDevice.id || targetDevice.deviceId || null
    });

    // Generate educational content for the detected device
    const educationalContent = await generateEwasteEducationalContent(
      aiResult.detectedDevice.model || `${aiResult.detectedDevice.brand} ${aiResult.detectedDevice.model}`,
      aiResult.detectedDevice.category
    );

    // Attach educational content to aiResult for frontend consumption
    aiResult.educationalContent = educationalContent;

    const userWallet = await getOrCreateWallet(userId);

    res.json({
      ok: true,
      transaction,
      aiVerification: aiResult,
      creditCalculation,
      wallet: userWallet
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Fetch a single transaction by ID
 */
router.get("/transaction/:transactionId", async (req, res, next) => {
  try {
    const tx = await getTransactionById(req.params.transactionId);
    if (!tx) {
      return res.status(404).json({
        ok: false,
        error: `Transaction '${req.params.transactionId}' not found.`
      });
    }
    res.json({ ok: true, transaction: tx });
  } catch (err) {
    next(err);
  }
});

/**
 * Fetch all transactions for a user
 */
router.get("/user/:userId", async (req, res, next) => {
  try {
    const list = await getUserTransactions(req.params.userId);
    res.json({ ok: true, count: list.length, transactions: list });
  } catch (err) {
    next(err);
  }
});

/**
 * Facility Physical Verification Confirmation (Awards Official Credits)
 */
router.post("/facility-confirm", async (req, res, next) => {
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

    const result = await facilityVerifyTransaction({
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
    res.status(400).json({
      ok: false,
      error: err.message
    });
  }
});

/**
 * Facility Physical Rejection
 */
router.post("/facility-reject", async (req, res, next) => {
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

    const result = await facilityRejectTransaction({
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
    res.status(400).json({
      ok: false,
      error: err.message
    });
  }
});

export default router;

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { recordAudit } from "./auditService.js";
import Wallet from "../models/Wallet.js";
import VerificationTransaction from "../models/VerificationTransaction.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TX_FILE = path.join(__dirname, "../../data/verification_transactions.json");
const WALLET_FILE = path.join(__dirname, "../../data/user_wallets.json");

let inMemoryTransactions = [];
let inMemoryWallets = {};

function loadLocalStores() {
  try {
    if (fs.existsSync(TX_FILE)) {
      inMemoryTransactions = JSON.parse(fs.readFileSync(TX_FILE, "utf-8")).transactions || [];
    }
    if (fs.existsSync(WALLET_FILE)) {
      inMemoryWallets = JSON.parse(fs.readFileSync(WALLET_FILE, "utf-8")).wallets || {};
    }
  } catch (err) {
    console.error("Error loading wallet/transaction store:", err.message);
  }
}

loadLocalStores();

function persistLocalTransactions() {
  try {
    fs.writeFileSync(TX_FILE, JSON.stringify({ transactions: inMemoryTransactions }, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to persist transactions:", e.message);
  }
}

function persistLocalWallets() {
  try {
    fs.writeFileSync(WALLET_FILE, JSON.stringify({ wallets: inMemoryWallets }, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to persist wallets:", e.message);
  }
}

function generateTransactionId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const year = new Date().getFullYear();
  const txId = `EW-${year}-${code}`;

  if (inMemoryTransactions.some(t => t.transactionId === txId)) {
    return generateTransactionId();
  }
  return txId;
}

export async function createVerificationTransaction({
  userId = "guest-user",
  claimedDevice,
  detectedDevice,
  aiVerification,
  estimatedCredits = 0,
  materialsBreakdown = [],
  deviceId = null
}) {
  const transactionId = generateTransactionId();
  const timestamp = new Date().toISOString();

  let initialStatus = "PENDING_RECYCLING";
  if (aiVerification.verificationStatus === "AI_VERIFICATION_FAILED") {
    initialStatus = "AI_VERIFICATION_FAILED";
  } else if (aiVerification.verificationStatus === "MANUAL_VERIFICATION_REQUIRED") {
    initialStatus = "MANUAL_VERIFICATION_REQUIRED";
  }

  const tx = {
    transactionId,
    userId,
    deviceId,
    claimedDevice: {
      category: claimedDevice.category || "Smartphone",
      brand: claimedDevice.brand || "Apple",
      model: claimedDevice.model || "iPhone 13"
    },
    detectedDevice: {
      category: detectedDevice?.category || claimedDevice.category,
      brand: detectedDevice?.brand || claimedDevice.brand,
      model: detectedDevice?.model || claimedDevice.model
    },
    aiConfidence: aiVerification.confidence ?? 0.94,
    aiMatch: aiVerification.match ?? true,
    aiReasoning: aiVerification.reasoning || "",
    visualCharacteristics: aiVerification.visualCharacteristics || "",
    estimatedCredits: initialStatus === "AI_VERIFICATION_FAILED" ? 0 : Number(estimatedCredits) || 0,
    verifiedCredits: 0,
    materialsBreakdown: materialsBreakdown || [],
    verificationStatus: initialStatus,
    statusMessage: aiVerification.statusMessage || "Verification registered.",
    facilityVerification: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    verifiedAt: null
  };

  inMemoryTransactions.unshift(tx);
  persistLocalTransactions();

  // Async sync to MongoDB
  try {
    await VerificationTransaction.create(tx);
  } catch (e) {
    // Mongo offline
  }

  // Update user's estimated balance in wallet
  if (tx.estimatedCredits > 0) {
    const userWallet = await getOrCreateWallet(userId);
    userWallet.estimatedCredits += tx.estimatedCredits;
    userWallet.lastUpdated = timestamp;
    persistLocalWallets();

    try {
      await Wallet.updateOne(
        { userId },
        { $inc: { estimatedCredits: tx.estimatedCredits } }
      );
    } catch (e) {
      // Mongo offline
    }
  }

  recordAudit({
    transactionId,
    userId,
    actor: "USER",
    action: "CLAIM_AND_AI_VERIFY",
    previousStatus: "PENDING_AI_VERIFICATION",
    newStatus: initialStatus,
    details: {
      claimed: `${tx.claimedDevice.brand} ${tx.claimedDevice.model}`,
      detected: `${tx.detectedDevice.brand} ${tx.detectedDevice.model}`,
      confidence: tx.aiConfidence,
      estimatedCredits: tx.estimatedCredits
    }
  });

  return tx;
}

export async function getTransactionById(transactionId) {
  if (!transactionId) return null;
  const cleanId = transactionId.trim().toUpperCase();

  try {
    const mongoTx = await VerificationTransaction.findOne({ transactionId: cleanId }).lean();
    if (mongoTx) return mongoTx;
  } catch (e) {
    // Fall back to memory
  }

  return inMemoryTransactions.find(t => t.transactionId.toUpperCase() === cleanId) || null;
}

export async function getUserTransactions(userId) {
  if (!userId) return [];

  try {
    const mongoTxs = await VerificationTransaction.find({ userId }).sort({ createdAt: -1 }).lean();
    if (mongoTxs && mongoTxs.length > 0) return mongoTxs;
  } catch (e) {
    // Fall back to memory
  }

  return inMemoryTransactions.filter(t => t.userId === userId);
}

export async function facilityVerifyTransaction({
  transactionId,
  facilityId = "FAC-AUTH-01",
  facilityName = "Authorized E-Waste Facility",
  inspectorName = "Staff Officer",
  inspectorNotes = "Physical device matches claim and accepted for scientific recycling."
}) {
  const tx = await getTransactionById(transactionId);
  if (!tx) {
    throw new Error(`Transaction ${transactionId} not found.`);
  }

  if (tx.verificationStatus === "FACILITY_VERIFIED" || tx.verificationStatus === "CREDITS_ISSUED") {
    throw new Error(`Transaction ${transactionId} has already been verified. Cannot verify twice.`);
  }

  if (tx.verificationStatus === "REJECTED") {
    throw new Error(`Transaction ${transactionId} was previously REJECTED. Cannot award credits.`);
  }

  if (tx.verificationStatus === "AI_VERIFICATION_FAILED") {
    throw new Error(`Transaction ${transactionId} failed AI verification and cannot be approved without a new claim.`);
  }

  const previousStatus = tx.verificationStatus;
  const timestamp = new Date().toISOString();

  // Status transitions
  tx.verificationStatus = "CREDITS_ISSUED";
  tx.statusMessage = `Physically inspected and verified by ${facilityName}. Credits officially awarded.`;
  tx.verifiedCredits = tx.estimatedCredits;
  tx.verifiedAt = timestamp;
  tx.updatedAt = timestamp;

  tx.facilityVerification = {
    facilityId,
    facilityName,
    inspectorName,
    inspectorNotes,
    verifiedAt: timestamp
  };

  persistLocalTransactions();

  // Update in MongoDB
  try {
    await VerificationTransaction.updateOne(
      { transactionId: tx.transactionId },
      {
        $set: {
          verificationStatus: "CREDITS_ISSUED",
          statusMessage: tx.statusMessage,
          verifiedCredits: tx.verifiedCredits,
          verifiedAt: timestamp,
          facilityVerification: tx.facilityVerification
        }
      }
    );
  } catch (e) {
    // Mongo offline
  }

  // Update User's Wallet
  const userWallet = await getOrCreateWallet(tx.userId);
  const creditsToAward = tx.estimatedCredits;

  userWallet.estimatedCredits = Math.max(0, userWallet.estimatedCredits - creditsToAward);
  userWallet.verifiedCredits += creditsToAward;
  userWallet.availableCredits += creditsToAward;
  userWallet.lastUpdated = timestamp;

  persistLocalWallets();

  try {
    await Wallet.updateOne(
      { userId: tx.userId },
      {
        $inc: {
          estimatedCredits: -creditsToAward,
          verifiedCredits: creditsToAward,
          availableCredits: creditsToAward
        }
      }
    );
  } catch (e) {
    // Mongo offline
  }

  recordAudit({
    transactionId: tx.transactionId,
    userId: tx.userId,
    actor: `FACILITY:${facilityId}`,
    action: "FACILITY_PHYSICAL_VERIFY_AND_AWARD_CREDITS",
    previousStatus,
    newStatus: "CREDITS_ISSUED",
    details: {
      facilityId,
      facilityName,
      creditsAwarded: creditsToAward,
      newWalletAvailable: userWallet.availableCredits
    }
  });

  return {
    transaction: tx,
    wallet: userWallet
  };
}

export async function facilityRejectTransaction({
  transactionId,
  facilityId = "FAC-AUTH-01",
  facilityName = "Authorized E-Waste Facility",
  inspectorName = "Staff Officer",
  rejectionReason = "Physical device mismatch or ineligible condition."
}) {
  const tx = await getTransactionById(transactionId);
  if (!tx) {
    throw new Error(`Transaction ${transactionId} not found.`);
  }

  if (tx.verificationStatus === "FACILITY_VERIFIED" || tx.verificationStatus === "CREDITS_ISSUED") {
    throw new Error(`Cannot reject transaction ${transactionId} because it was already verified and credits were issued.`);
  }

  const previousStatus = tx.verificationStatus;
  const timestamp = new Date().toISOString();

  tx.verificationStatus = "REJECTED";
  tx.statusMessage = `Rejected at facility: ${rejectionReason}`;
  tx.verifiedCredits = 0;
  tx.updatedAt = timestamp;

  tx.facilityVerification = {
    facilityId,
    facilityName,
    inspectorName,
    rejectionReason,
    rejectedAt: timestamp
  };

  persistLocalTransactions();

  try {
    await VerificationTransaction.updateOne(
      { transactionId: tx.transactionId },
      {
        $set: {
          verificationStatus: "REJECTED",
          statusMessage: tx.statusMessage,
          verifiedCredits: 0,
          facilityVerification: tx.facilityVerification
        }
      }
    );
  } catch (e) {
    // Mongo offline
  }

  const userWallet = await getOrCreateWallet(tx.userId);
  userWallet.estimatedCredits = Math.max(0, userWallet.estimatedCredits - tx.estimatedCredits);
  userWallet.lastUpdated = timestamp;
  persistLocalWallets();

  try {
    await Wallet.updateOne(
      { userId: tx.userId },
      { $inc: { estimatedCredits: -tx.estimatedCredits } }
    );
  } catch (e) {
    // Mongo offline
  }

  recordAudit({
    transactionId: tx.transactionId,
    userId: tx.userId,
    actor: `FACILITY:${facilityId}`,
    action: "FACILITY_REJECT_TRANSACTION",
    previousStatus,
    newStatus: "REJECTED",
    details: {
      facilityId,
      facilityName,
      reason: rejectionReason
    }
  });

  return {
    transaction: tx,
    wallet: userWallet
  };
}

export async function getOrCreateWallet(userId = "guest-user") {
  try {
    let mongoWallet = await Wallet.findOne({ userId }).lean();
    if (mongoWallet) {
      inMemoryWallets[userId] = mongoWallet;
      return mongoWallet;
    }
  } catch (e) {
    // Mongo offline
  }

  if (!inMemoryWallets[userId]) {
    inMemoryWallets[userId] = {
      userId,
      estimatedCredits: 0,
      verifiedCredits: 0,
      redeemedCredits: 0,
      availableCredits: 0,
      redemptions: [],
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    persistLocalWallets();

    try {
      await Wallet.create(inMemoryWallets[userId]);
    } catch (e) {
      // Mongo offline
    }
  }
  return inMemoryWallets[userId];
}

export async function redeemUserCredits({ userId, amount, rewardId = "eco-voucher", rewardTitle = "Eco Partner Voucher" }) {
  const numAmount = parseInt(amount, 10);
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new Error("Invalid redemption amount specified.");
  }

  const wallet = await getOrCreateWallet(userId);

  if (wallet.availableCredits < numAmount) {
    throw new Error(`Insufficient available credits. You have ${wallet.availableCredits} credits available, but attempted to redeem ${numAmount}.`);
  }

  const timestamp = new Date().toISOString();
  const redemptionId = `RDM-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

  wallet.availableCredits -= numAmount;
  wallet.redeemedCredits += numAmount;
  wallet.lastUpdated = timestamp;

  const redemptionRecord = {
    redemptionId,
    rewardId,
    rewardTitle,
    creditsSpent: numAmount,
    couponCode: `ECO-${Math.floor(100000 + Math.random() * 900000)}`,
    status: "ACTIVE",
    redeemedAt: timestamp
  };

  wallet.redemptions = wallet.redemptions || [];
  wallet.redemptions.unshift(redemptionRecord);

  persistLocalWallets();

  try {
    await Wallet.updateOne(
      { userId },
      {
        $inc: { availableCredits: -numAmount, redeemedCredits: numAmount },
        $push: { redemptions: { $each: [redemptionRecord], $position: 0 } }
      }
    );
  } catch (e) {
    // Mongo offline
  }

  recordAudit({
    transactionId: null,
    userId,
    actor: "USER",
    action: "REDEEM_CREDITS",
    previousStatus: null,
    newStatus: null,
    details: redemptionRecord
  });

  return {
    wallet,
    redemption: redemptionRecord
  };
}

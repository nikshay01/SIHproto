import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TX_FILE = path.join(__dirname, "../data/verification_transactions.json");
const WALLET_FILE = path.join(__dirname, "../data/user_wallets.json");
const AUDIT_FILE = path.join(__dirname, "../data/audit_logs.json");

// In-Memory Caches
let transactions = [];
let wallets = {};
let auditLogs = [];

function loadData() {
  try {
    if (fs.existsSync(TX_FILE)) {
      transactions = JSON.parse(fs.readFileSync(TX_FILE, "utf-8")).transactions || [];
    }
    if (fs.existsSync(WALLET_FILE)) {
      wallets = JSON.parse(fs.readFileSync(WALLET_FILE, "utf-8")).wallets || {};
    }
    if (fs.existsSync(AUDIT_FILE)) {
      auditLogs = JSON.parse(fs.readFileSync(AUDIT_FILE, "utf-8")).logs || [];
    }
  } catch (err) {
    console.error("Error loading verification persistence store:", err);
  }
}

function persistTransactions() {
  try {
    fs.writeFileSync(TX_FILE, JSON.stringify({ transactions }, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving transactions:", err);
  }
}

function persistWallets() {
  try {
    fs.writeFileSync(WALLET_FILE, JSON.stringify({ wallets }, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving wallets:", err);
  }
}

function persistAuditLogs() {
  try {
    fs.writeFileSync(AUDIT_FILE, JSON.stringify({ logs: auditLogs }, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving audit logs:", err);
  }
}

// Initial load
loadData();

/**
 * Generate unique recycling transaction ID, e.g. EW-2026-A82F91
 */
function generateTransactionId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const year = new Date().getFullYear();
  const txId = `EW-${year}-${code}`;

  // Ensure collision-free
  if (transactions.some(t => t.transactionId === txId)) {
    return generateTransactionId();
  }
  return txId;
}

function recordAudit({ transactionId, userId, actor, action, previousStatus, newStatus, details }) {
  const logEntry = {
    logId: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    transactionId: transactionId || null,
    userId: userId || null,
    actor: actor || "SYSTEM",
    action,
    previousStatus: previousStatus || null,
    newStatus: newStatus || null,
    details: details || {}
  };

  auditLogs.unshift(logEntry);
  if (auditLogs.length > 500) auditLogs.length = 500;
  persistAuditLogs();
  return logEntry;
}

/**
 * Create a new recycling claim and transaction
 */
export function createVerificationTransaction({
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

  transactions.unshift(tx);
  persistTransactions();

  // If valid claim, update user's estimated balance
  if (tx.estimatedCredits > 0) {
    const userWallet = getOrCreateWallet(userId);
    userWallet.estimatedCredits += tx.estimatedCredits;
    userWallet.lastUpdated = timestamp;
    persistWallets();
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

export function getTransactionById(transactionId) {
  if (!transactionId) return null;
  const cleanId = transactionId.trim().toUpperCase();
  return transactions.find(t => t.transactionId.toUpperCase() === cleanId) || null;
}

export function getUserTransactions(userId) {
  if (!userId) return [];
  return transactions.filter(t => t.userId === userId);
}

export function getAllTransactions(limit = 100) {
  return transactions.slice(0, limit);
}

/**
 * Facility Physical Verification and Credit Issuance
 */
export function facilityVerifyTransaction({
  transactionId,
  facilityId = "FAC-AUTH-01",
  facilityName = "Authorized E-Waste Facility",
  inspectorName = "Staff Officer",
  inspectorNotes = "Physical device inspected and accepted for scientific recycling."
}) {
  const tx = getTransactionById(transactionId);
  if (!tx) {
    throw new Error(`Transaction ${transactionId} not found.`);
  }

  // Anti-fraud checks
  if (tx.verificationStatus === "FACILITY_VERIFIED" || tx.verificationStatus === "CREDITS_ISSUED") {
    throw new Error(`Transaction ${transactionId} has already been verified on ${tx.verifiedAt}. Cannot verify twice.`);
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

  persistTransactions();

  // Update User's Wallet Server-side
  const userWallet = getOrCreateWallet(tx.userId);
  const creditsToAward = tx.estimatedCredits;

  // Move from estimated to verified and available
  userWallet.estimatedCredits = Math.max(0, userWallet.estimatedCredits - creditsToAward);
  userWallet.verifiedCredits += creditsToAward;
  userWallet.availableCredits += creditsToAward;
  userWallet.lastUpdated = timestamp;

  persistWallets();

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

/**
 * Facility Physical Rejection
 */
export function facilityRejectTransaction({
  transactionId,
  facilityId = "FAC-AUTH-01",
  facilityName = "Authorized E-Waste Facility",
  inspectorName = "Staff Officer",
  rejectionReason = "Physical device mismatch or ineligible condition."
}) {
  const tx = getTransactionById(transactionId);
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

  persistTransactions();

  // Deduct from estimated credits in wallet
  const userWallet = getOrCreateWallet(tx.userId);
  userWallet.estimatedCredits = Math.max(0, userWallet.estimatedCredits - tx.estimatedCredits);
  userWallet.lastUpdated = timestamp;
  persistWallets();

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

/**
 * User Wallet Management
 */
export function getOrCreateWallet(userId = "guest-user") {
  if (!wallets[userId]) {
    wallets[userId] = {
      userId,
      estimatedCredits: 0,
      verifiedCredits: 0,
      redeemedCredits: 0,
      availableCredits: 0,
      redemptions: [],
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    persistWallets();
  }
  return wallets[userId];
}

export function redeemUserCredits({ userId, amount, rewardId = "eco-voucher", rewardTitle = "Eco Partner Voucher" }) {
  const numAmount = parseInt(amount, 10);
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new Error("Invalid redemption amount specified.");
  }

  const wallet = getOrCreateWallet(userId);

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
    timestamp
  };

  wallet.redemptions = wallet.redemptions || [];
  wallet.redemptions.unshift(redemptionRecord);

  persistWallets();

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

export function getAuditLogs(limit = 100) {
  return auditLogs.slice(0, limit);
}

/**
 * Centralized Credit & Environmental Intelligence Engine
 * 
 * Formula:
 * BaseCredits = round( Σ ( materialAmountGrams × recoveryRate × materialCreditMultiplier ) )
 * 
 * Legal Disclaimer: These reward credits are platform-based incentives and are not
 * government-issued EPR certificates or statutory Green Credits.
 */

export const CREDIT_CONFIG = {
  version: "2.0.0",
  currencyName: "E-Waste Credits",
  disclaimer: "These reward credits are platform-based incentives and are not government-issued EPR certificates or statutory Green Credits under E-Waste Rules 2022.",
  multipliers: {
    gold: 1000,
    silver: 10,
    copper: 2,
    aluminium: 0.5,
    cobalt: 4,
    lithium: 3,
    plastics: 0.05,
    glass: 0.02,
    other: 0.1
  },
  minCredits: 5,
  environmentalFactors: {
    co2KgPerKgRecycled: 1.85,    // Average CO2e avoided per kg electronic waste recycled
    toxicKgPerKgRecycled: 0.08    // Heavy metal toxins prevented from landfill
  }
};

/**
 * Calculates e-waste credits and material breakdown from materials map
 * @param {Object} materials - e.g. { gold: { amountGrams: 0.034, recoveryRate: 0.90 }, ... }
 * @returns {Object} { estimatedCredits, totalRecoverableWeightGrams, materials, environmentalImpact, calculatedAt }
 */
export function calculateCreditsFromMaterials(materials = {}) {
  const breakdown = [];
  let totalScore = 0;
  let totalRecoverableWeight = 0;

  for (const [materialName, info] of Object.entries(materials)) {
    if (!info) continue;
    const amountGrams = Number(info.amountGrams) || 0;
    const recoveryRate = Number(info.recoveryRate) || 0.85;
    const multiplier = CREDIT_CONFIG.multipliers[materialName] ?? CREDIT_CONFIG.multipliers.other;

    const recoverableGrams = amountGrams * recoveryRate;
    const creditPoints = recoverableGrams * multiplier;

    totalScore += creditPoints;
    totalRecoverableWeight += recoverableGrams;

    breakdown.push({
      material: materialName,
      displayName: capitalize(materialName),
      amountGrams: round(amountGrams, 3),
      recoveryRate: round(recoveryRate * 100, 1) + "%",
      recoverableGrams: round(recoverableGrams, 3),
      multiplier,
      creditsAwarded: round(creditPoints, 1)
    });
  }

  // Ensure minimum baseline credits if device has materials
  const finalCredits = Math.max(CREDIT_CONFIG.minCredits, Math.round(totalScore));

  const totalKg = totalRecoverableWeight / 1000;
  const carbonOffsetKg = round(totalKg * CREDIT_CONFIG.environmentalFactors.co2KgPerKgRecycled, 2);
  const toxicDivertedGrams = round(totalRecoverableWeight * CREDIT_CONFIG.environmentalFactors.toxicKgPerKgRecycled, 1);

  return {
    estimatedCredits: finalCredits,
    totalRecoverableWeightGrams: round(totalRecoverableWeight, 2),
    materials: breakdown,
    environmentalImpact: {
      carbonOffsetKg: Math.max(0.1, carbonOffsetKg),
      toxicDivertedGrams: Math.max(1.0, toxicDivertedGrams),
      treesEquivalent: round(carbonOffsetKg / 20, 2)
    },
    calculatedAt: new Date().toISOString()
  };
}

/**
 * Calculate credits for a device object
 * @param {Object} device
 */
export function calculateDeviceCredits(device) {
  if (!device || !device.materials) {
    return {
      estimatedCredits: CREDIT_CONFIG.minCredits,
      totalRecoverableWeightGrams: 0,
      materials: [],
      environmentalImpact: { carbonOffsetKg: 0.5, toxicDivertedGrams: 5, treesEquivalent: 0.02 },
      calculatedAt: new Date().toISOString()
    };
  }
  return calculateCreditsFromMaterials(device.materials);
}

/**
 * Evaluate a manually entered device and calculate its estimated credits
 * @param {Object} params - Contains userId and device details
 * @returns {Object} Evaluation result with credits and metadata
 */
export async function evaluateManualDevice(params) {
  const { userId, device } = params;

  if (!device) {
    throw new Error("Device details are required");
  }

  // Calculate credits for the manual device
  const creditCalculation = calculateDeviceCredits(device);

  // Create a verification transaction record for the manual device
  // Similar to the claim-and-verify route but for manual entry
  const transaction = await createVerificationTransaction({
    userId,
    claimedDevice: {
      category: device.category || "Manual Entry",
      brand: device.brand || "Unknown",
      model: device.model || "Unknown"
    },
    detectedDevice: {
      category: device.category || "Manual Entry",
      brand: device.brand || "Unknown",
      model: device.model || "Unknown"
    },
    aiVerification: {
      claimedDevice: {
        category: device.category || "Manual Entry",
        brand: device.brand || "Unknown",
        model: device.model || "Unknown"
      },
      detectedDevice: {
        category: device.category || "Manual Entry",
        brand: device.brand || "Unknown",
        model: device.model || "Unknown"
      },
      visualCharacteristics: "Manual device entry - specifications provided by user",
      match: true, // For manual entry, we assume the user knows what they entered
      confidence: 0.95, // High confidence since it's user-provided
      verificationStatus: "MANUAL_ENTRY_VERIFIED",
      statusMessage: "Device specifications manually entered by user",
      reasoning: "Device details provided directly by user for evaluation"
    },
    estimatedCredits: creditCalculation.estimatedCredits,
    materialsBreakdown: creditCalculation.materials,
    deviceId: null // Manual devices don't have a database ID
  });

  // Generate educational content for the device
  const educationalContent = await generateEwasteEducationalContent(
    `${device.brand || "Unknown"} ${device.model || "Unknown Device"}`,
    device.category || "Electronics"
  );

  // Get or create wallet for the user
  const userWallet = await getOrCreateWallet(userId);

  return {
    ok: true,
    transaction,
    aiVerification: {
      claimedDevice: {
        category: device.category || "Manual Entry",
        brand: device.brand || "Unknown",
        model: device.model || "Unknown"
      },
      detectedDevice: {
        category: device.category || "Manual Entry",
        brand: device.brand || "Unknown",
        model: device.model || "Unknown"
      },
      visualCharacteristics: "Manual device entry - specifications provided by user",
      match: true,
      confidence: 0.95,
      verificationStatus: "MANUAL_ENTRY_VERIFIED",
      statusMessage: "Device specifications manually entered by user",
      reasoning: "Device details provided directly by user for evaluation",
      educationalContent
    },
    creditCalculation,
    wallet: userWallet
  };
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function round(val, dec = 2) {
  const factor = Math.pow(10, dec);
  return Math.round(val * factor) / factor;
}

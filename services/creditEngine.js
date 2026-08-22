/**
 * Centralized Credit Calculation Engine for SIH1392 E-Waste Portal
 * 
 * Formula:
 * BaseCredits = round( Σ ( materialAmountGrams × recoveryRate × materialCreditMultiplier ) )
 * 
 * NOTE: These are application-defined scoring coefficients for the platform rewards,
 * NOT statutory government EPR values.
 */

export const CREDIT_CONFIG = {
  version: "1.0.0",
  currencyName: "E-Waste Credits",
  disclaimer: "These reward credits are platform-based incentives and are not government-issued EPR certificates or statutory Green Credits.",
  multipliers: {
    gold: 1000,
    silver: 10,
    copper: 2,
    aluminium: 0.5,
    cobalt: 4,
    lithium: 3,
    plastics: 0.05,
    other: 0.1
  },
  minCredits: 5
};

/**
 * Calculates e-waste credits and material breakdown from materials map
 * @param {Object} materials - e.g. { gold: { amountGrams: 0.034, recoveryRate: 0.90 }, ... }
 * @returns {Object} { totalCredits, materialsList, rawCalculations }
 */
export function calculateCreditsFromMaterials(materials = {}) {
  const breakdown = [];
  let totalScore = 0;
  let totalRecoverableWeight = 0;

  for (const [materialName, info] of Object.entries(materials)) {
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

  return {
    estimatedCredits: finalCredits,
    totalRecoverableWeightGrams: round(totalRecoverableWeight, 2),
    materials: breakdown,
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
      calculatedAt: new Date().toISOString()
    };
  }
  return calculateCreditsFromMaterials(device.materials);
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function round(val, dec = 2) {
  const factor = Math.pow(10, dec);
  return Math.round(val * factor) / factor;
}

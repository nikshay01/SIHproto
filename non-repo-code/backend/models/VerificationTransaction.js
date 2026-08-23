import mongoose from "mongoose";

const MaterialBreakdownSchema = new mongoose.Schema({
  material: String,
  displayName: String,
  amountGrams: Number,
  recoveryRate: String,
  recoverableGrams: Number,
  multiplier: Number,
  creditsAwarded: Number
}, { _id: false });

const FacilityVerificationSchema = new mongoose.Schema({
  facilityId: { type: String, required: true },
  facilityName: { type: String, required: true },
  inspectorName: { type: String, default: "Environmental Officer" },
  inspectorNotes: { type: String, default: "" },
  rejectionReason: { type: String, default: null },
  verifiedAt: { type: Date, default: null },
  rejectedAt: { type: Date, default: null }
}, { _id: false });

const VerificationTransactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true,
    default: "guest-user"
  },
  deviceId: {
    type: String,
    default: null
  },
  claimedDevice: {
    category: { type: String, required: true },
    brand: { type: String, required: true },
    model: { type: String, required: true }
  },
  detectedDevice: {
    category: { type: String, default: "" },
    brand: { type: String, default: "" },
    model: { type: String, default: "" }
  },
  aiConfidence: {
    type: Number,
    default: 0.90
  },
  aiMatch: {
    type: Boolean,
    default: true
  },
  aiReasoning: {
    type: String,
    default: ""
  },
  visualCharacteristics: {
    type: String,
    default: ""
  },
  estimatedCredits: {
    type: Number,
    default: 0
  },
  verifiedCredits: {
    type: Number,
    default: 0
  },
  materialsBreakdown: [MaterialBreakdownSchema],
  verificationStatus: {
    type: String,
    required: true,
    enum: [
      "PENDING_RECYCLING",
      "MANUAL_VERIFICATION_REQUIRED",
      "AI_VERIFICATION_FAILED",
      "FACILITY_VERIFIED",
      "CREDITS_ISSUED",
      "REJECTED"
    ],
    default: "PENDING_RECYCLING",
    index: true
  },
  statusMessage: {
    type: String,
    default: "Verification registered and pending physical drop-off."
  },
  facilityVerification: FacilityVerificationSchema,
  shardKey: {
    type: String,
    index: true
  },
  verifiedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

VerificationTransactionSchema.index({ userId: 1, createdAt: -1 });

const VerificationTransaction = mongoose.model("VerificationTransaction", VerificationTransactionSchema);
export default VerificationTransaction;

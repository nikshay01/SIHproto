import mongoose from "mongoose";

const RedemptionSchema = new mongoose.Schema({
  redemptionId: { type: String, required: true },
  rewardId: { type: String, required: true },
  rewardTitle: { type: String, required: true },
  creditsSpent: { type: Number, required: true },
  couponCode: { type: String, required: true },
  status: { type: String, default: "ACTIVE", enum: ["ACTIVE", "USED", "EXPIRED"] },
  redeemedAt: { type: Date, default: Date.now }
}, { _id: false });

const WalletSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: "guest-user"
  },
  estimatedCredits: {
    type: Number,
    default: 0,
    min: 0
  },
  verifiedCredits: {
    type: Number,
    default: 0,
    min: 0
  },
  redeemedCredits: {
    type: Number,
    default: 0,
    min: 0
  },
  availableCredits: {
    type: Number,
    default: 0,
    min: 0
  },
  redemptions: [RedemptionSchema],
  shardKey: {
    type: String,
    index: true
  }
}, {
  timestamps: true
});

const Wallet = mongoose.model("Wallet", WalletSchema);
export default Wallet;

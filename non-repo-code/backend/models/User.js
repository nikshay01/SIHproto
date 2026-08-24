import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const BadgeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  icon: { type: String, default: "Leaf" },
  description: { type: String, default: "" },
  tier: { type: String, enum: ["Bronze", "Silver", "Gold", "Platinum"], default: "Bronze" },
  unlockedAt: { type: Date, default: Date.now }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    default: ""
  },
  role: {
    type: String,
    enum: ["user", "admin", "facility_agent"],
    default: "user"
  },
  avatar: {
    type: String,
    default: ""
  },
  address: {
    street: { type: String, default: "" },
    city: { type: String, default: "" },
    district: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" }
  },
  ecoStats: {
    devicesRecycled: { type: Number, default: 0 },
    co2SavedKg: { type: Number, default: 0 },
    preciousMetalsSavedGrams: { type: Number, default: 0 },
    pickupsCompleted: { type: Number, default: 0 },
    eprCertificatesGenerated: { type: Number, default: 0 }
  },
  badges: [BadgeSchema],
  kycStatus: {
    type: String,
    enum: ["unverified", "pending", "verified"],
    default: "verified"
  }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password helper
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Safe JSON transform (strip password)
UserSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model("User", UserSchema);
export default User;

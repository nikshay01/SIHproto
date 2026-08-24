import express from "express";
import crypto from "crypto";
import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import VerificationTransaction from "../models/VerificationTransaction.js";
import PickupRequest from "../models/PickupRequest.js";
import { generateToken, authenticate } from "../middleware/authMiddleware.js";
import { getOrCreateWallet } from "../services/walletService.js";

const router = express.Router();

// Helper to generate default starter badges
const DEFAULT_BADGES = [
  {
    id: "badge_welcome",
    name: "Eco Citizen",
    icon: "Leaf",
    description: "Joined the National E-Waste Circular Economy Network",
    tier: "Bronze"
  },
  {
    id: "badge_verified_citizen",
    name: "Verified Recycler",
    icon: "ShieldCheck",
    description: "KYC & Identity Verified for Official EPR Credit Generation",
    tier: "Silver"
  }
];

// @route  POST /api/auth/register
// @desc   Register a new user, create their wallet with welcome credits, and return JWT
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, phone = "", city = "", state = "", pincode = "" } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        ok: false,
        error: "Please provide all required fields: name, email, and password."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        ok: false,
        error: "Password must be at least 6 characters long."
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        ok: false,
        error: "An account with this email address already exists. Please sign in instead."
      });
    }

    const userId = `usr_${crypto.randomBytes(6).toString("hex")}`;

    // Create user document
    const user = new User({
      userId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone.trim(),
      address: {
        city: city.trim(),
        state: state.trim() || "National",
        pincode: pincode.trim()
      },
      badges: DEFAULT_BADGES,
      ecoStats: {
        devicesRecycled: 1,
        co2SavedKg: 12.5,
        preciousMetalsSavedGrams: 4.2,
        pickupsCompleted: 0,
        eprCertificatesGenerated: 0
      }
    });

    await user.save();

    // Auto-create and credit wallet with 150 welcome bonus credits
    let userWallet = await Wallet.findOne({ userId });
    if (!userWallet) {
      userWallet = new Wallet({
        userId,
        estimatedCredits: 50,
        verifiedCredits: 100,
        availableCredits: 150,
        shardKey: user.address?.state || "National"
      });
      await userWallet.save();
    }

    const token = generateToken(user);

    res.status(201).json({
      ok: true,
      message: "Registration successful! Welcome bonus of 150 Eco-Credits credited.",
      token,
      user: user.toSafeObject(),
      wallet: userWallet
    });
  } catch (err) {
    next(err);
  }
});

// @route  POST /api/auth/login
// @desc   Authenticate user, check password & return JWT token + user profile
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        error: "Please provide both email and password."
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        ok: false,
        error: "Invalid email or password."
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        ok: false,
        error: "Invalid email or password."
      });
    }

    const token = generateToken(user);
    const wallet = await getOrCreateWallet(user.userId);

    res.json({
      ok: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: user.toSafeObject(),
      wallet
    });
  } catch (err) {
    next(err);
  }
});

// @route  GET /api/auth/me
// @desc   Get current logged-in user profile, eco-stats, wallet, and recent activity
router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = req.user;
    const wallet = await getOrCreateWallet(user.userId);

    // Fetch user's recent transactions and pickups
    const recentTransactions = await VerificationTransaction.find({
      $or: [{ userId: user.userId }, { userId: "guest-user" }]
    })
      .sort({ createdAt: -1 })
      .limit(10);

    const pickups = await PickupRequest.find({
      $or: [{ userId: user.userId }, { "contact.email": user.email }]
    })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      ok: true,
      user: user.toSafeObject(),
      wallet,
      recentTransactions,
      pickups
    });
  } catch (err) {
    next(err);
  }
});

// @route  PUT /api/auth/profile
// @desc   Update user profile information
router.put("/profile", authenticate, async (req, res, next) => {
  try {
    const user = req.user;
    const { name, phone, city, state, district, pincode, street, avatar } = req.body;

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (avatar !== undefined) user.avatar = avatar;

    if (city !== undefined) user.address.city = city.trim();
    if (state !== undefined) user.address.state = state.trim();
    if (district !== undefined) user.address.district = district.trim();
    if (pincode !== undefined) user.address.pincode = pincode.trim();
    if (street !== undefined) user.address.street = street.trim();

    await user.save();

    res.json({
      ok: true,
      message: "Profile updated successfully.",
      user: user.toSafeObject()
    });
  } catch (err) {
    next(err);
  }
});

// @route  GET /api/auth/users
// @desc   List all users (useful for testing, demo, and audit)
router.get("/users", async (req, res, next) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 }).limit(50);
    res.json({
      ok: true,
      count: users.length,
      users
    });
  } catch (err) {
    next(err);
  }
});

export default router;

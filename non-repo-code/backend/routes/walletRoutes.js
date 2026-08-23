import express from "express";
import {
  getOrCreateWallet,
  redeemUserCredits,
  getUserTransactions
} from "../services/walletService.js";

const router = express.Router();

router.get("/:userId", async (req, res, next) => {
  try {
    const userId = req.params.userId || "guest-user";
    const wallet = await getOrCreateWallet(userId);
    const transactions = await getUserTransactions(userId);

    res.json({
      ok: true,
      wallet,
      transactions
    });
  } catch (err) {
    next(err);
  }
});

router.post("/redeem", async (req, res, next) => {
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

    const result = await redeemUserCredits({
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
    res.status(400).json({
      ok: false,
      error: err.message
    });
  }
});

export default router;

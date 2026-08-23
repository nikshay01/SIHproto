import express from "express";
import PickupRequest from "../models/PickupRequest.js";
import { recordAudit } from "../services/auditService.js";

const router = express.Router();
const inMemoryPickups = [];

router.post("/schedule", async (req, res, next) => {
  try {
    const {
      facilityId = "",
      facilityName,
      userName,
      userPhone,
      userAddress,
      pickupDate,
      itemType = "General Electronics"
    } = req.body;

    if (!facilityName || !userName || !userPhone || !userAddress || !pickupDate) {
      return res.status(400).json({
        ok: false,
        error: "Missing required pickup fields (facilityName, userName, userPhone, userAddress, pickupDate)."
      });
    }

    const ticketId = `PU-${Math.floor(100000 + Math.random() * 900000)}`;
    const pickupData = {
      pickupTicketId: ticketId,
      facilityId,
      facilityName,
      userName,
      userPhone,
      userAddress,
      pickupDate,
      itemType,
      status: "SCHEDULED",
      createdAt: new Date().toISOString()
    };

    inMemoryPickups.unshift(pickupData);

    try {
      await PickupRequest.create(pickupData);
    } catch (e) {
      // Mongo offline
    }

    recordAudit({
      transactionId: null,
      userId: userName,
      actor: "USER",
      action: "SCHEDULE_DOORSTEP_PICKUP",
      previousStatus: null,
      newStatus: "SCHEDULED",
      details: { ticketId, facilityName, pickupDate, itemType }
    });

    res.json({
      ok: true,
      message: `Doorstep pickup successfully booked for ${pickupDate}. Tracking Ticket: ${ticketId}`,
      pickup: pickupData
    });
  } catch (err) {
    next(err);
  }
});

router.get("/list", async (req, res, next) => {
  try {
    try {
      const mongoPickups = await PickupRequest.find().sort({ createdAt: -1 }).limit(50).lean();
      if (mongoPickups && mongoPickups.length > 0) {
        return res.json({ ok: true, count: mongoPickups.length, pickups: mongoPickups });
      }
    } catch (e) {
      // Fall back
    }
    res.json({ ok: true, count: inMemoryPickups.length, pickups: inMemoryPickups });
  } catch (err) {
    next(err);
  }
});

export default router;

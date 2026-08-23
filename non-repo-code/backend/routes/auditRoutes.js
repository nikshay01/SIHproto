import express from "express";
import { getAuditLogs } from "../services/auditService.js";

const router = express.Router();

router.get("/logs", async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    const logs = await getAuditLogs(limit);
    res.json({
      ok: true,
      count: logs.length,
      logs
    });
  } catch (err) {
    next(err);
  }
});

export default router;

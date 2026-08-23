import express from "express";
import {
  queryFacilities,
  getFacilityById,
  getStateSummaries,
  getDatasetMetadata,
  getAllFacilities
} from "../services/facilityService.js";
import { executeRegionalQuery } from "../services/shardRouter.js";

const router = express.Router();

router.get("/list", async (req, res, next) => {
  try {
    const {
      state,
      type,
      minCapacity,
      search,
      userLat,
      userLng,
      sortBy,
      limit = 500,
      offset = 0
    } = req.query;

    const result = await queryFacilities({
      state,
      type,
      minCapacity: Number(minCapacity) || 0,
      search,
      userLat: userLat ? Number(userLat) : null,
      userLng: userLng ? Number(userLng) : null,
      sortBy: sortBy || "distance_asc",
      limit: Number(limit) || 500,
      offset: Number(offset) || 0
    });

    res.json({
      ok: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
});

router.get("/states", (req, res) => {
  const summaries = getStateSummaries();
  res.json({
    ok: true,
    count: summaries.length,
    states: summaries
  });
});

router.get("/metadata", (req, res) => {
  res.json({
    ok: true,
    metadata: getDatasetMetadata()
  });
});

router.get("/shard/:state", async (req, res, next) => {
  try {
    const result = await executeRegionalQuery(req.params.state);
    if (!result) {
      return res.status(404).json({ ok: false, error: "Unable to route query to regional shard." });
    }
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const facility = await getFacilityById(req.params.id);
    if (!facility) {
      return res.status(404).json({ ok: false, error: `Facility with ID '${req.params.id}' not found.` });
    }
    res.json({ ok: true, facility });
  } catch (err) {
    next(err);
  }
});

export default router;

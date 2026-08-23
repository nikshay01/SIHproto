import express from "express";
import {
  getAllDevices,
  getCategories,
  getBrands,
  getModels,
  getDeviceById,
  searchDevices,
  getMetadata
} from "../services/deviceService.js";

const router = express.Router();

router.get("/categories", async (req, res, next) => {
  try {
    const categories = await getCategories();
    res.json({ ok: true, count: categories.length, categories });
  } catch (err) {
    next(err);
  }
});

router.get("/brands", async (req, res, next) => {
  try {
    const category = req.query.category || null;
    const brands = await getBrands(category);
    res.json({ ok: true, category, count: brands.length, brands });
  } catch (err) {
    next(err);
  }
});

router.get("/list", async (req, res, next) => {
  try {
    const { category, brand, search } = req.query;
    let list;
    if (search) {
      list = await searchDevices(search);
    } else {
      list = await getModels(category, brand);
    }
    res.json({ ok: true, count: list.length, devices: list });
  } catch (err) {
    next(err);
  }
});

router.get("/metadata", (req, res) => {
  res.json({ ok: true, metadata: getMetadata() });
});

router.get("/:id", async (req, res, next) => {
  try {
    const device = await getDeviceById(req.params.id);
    if (!device) {
      return res.status(404).json({ ok: false, error: `Device with ID '${req.params.id}' not found.` });
    }
    res.json({ ok: true, device });
  } catch (err) {
    next(err);
  }
});

export default router;

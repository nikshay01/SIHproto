import mongoose from "mongoose";

const MaterialSchema = new mongoose.Schema({
  amountGrams: { type: Number, required: true },
  recoveryRate: { type: Number, default: 0.85 },
  marketValuePerGramInr: { type: Number, default: 0 }
}, { _id: false });

const DeviceCompositionSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  brand: {
    type: String,
    required: true,
    index: true
  },
  model: {
    type: String,
    required: true,
    index: true
  },
  releaseYear: {
    type: Number
  },
  weightGrams: {
    type: Number,
    required: true
  },
  visualFeatures: {
    type: String,
    default: ""
  },
  materials: {
    gold: MaterialSchema,
    silver: MaterialSchema,
    copper: MaterialSchema,
    aluminium: MaterialSchema,
    cobalt: MaterialSchema,
    lithium: MaterialSchema,
    plastics: MaterialSchema,
    glass: MaterialSchema,
    other: MaterialSchema
  },
  hazardousElements: [{
    element: String,
    hazardDescription: String,
    safeDisposalRequirement: String
  }]
}, {
  timestamps: true
});

DeviceCompositionSchema.index({ category: 1, brand: 1 });
DeviceCompositionSchema.index({ brand: "text", model: "text", category: "text" });

const DeviceComposition = mongoose.model("DeviceComposition", DeviceCompositionSchema);
export default DeviceComposition;

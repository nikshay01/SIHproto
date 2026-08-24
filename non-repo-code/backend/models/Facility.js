import mongoose from "mongoose";

const FacilitySchema = new mongoose.Schema({
  facilityId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ["Recycler", "Dismantler", "Refurbisher", "Collection Center"],
    index: true
  },
  address: {
    type: String,
    required: true
  },
  district: {
    type: String,
    required: true,
    index: true
  },
  state: {
    type: String,
    required: true,
    index: true
  },
  capacityMta: {
    type: Number,
    default: 0,
    index: true
  },
  isAuthorized: {
    type: Boolean,
    default: true,
    index: true
  },
  authorizationStatus: {
    type: String,
    default: "Authorized"
  },
  authorizationBy: {
    type: String,
    default: "CPCB / SPCB"
  },
  regulatoryCompliance: {
    type: String,
    default: "E-Waste (Management) Rules, 2022"
  },
  contact: {
    phone: { type: String, default: "" },
    tollFree: { type: String, default: "" },
    email: { type: String, default: "" },
    website: { type: String, default: "" },
    contactPerson: { type: String, default: "" }
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    googleMapsUrl: { type: String, default: "" },
    formattedAddress: { type: String, default: "" }
  },
  status: {
    type: String,
    default: "Active",
    enum: ["Active", "Inactive", "Suspended"]
  },
  acceptedEwasteTypes: {
    type: [String],
    default: [],
    index: true
  },
  acceptedCategories: {
    type: [String],
    default: [],
    index: true
  },
  hazardousMaterialsHandled: {
    type: [String],
    default: []
  },
  specializations: {
    type: [String],
    default: []
  },
  shardKey: {
    type: String,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for high performance queries
FacilitySchema.index({ "location": "2dsphere" }); // Geospatial 2dsphere index
FacilitySchema.index({ state: 1, type: 1, capacityMta: -1 });
FacilitySchema.index({ name: "text", address: "text", district: "text", state: "text", acceptedEwasteTypes: "text" });

const Facility = mongoose.model("Facility", FacilitySchema);
export default Facility;

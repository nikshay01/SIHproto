import mongoose from "mongoose";

const PickupRequestSchema = new mongoose.Schema({
  pickupTicketId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  facilityId: {
    type: String,
    default: ""
  },
  facilityName: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userPhone: {
    type: String,
    required: true
  },
  userAddress: {
    type: String,
    required: true
  },
  pickupDate: {
    type: String,
    required: true
  },
  itemType: {
    type: String,
    default: "General Electronics"
  },
  status: {
    type: String,
    enum: ["SCHEDULED", "IN_TRANSIT", "COLLECTED", "CANCELLED"],
    default: "SCHEDULED"
  }
}, {
  timestamps: true
});

const PickupRequest = mongoose.model("PickupRequest", PickupRequestSchema);
export default PickupRequest;

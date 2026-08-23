import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema({
  logId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  transactionId: {
    type: String,
    default: null,
    index: true
  },
  userId: {
    type: String,
    default: null,
    index: true
  },
  actor: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  previousStatus: {
    type: String,
    default: null
  },
  newStatus: {
    type: String,
    default: null
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false
});

const AuditLog = mongoose.model("AuditLog", AuditLogSchema);
export default AuditLog;

import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Building,
  UserCheck,
  AlertOctagon,
  Sparkles
} from "lucide-react";
import { facilityConfirmTransaction, facilityRejectTransaction } from "../../services/api.js";
import { useWallet } from "../../context/WalletContext.jsx";
import confetti from "canvas-confetti";

export default function InspectionDecisionPanel({
  transaction,
  activeFacility,
  onActionComplete
}) {
  const { refreshWallet } = useWallet();
  const [inspectorName, setInspectorName] = useState("Officer S. Sharma");
  const [inspectorNotes, setInspectorNotes] = useState("Physical device matches claim and accepted for scientific recycling.");
  const [rejectionReason, setRejectionReason] = useState("Physical inspection revealed device mismatch or damaged non-recyclable components.");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  if (!transaction) {
    return (
      <div className="glass-card terminal-empty-card">
        <Clock size={40} className="text-muted mb-3" />
        <h4>No Transaction Loaded</h4>
        <p className="text-sm text-muted max-w-sm text-center">
          Enter a Customer Transaction ID or scan their QR token on the left to inspect device forensics.
        </p>
      </div>
    );
  }

  const isAlreadyProcessed =
    transaction.verificationStatus === "CREDITS_ISSUED" ||
    transaction.verificationStatus === "FACILITY_VERIFIED" ||
    transaction.verificationStatus === "REJECTED";

  const handleConfirm = async () => {
    setProcessing(true);
    setError(null);
    try {
      const res = await facilityConfirmTransaction({
        transactionId: transaction.transactionId,
        facilityId: activeFacility?.id || "FAC-DEL-004",
        facilityName: activeFacility?.name || "Authorized E-Waste Facility",
        inspectorName,
        inspectorNotes
      });

      if (res.ok) {
        try {
          confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
        } catch (e) {}
        await refreshWallet();
        if (onActionComplete) onActionComplete(res.transaction);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to confirm verification");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    setProcessing(true);
    setError(null);
    try {
      const res = await facilityRejectTransaction({
        transactionId: transaction.transactionId,
        facilityId: activeFacility?.id || "FAC-DEL-004",
        facilityName: activeFacility?.name || "Authorized E-Waste Facility",
        inspectorName,
        rejectionReason
      });

      if (res.ok) {
        await refreshWallet();
        if (onActionComplete) onActionComplete(res.transaction);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to reject transaction");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="glass-card terminal-decision-card">
      <div className="decision-header">
        <div className="flex items-center gap-2">
          <ShieldCheck size={20} className="text-primary" />
          <h3 className="text-lg">Device Inspection Terminal</h3>
        </div>
        <span className={`badge ${
          transaction.verificationStatus === "CREDITS_ISSUED" ? "badge-emerald" :
          transaction.verificationStatus === "REJECTED" ? "badge-error" : "badge-gold"
        }`}>
          {transaction.verificationStatus}
        </span>
      </div>

      {error && (
        <div className="error-box">
          <AlertOctagon size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Transaction Banner */}
      <div className="tx-meta-box">
        <div>
          <span className="text-xs text-muted font-bold">TRANSACTION ID</span>
          <div className="text-lg font-bold font-mono text-primary">{transaction.transactionId}</div>
        </div>
        <div className="text-right">
          <span className="text-xs text-muted font-bold">CUSTOMER ID</span>
          <div className="text-sm font-mono">{transaction.userId || "guest-user"}</div>
        </div>
      </div>

      {/* Inspection Data Table */}
      <div className="specs-table">
        <div className="spec-row">
          <span className="spec-k">Claimed Device:</span>
          <strong className="spec-v">{transaction.claimedDevice?.brand} {transaction.claimedDevice?.model}</strong>
        </div>
        <div className="spec-row">
          <span className="spec-k">AI Detected Device:</span>
          <strong className="spec-v text-primary">{transaction.detectedDevice?.brand} {transaction.detectedDevice?.model}</strong>
        </div>
        <div className="spec-row">
          <span className="spec-k">Visual Confidence:</span>
          <span className="spec-v font-mono">{Math.round((transaction.aiConfidence ?? 0.94) * 100)}%</span>
        </div>
        <div className="spec-row">
          <span className="spec-k">Estimated Reward Credits:</span>
          <strong className="spec-v text-secondary font-mono">{transaction.estimatedCredits} Credits</strong>
        </div>
        <div className="spec-row">
          <span className="spec-k">Creation Timestamp:</span>
          <span className="spec-v text-xs text-muted font-mono">{new Date(transaction.createdAt || Date.now()).toLocaleString()}</span>
        </div>
      </div>

      {/* Status Warning if Already Verified */}
      {isAlreadyProcessed ? (
        <div className="processed-box">
          <CheckCircle2 size={20} className="text-emerald-500" />
          <div>
            <strong>Transaction Already Finalized</strong>
            <p className="text-xs text-muted">{transaction.statusMessage}</p>
          </div>
        </div>
      ) : (
        <div className="action-form-area">
          <div className="input-group">
            <label className="input-label">Inspector Name / Badge ID</label>
            <input
              type="text"
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Physical Inspection Verification Notes</label>
            <input
              type="text"
              value={inspectorNotes}
              onChange={(e) => setInspectorNotes(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="buttons-split-row">
            <button
              className="btn btn-primary btn-lg flex-1"
              onClick={handleConfirm}
              disabled={processing}
            >
              <CheckCircle2 size={18} />
              <span>VERIFY DEVICE & ISSUE CREDITS</span>
            </button>
            <button
              className="btn btn-danger btn-lg"
              onClick={handleReject}
              disabled={processing}
            >
              <XCircle size={18} />
              <span>REJECT CLAIM</span>
            </button>
          </div>
        </div>
      )}

      <style>{`
        .terminal-empty-card, .terminal-decision-card {
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          height: 100%;
        }
        .terminal-empty-card {
          align-items: center;
          justify-content: center;
          min-height: 380px;
        }
        .decision-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 14px;
          border-bottom: 1px solid var(--border-subtle);
        }
        .tx-meta-box {
          background: var(--bg-muted);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-md);
          padding: 14px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .specs-table {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .spec-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.875rem;
          padding: 8px 0;
          border-bottom: 1px solid var(--border-subtle);
        }
        .spec-k {
          color: var(--text-muted);
        }
        .spec-v {
          color: var(--text-primary);
        }
        .action-form-area {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: 6px;
        }
        .buttons-split-row {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }
        .flex-1 { flex: 1; }
        .processed-box {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--primary-light);
          border: 1px solid var(--primary-border);
          padding: 14px 18px;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
        }
        .error-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--error-light);
          color: var(--error);
          padding: 10px 14px;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
        }
        @media (max-width: 640px) {
          .buttons-split-row {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

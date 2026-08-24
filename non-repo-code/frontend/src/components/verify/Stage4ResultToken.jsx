import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  MapPin,
  Wallet,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Clock
} from "lucide-react";
import confetti from "canvas-confetti";

export default function Stage4ResultToken({ verificationResult, onReset, onNavigate }) {
  const qrCanvasRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [showEducation, setShowEducation] = useState(false);

  const {
    transaction,
    aiVerification,
    creditCalculation
  } = verificationResult || {};

  const txId = transaction?.transactionId || "EW-2026-UNKNOWN";
  const status = transaction?.verificationStatus || aiVerification?.verificationStatus || "AI_VERIFIED";
  const confidence = Math.round((aiVerification?.confidence ?? 0.94) * 100);
  const estCredits = transaction?.estimatedCredits ?? creditCalculation?.estimatedCredits ?? 0;

  // Render QR Code and trigger celebration confetti on success
  useEffect(() => {
    if (qrCanvasRef.current && txId) {
      QRCode.toCanvas(qrCanvasRef.current, txId, {
        width: 130,
        margin: 1,
        color: {
          dark: "#0f172a",
          light: "#ffffff"
        }
      });
    }

    if (status === "AI_VERIFIED") {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  }, [txId, status]);

  const handleCopyTxId = () => {
    navigator.clipboard.writeText(txId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card verify-stage-card">
      <div className="stage-card-head">
        <div className="flex items-center gap-3">
          <div className="stage-icon-wrap">
            <ShieldCheck size={22} className="text-primary" />
          </div>
          <div>
            <h3 className="stage-title">Verification Decision & Drop-Off Token</h3>
            <p className="stage-subtitle">AI forensic assessment completed</p>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={onReset}>
          <RotateCcw size={14} />
          <span>New Verification</span>
        </button>
      </div>

      {/* Decision Banner */}
      <div className={`verdict-banner ${status.toLowerCase()}`}>
        {status === "AI_VERIFIED" ? (
          <>
            <CheckCircle2 size={28} className="text-emerald-500 flex-shrink-0" />
            <div>
              <h4>Device Optical Confirmation Passed</h4>
              <p>{aiVerification?.statusMessage || "Physical hardware traits match claimed specifications."}</p>
            </div>
          </>
        ) : status === "MANUAL_VERIFICATION_REQUIRED" ? (
          <>
            <AlertTriangle size={28} className="text-amber-500 flex-shrink-0" />
            <div>
              <h4>Physical Inspection Mandatory</h4>
              <p>{aiVerification?.statusMessage || "Visual cues suggest device category match, but facility verification is required."}</p>
            </div>
          </>
        ) : (
          <>
            <XCircle size={28} className="text-red-500 flex-shrink-0" />
            <div>
              <h4>Device Mismatch Detected</h4>
              <p>{aiVerification?.statusMessage || "Submitted image does not match the claimed brand/model."}</p>
            </div>
          </>
        )}
      </div>

      {/* Comparison Diff Matrix */}
      <div className="comparison-grid">
        <div className="diff-card">
          <span className="diff-tag">YOUR CLAIM</span>
          <h4 className="diff-val">{aiVerification?.claimedDevice?.brand} {aiVerification?.claimedDevice?.model}</h4>
          <span className="diff-cat">{aiVerification?.claimedDevice?.category}</span>
        </div>

        <div className="diff-arrow">
          {aiVerification?.match ? (
            <span className="badge badge-emerald">MATCH</span>
          ) : (
            <span className="badge badge-error">MISMATCH</span>
          )}
        </div>

        <div className="diff-card">
          <span className="diff-tag">AI FORENSICS DETECTED</span>
          <h4 className="diff-val text-primary">{aiVerification?.detectedDevice?.brand} {aiVerification?.detectedDevice?.model}</h4>
          <span className="diff-cat">{aiVerification?.detectedDevice?.category}</span>
        </div>
      </div>

      {/* Confidence Panel */}
      <div className="confidence-panel">
        <div className="confidence-top">
          <span>AI Visual Confidence</span>
          <strong className="font-mono">{confidence}%</strong>
        </div>
        <div className="confidence-track">
          <div className="confidence-bar" style={{ width: `${confidence}%` }}></div>
        </div>
        <p className="confidence-reasoning">
          {aiVerification?.reasoning || "Hardware markers, chassis contours, and camera array verified."}
        </p>
      </div>

      {/* Estimated Credits Breakdown Card */}
      <div className="estimated-credits-box">
        <div className="credits-box-head">
          <div>
            <span className="est-badge">
              <Clock size={13} />
              ESTIMATED REWARD CREDITS
            </span>
            <div className="est-number font-mono">
              <strong>{estCredits}</strong>
              <small>Platform Credits</small>
            </div>
          </div>
          <div className="pending-badge">
            <Clock size={14} />
            <span>Pending Facility Acceptance</span>
          </div>
        </div>

        {/* Recoverable Material Tags */}
        <div className="materials-area">
          <span className="materials-title">Estimated Recoverable Core Materials:</span>
          <div className="materials-tags-row">
            {(creditCalculation?.materials || []).map((m, i) => (
              <span key={i} className="material-pill font-mono">
                {m.displayName}: <strong>{m.recoverableGrams}g</strong> ({m.creditsAwarded} pts)
              </span>
            ))}
          </div>
        </div>

        <div className="credits-notice">
          <strong>⚠ Important:</strong> These credits are currently <strong>ESTIMATED</strong>. Present this device and the QR code below at any authorized recycling facility counter to physically verify acceptance and unlock your redeemable credits.
        </div>
      </div>

      {/* Unique Transaction QR Token Card */}
      <div className="transaction-token-card">
        <div className="token-card-left">
          <span className="token-badge">DROP-OFF TRANSACTION TOKEN</span>
          <div className="token-id-row font-mono">
            <span className="id-lbl">ID:</span>
            <strong className="id-val">{txId}</strong>
            <button className="btn-copy" onClick={handleCopyTxId} title="Copy ID">
              {copied ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
            </button>
          </div>
          <p className="text-xs text-muted">
            Show this QR code at the drop-off counter of any registered CPCB/SPCB recycling unit.
          </p>

          <div className="token-btn-row">
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("locate")}>
              <MapPin size={14} />
              <span>Find Drop-Off Facility</span>
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("wallet")}>
              <Wallet size={14} />
              <span>View in Wallet</span>
            </button>
          </div>
        </div>

        <div className="token-card-right">
          <div className="qr-wrapper">
            <canvas ref={qrCanvasRef} />
          </div>
          <small className="qr-stamp-label">Digital Verification Stamp</small>
        </div>
      </div>

      <style>{`
        .verdict-banner {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 20px;
          border-radius: var(--radius-lg);
        }
        .verdict-banner.ai_verified {
          background: var(--primary-light);
          border: 1px solid var(--primary-border);
        }
        .verdict-banner.manual_verification_required {
          background: var(--warning-light);
          border: 1px solid rgba(234, 179, 8, 0.3);
        }
        .verdict-banner.ai_verification_failed {
          background: var(--error-light);
          border: 1px solid rgba(220, 38, 38, 0.3);
        }
        .verdict-banner h4 {
          font-size: 1.05rem;
          margin-bottom: 2px;
        }
        .verdict-banner p {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        .comparison-grid {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 16px;
        }
        .diff-card {
          background: var(--bg-muted);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-md);
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .diff-tag {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }
        .diff-val {
          font-size: 1.1rem;
          font-weight: 700;
        }
        .diff-cat {
          font-size: 0.8rem;
          color: var(--text-dim);
        }
        .confidence-panel {
          background: var(--bg-muted);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-md);
          padding: 16px 20px;
        }
        .confidence-top {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .confidence-track {
          width: 100%;
          height: 7px;
          background: var(--bg-surface);
          border-radius: var(--radius-full);
          overflow: hidden;
          margin-bottom: 8px;
        }
        .confidence-bar {
          height: 100%;
          background: var(--primary);
          border-radius: var(--radius-full);
          transition: width 1s ease-out;
        }
        .confidence-reasoning {
          font-size: 0.825rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .estimated-credits-box {
          background: var(--bg-surface);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-lg);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .credits-box-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .est-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--accent-gold);
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }
        .est-number {
          font-size: 2.2rem;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1;
        }
        .est-number small {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-muted);
          margin-left: 6px;
        }
        .pending-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--accent-gold-light);
          color: var(--accent-gold);
          padding: 6px 12px;
          border-radius: var(--radius-full);
          font-size: 0.8rem;
          font-weight: 600;
        }
        .materials-area {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .materials-title {
          font-size: 0.825rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .materials-tags-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .material-pill {
          font-size: 0.75rem;
          background: var(--bg-muted);
          border: 1px solid var(--border-subtle);
          padding: 4px 10px;
          border-radius: var(--radius-sm);
        }
        .credits-notice {
          font-size: 0.825rem;
          color: var(--text-secondary);
          background: var(--bg-muted);
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          line-height: 1.5;
        }
        .transaction-token-card {
          background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-muted) 100%);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-lg);
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
        }
        .token-card-left {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-width: 420px;
        }
        .token-badge {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--primary);
          letter-spacing: 0.05em;
        }
        .token-id-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1.35rem;
          color: var(--text-primary);
        }
        .btn-copy {
          padding: 4px;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
        }
        .token-btn-row {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }
        .token-card-right {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .qr-wrapper {
          background: #ffffff;
          padding: 8px;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
        }
        .qr-stamp-label {
          font-size: 0.7rem;
          color: var(--text-muted);
        }
        .educational-section {
          margin-top: 24px;
          width: 100%;
          border-top: 1px solid var(--border-card);
          padding-top: 16px;
        }
        .educational-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .educational-header h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }
        .btn-toggle {
          background: none;
          border: none;
          font-size: 1.5rem;
          line-height: 1;
          cursor: pointer;
          color: var(--text-muted);
          padding: 0 4px;
        }
        .educational-content {
          display: none;
          animation: fadeIn 0.3s ease-out;
        }
        .educational-content.visible {
          display: block;
        }
        .educational-title h4 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 8px;
          color: var(--text-primary);
        }
        .educational-body {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 12px;
        }
        .educational-body p {
          margin: 4px 0;
        }
        .educational-impact {
          font-size: 0.8rem;
          font-style: italic;
          color: var(--text-muted);
          border-top: 1px solid var(--border-subtle);
          padding-top: 8px;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (max-width: 768px) {
          .comparison-grid {
            grid-template-columns: 1fr;
          }
          .diff-arrow {
            text-align: center;
          }
          .educational-section {
            margin-top: 20px;
            padding-top: 12px;
          }
          .educational-header h3 {
            font-size: 1rem;
          }
          .educational-title h4 {
            font-size: 0.95rem;
          }
          .educational-body {
            font-size: 0.8rem;
          }
          .educational-impact {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}

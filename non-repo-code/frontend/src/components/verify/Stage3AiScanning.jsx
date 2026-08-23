import React from "react";
import { Cpu, Sparkles, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function Stage3AiScanning({ claimedDevice }) {
  return (
    <div className="glass-card verify-stage-card text-center scanning-stage-card">
      <div className="radar-animation-box">
        <div className="radar-ring radar-ring-1"></div>
        <div className="radar-ring radar-ring-2"></div>
        <div className="radar-ring radar-ring-3"></div>
        <div className="radar-core">
          <Cpu size={32} className="text-primary animate-pulse" />
        </div>
      </div>

      <h3 className="scanning-title">AI Vision Forensics in Progress...</h3>
      <p className="scanning-subtitle">
        Comparing visual hardware cues against <strong>{claimedDevice?.brand} {claimedDevice?.model}</strong>
      </p>

      <div className="scanning-log-box font-mono">
        <div className="log-line">
          <Sparkles size={12} className="text-primary" />
          <span>Multimodal inspection via NVIDIA Llama 3.2 Vision...</span>
        </div>
        <div className="log-line">
          <Sparkles size={12} className="text-secondary" />
          <span>Forensic validation of camera bump array and edge profile...</span>
        </div>
        <div className="log-line text-primary">
          <Sparkles size={12} className="text-primary" />
          <span>Computing anti-fraud mismatch matrix...</span>
        </div>
      </div>

      <style>{`
        .scanning-stage-card {
          padding: 56px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .radar-animation-box {
          position: relative;
          width: 120px;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 28px;
        }
        .radar-ring {
          position: absolute;
          border-radius: 50%;
          border: 1px solid var(--primary);
          animation: radarPulse 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
        .radar-ring-1 { width: 60px; height: 60px; animation-delay: 0s; }
        .radar-ring-2 { width: 90px; height: 90px; animation-delay: 0.5s; }
        .radar-ring-3 { width: 120px; height: 120px; animation-delay: 1s; }
        .radar-core {
          width: 56px;
          height: 56px;
          border-radius: var(--radius-full);
          background: var(--primary-light);
          border: 1px solid var(--primary-border);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }
        @keyframes radarPulse {
          0% { transform: scale(0.6); opacity: 0.8; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        .scanning-title {
          font-size: 1.4rem;
          font-weight: 800;
          margin-bottom: 6px;
        }
        .scanning-subtitle {
          font-size: 0.95rem;
          color: var(--text-secondary);
          margin-bottom: 24px;
        }
        .scanning-log-box {
          background: var(--bg-surface);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-md);
          padding: 14px 20px;
          font-size: 0.78rem;
          display: flex;
          flex-direction: column;
          gap: 6px;
          text-align: left;
          max-width: 460px;
          width: 100%;
        }
        .log-line {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}

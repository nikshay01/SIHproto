import React from "react";
import { Recycle, ShieldCheck, Heart } from "lucide-react";

export default function Footer({ onNavigate }) {
  return (
    <footer className="footer-root">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">
              <Recycle size={20} className="text-primary" />
              <span>Eco-Locate • E-Cycle India</span>
            </div>
            <p className="footer-tagline">
              National AI-Powered E-Waste Identification, Anti-Fraud Verification & Authorized Facility Directory.
            </p>
          </div>

          <div className="footer-links-grid">
            <div className="footer-col">
              <h4>Navigation</h4>
              <button onClick={() => onNavigate("landing")}>Home</button>
              <button onClick={() => onNavigate("locate")}>Facility Directory</button>
              <button onClick={() => onNavigate("verify")}>AI Device Verification</button>
              <button onClick={() => onNavigate("facility")}>Facility Portal</button>
            </div>

            <div className="footer-col">
              <h4>Features</h4>
              <button onClick={() => onNavigate("wallet")}>Reward Credits Wallet</button>
              <button onClick={() => onNavigate("evaluate")}>Item Scanner</button>
              <button onClick={() => onNavigate("learn")}>Hazard Education</button>
            </div>

            <div className="footer-col">
              <h4>Statutory Compliance</h4>
              <span className="footer-compliance-pill">
                <ShieldCheck size={14} className="text-primary" />
                E-Waste Rules, 2022
              </span>
              <span className="footer-compliance-pill">
                <ShieldCheck size={14} className="text-primary" />
                421 CPCB/SPCB Units
              </span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 E-Cycle India • Smart India Hackathon (SIH1392) Responsible Electronics Initiative.</p>
          <div className="footer-disclaimer">
            Platform reward credits are internal incentives and not statutory government Green Credits.
          </div>
        </div>
      </div>

      <style>{`
        .footer-root {
          background: var(--bg-surface);
          border-top: 1px solid var(--border-subtle);
          padding: 48px 20px 24px 20px;
          margin-top: auto;
        }
        .footer-container {
          max-width: 1440px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 36px;
        }
        .footer-top {
          display: flex;
          justify-content: space-between;
          gap: 40px;
          flex-wrap: wrap;
        }
        .footer-brand {
          max-width: 380px;
        }
        .footer-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 1.1rem;
          margin-bottom: 12px;
        }
        .footer-tagline {
          font-size: 0.875rem;
          color: var(--text-muted);
          line-height: 1.6;
        }
        .footer-links-grid {
          display: flex;
          gap: 48px;
          flex-wrap: wrap;
        }
        .footer-col {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .footer-col h4 {
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }
        .footer-col button {
          text-align: left;
          font-size: 0.875rem;
          color: var(--text-muted);
          transition: color var(--transition-fast);
        }
        .footer-col button:hover {
          color: var(--primary);
        }
        .footer-compliance-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
          background: var(--bg-muted);
          padding: 6px 12px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-card);
        }
        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          padding-top: 24px;
          border-top: 1px solid var(--border-subtle);
          font-size: 0.8rem;
          color: var(--text-dim);
        }
      `}</style>
    </footer>
  );
}

import React from "react";
import { Info } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      num: 1,
      title: "Claim Device",
      desc: "Select your exact device from our composition catalog (e.g. Apple iPhone 13) to see its recoverable materials."
    },
    {
      num: 2,
      title: "AI Camera Scan",
      desc: "Capture physical device proof. AI vision validates hardware markers and camera layout to detect mismatches."
    },
    {
      num: 3,
      title: "Get Estimated Credits & QR",
      desc: "Receive your estimated credits breakdown and unique recycling transaction QR token for facility drop-off."
    },
    {
      num: 4,
      title: "Physical Facility Acceptance",
      desc: "Authorized recycler scans QR, accepts device, and officially awards verified, redeemable platform credits."
    }
  ];

  return (
    <section className="how-it-works-section">
      <div className="glass-card how-card">
        <h2 className="how-title">How the Anti-Fraud Credit Cycle Works</h2>
        <p className="how-subtitle">A transparent, verified 4-step pipeline from claim to official credit issuance.</p>

        <div className="steps-grid">
          {steps.map((s) => (
            <div key={s.num} className="step-card">
              <div className="step-num-bubble">{s.num}</div>
              <h4 className="step-heading">{s.title}</h4>
              <p className="step-text">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Legal Disclaimer Box */}
        <div className="legal-banner">
          <Info size={18} className="text-primary flex-shrink-0" />
          <span>
            <strong>Legal Notice:</strong> Platform reward credits are internal incentives for the SIH1392 initiative and are not government-issued statutory EPR certificates or statutory Green Credits.
          </span>
        </div>
      </div>

      <style>{`
        .how-it-works-section {
          margin: 40px 0;
        }
        .how-card {
          padding: 40px;
        }
        .how-title {
          font-size: 1.75rem;
          text-align: center;
          margin-bottom: 8px;
        }
        .how-subtitle {
          text-align: center;
          color: var(--text-secondary);
          margin-bottom: 36px;
        }
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 32px;
        }
        .step-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-lg);
          padding: 24px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .step-num-bubble {
          width: 42px;
          height: 42px;
          border-radius: var(--radius-full);
          background: var(--primary-light);
          color: var(--primary);
          border: 1px solid var(--primary-border);
          font-weight: 800;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }
        .step-heading {
          font-size: 1.05rem;
          margin-bottom: 8px;
        }
        .step-text {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .legal-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--bg-muted);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-md);
          padding: 14px 18px;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        @media (max-width: 1024px) {
          .steps-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .steps-grid {
            grid-template-columns: 1fr;
          }
          .how-card {
            padding: 24px 16px;
          }
        }
      `}</style>
    </section>
  );
}

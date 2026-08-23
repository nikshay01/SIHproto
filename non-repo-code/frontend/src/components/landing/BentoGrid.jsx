import React from "react";
import { Camera, MapPin, Building2, Wallet, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

export default function BentoGrid({ onNavigate }) {
  return (
    <section className="bento-section">
      <div className="bento-grid">
        {/* Card 1: AI Device Verification (Featured Large) */}
        <div className="glass-card bento-card bento-featured" onClick={() => onNavigate("verify")}>
          <div className="bento-tag">
            <Sparkles size={13} />
            <span>Featured Core Flow</span>
          </div>
          <div className="bento-icon-box bg-emerald-light">
            <Camera size={26} className="text-primary" />
          </div>
          <h3 className="bento-title">AI Forensic Device Verification</h3>
          <p className="bento-desc">
            Claim your exact device model and verify its physical authenticity with camera AI to prevent fraudulent mismatch claims and generate an official drop-off QR token.
          </p>
          <div className="bento-link">
            <span>Start Optical Verification</span>
            <ArrowRight size={16} />
          </div>
        </div>

        {/* Card 2: 421 Authorized Facilities */}
        <div className="glass-card bento-card" onClick={() => onNavigate("locate")}>
          <div className="bento-icon-box bg-teal-light">
            <MapPin size={24} className="text-secondary" />
          </div>
          <h3 className="bento-title">421 Authorized Units</h3>
          <p className="bento-desc">
            Explore nationwide CPCB & SPCB registered recyclers, dismantlers, refurbishers, and collection centers with live GPS routing.
          </p>
          <div className="bento-link">
            <span>Explore Map</span>
            <ArrowRight size={16} />
          </div>
        </div>

        {/* Card 3: Facility Portal */}
        <div className="glass-card bento-card" onClick={() => onNavigate("facility")}>
          <div className="bento-icon-box bg-gold-light">
            <Building2 size={24} className="text-amber-500" />
          </div>
          <h3 className="bento-title">Facility Inspection Portal</h3>
          <p className="bento-desc">
            Registered recyclers scan drop-off QR codes to physically inspect and confirm devices, immediately unlocking verified reward credits.
          </p>
          <div className="bento-link">
            <span>Facility Terminal</span>
            <ArrowRight size={16} />
          </div>
        </div>

        {/* Card 4: Wallet & Rewards */}
        <div className="glass-card bento-card" onClick={() => onNavigate("wallet")}>
          <div className="bento-icon-box bg-muted-icon">
            <Wallet size={24} className="text-primary" />
          </div>
          <h3 className="bento-title">Credits & Rewards Wallet</h3>
          <p className="bento-desc">
            Track Estimated vs Verified Credits, monitor transaction ledgers, and redeem available credits for partner vouchers and eco-perks.
          </p>
          <div className="bento-link">
            <span>View My Wallet</span>
            <ArrowRight size={16} />
          </div>
        </div>
      </div>

      <style>{`
        .bento-section {
          margin: 40px 0;
        }
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .bento-card {
          padding: 28px;
          display: flex;
          flex-direction: column;
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }
        .bento-card:hover .bento-link {
          color: var(--primary);
          transform: translateX(4px);
        }
        .bento-featured {
          grid-column: span 3;
          background: linear-gradient(135deg, var(--bg-card) 0%, var(--primary-light) 100%);
        }
        .bento-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--primary-light);
          color: var(--primary);
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: var(--radius-full);
          width: fit-content;
          margin-bottom: 16px;
        }
        .bento-icon-box {
          width: 52px;
          height: 52px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
        }
        .bg-emerald-light { background: var(--primary-light); }
        .bg-teal-light { background: var(--secondary-light); }
        .bg-gold-light { background: var(--accent-gold-light); }
        .bg-muted-icon { background: var(--bg-muted); }
        .bento-title {
          font-size: 1.3rem;
          margin-bottom: 10px;
        }
        .bento-desc {
          font-size: 0.925rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 24px;
          flex: 1;
        }
        .bento-link {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-primary);
          transition: all var(--transition-fast);
        }
        @media (max-width: 1024px) {
          .bento-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .bento-featured {
            grid-column: span 2;
          }
        }
        @media (max-width: 640px) {
          .bento-grid {
            grid-template-columns: 1fr;
          }
          .bento-featured {
            grid-column: span 1;
          }
        }
      `}</style>
    </section>
  );
}

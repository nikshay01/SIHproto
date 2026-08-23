import React, { useState } from "react";
import {
  Wallet,
  Clock,
  CheckCircle2,
  Gift,
  Coins,
  Ticket,
  Copy,
  Check,
  RotateCw,
  Info
} from "lucide-react";
import TransactionLedger from "./TransactionLedger.jsx";
import RewardsStoreModal from "./RewardsStoreModal.jsx";
import { useWallet } from "../../context/WalletContext.jsx";

export default function WalletDashboard({ onOpenReceipt }) {
  const {
    estimatedCredits,
    verifiedCredits,
    redeemedCredits,
    availableCredits,
    redemptions,
    refreshWallet,
    loading
  } = useWallet();

  const [rewardsModalOpen, setRewardsModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="wallet-dashboard-root">
      {/* Header */}
      <div className="wallet-header-row">
        <div>
          <div className="badge badge-emerald text-xs mb-2">
            <Coins size={14} />
            <span>Eco Rewards Ledger</span>
          </div>
          <h2>E-Waste Credits & Rewards Wallet</h2>
          <p className="text-sm text-muted">
            Track your platform reward credits earned from verified e-waste disposal and redeem partner perks.
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={refreshWallet} disabled={loading}>
          <RotateCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Sync Wallet</span>
        </button>
      </div>

      {/* 4-Metric Balances Grid */}
      <div className="balances-grid">
        {/* Estimated Credits */}
        <div className="glass-card balance-card">
          <div className="balance-card-head">
            <Clock size={18} className="text-amber-500" />
            <span className="balance-title">Estimated Credits</span>
          </div>
          <div className="balance-value font-mono">{estimatedCredits}</div>
          <span className="balance-sub">Pending physical facility acceptance</span>
        </div>

        {/* Verified Credits */}
        <div className="glass-card balance-card">
          <div className="balance-card-head">
            <CheckCircle2 size={18} className="text-emerald-500" />
            <span className="balance-title">Verified Credits</span>
          </div>
          <div className="balance-value font-mono text-emerald-500">{verifiedCredits}</div>
          <span className="balance-sub">Physically verified by authorized recyclers</span>
        </div>

        {/* Redeemed Credits */}
        <div className="glass-card balance-card">
          <div className="balance-card-head">
            <Gift size={18} className="text-teal-500" />
            <span className="balance-title">Redeemed Credits</span>
          </div>
          <div className="balance-value font-mono text-teal-500">{redeemedCredits}</div>
          <span className="balance-sub">Used for vouchers & eco-rewards</span>
        </div>

        {/* Available Credits */}
        <div className="glass-card balance-card balance-highlight">
          <div className="balance-card-head">
            <Wallet size={18} className="text-primary" />
            <span className="balance-title">Available to Redeem</span>
          </div>
          <div className="balance-value font-mono text-primary">{availableCredits}</div>
          <button
            className="btn btn-primary btn-sm mt-2"
            onClick={() => setRewardsModalOpen(true)}
            disabled={availableCredits <= 0}
          >
            <Gift size={14} />
            <span>Redeem Credits</span>
          </button>
        </div>
      </div>

      {/* Active Vouchers Card */}
      {redemptions && redemptions.length > 0 && (
        <div className="glass-card vouchers-card">
          <div className="flex items-center gap-2 mb-3">
            <Ticket size={18} className="text-secondary" />
            <h4>Active Partner Vouchers ({redemptions.length})</h4>
          </div>

          <div className="vouchers-grid">
            {redemptions.map((r, idx) => (
              <div key={idx} className="voucher-item-box font-mono">
                <div className="voucher-left">
                  <span className="voucher-title">{r.rewardTitle}</span>
                  <div className="coupon-code-pill font-bold text-primary">
                    {r.couponCode}
                  </div>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleCopy(r.couponCode)}
                  title="Copy Code"
                >
                  {copiedCode === r.couponCode ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                  <span>{copiedCode === r.couponCode ? "Copied" : "Copy"}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History Ledger */}
      <TransactionLedger onOpenReceipt={onOpenReceipt} />

      {/* Legal Notice */}
      <div className="legal-banner">
        <Info size={16} className="text-primary flex-shrink-0" />
        <span>
          <strong>Legal Disclaimer:</strong> Platform reward credits are internal incentives for the SIH1392 initiative and are not government-issued statutory EPR certificates or statutory Green Credits.
        </span>
      </div>

      {/* Rewards Store Modal */}
      <RewardsStoreModal
        isOpen={rewardsModalOpen}
        onClose={() => setRewardsModalOpen(false)}
      />

      <style>{`
        .wallet-dashboard-root {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .wallet-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .balances-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .balance-card {
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .balance-highlight {
          background: linear-gradient(135deg, var(--bg-card) 0%, var(--primary-light) 100%);
          border-color: var(--primary-border);
        }
        .balance-card-head {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .balance-title {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
        }
        .balance-value {
          font-size: 2.2rem;
          font-weight: 800;
          line-height: 1.1;
        }
        .balance-sub {
          font-size: 0.75rem;
          color: var(--text-dim);
        }
        .vouchers-card {
          padding: 24px;
        }
        .vouchers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 12px;
        }
        .voucher-item-box {
          background: var(--bg-muted);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-md);
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .voucher-title {
          font-size: 0.825rem;
          font-family: var(--font-sans);
          font-weight: 600;
          color: var(--text-primary);
        }
        .coupon-code-pill {
          font-size: 0.95rem;
        }
        @media (max-width: 1024px) {
          .balances-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .balances-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

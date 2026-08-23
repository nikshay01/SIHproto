import React, { useState } from "react";
import { X, Gift, Leaf, Ticket, Zap, CheckCircle2, Copy, Check } from "lucide-react";
import { redeemCredits } from "../../services/api.js";
import { useWallet } from "../../context/WalletContext.jsx";
import confetti from "canvas-confetti";

export default function RewardsStoreModal({ isOpen, onClose }) {
  const { userId, availableCredits, refreshWallet } = useWallet();
  const [redeeming, setRedeeming] = useState(false);
  const [successRedemption, setSuccessRedemption] = useState(null);
  const [error, setError] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const rewardCatalog = [
    {
      id: "plant-tree",
      title: "Plant 1 Native Tree",
      desc: "Partner NGO certified reforestation carbon offset certificate.",
      cost: 30,
      icon: Leaf,
      badgeColor: "badge-emerald"
    },
    {
      id: "voucher-100",
      title: "₹100 Eco Partner Voucher",
      desc: "Valid on sustainable electronics, phone cases & accessories.",
      cost: 50,
      icon: Ticket,
      badgeColor: "badge-teal"
    },
    {
      id: "voucher-250",
      title: "₹250 Green Energy Discount",
      desc: "Solar gadget coupon & certified refurbished tech discount.",
      cost: 100,
      icon: Zap,
      badgeColor: "badge-gold"
    }
  ];

  const handleRedeem = async (reward) => {
    if (availableCredits < reward.cost) {
      setError(`Insufficient available credits. You have ${availableCredits} credits, but need ${reward.cost}.`);
      return;
    }

    setRedeeming(true);
    setError(null);

    try {
      const res = await redeemCredits({
        userId,
        amount: reward.cost,
        rewardId: reward.id,
        rewardTitle: reward.title
      });

      if (res.ok && res.redemption) {
        setSuccessRedemption(res.redemption);
        try {
          confetti({ particleCount: 80, spread: 90, origin: { y: 0.5 } });
        } catch (e) {}
        await refreshWallet();
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to redeem credits");
    } finally {
      setRedeeming(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-container-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Gift className="text-primary" size={22} />
            <div>
              <h3 className="text-lg">Redeem Platform Credits</h3>
              <p className="text-xs text-muted">
                Available: <strong className="text-primary font-mono">{availableCredits} Credits</strong>
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body space-y-4">
          {error && (
            <div className="error-alert-banner">
              <span>{error}</span>
            </div>
          )}

          {successRedemption ? (
            <div className="success-redemption-box">
              <CheckCircle2 size={36} className="text-emerald-500 mb-2" />
              <h4>Congratulations! Voucher Generated</h4>
              <p className="text-xs text-muted mb-3">{successRedemption.rewardTitle}</p>

              <div className="coupon-display-box font-mono">
                <span>{successRedemption.couponCode}</span>
                <button
                  className="btn-copy-code"
                  onClick={() => handleCopyCode(successRedemption.couponCode)}
                  title="Copy Coupon Code"
                >
                  {copiedCode ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                </button>
              </div>

              <p className="text-xs text-muted mt-3">
                This coupon code has been added to your Active Vouchers drawer.
              </p>

              <button
                className="btn btn-secondary btn-sm mt-4"
                onClick={() => setSuccessRedemption(null)}
              >
                Redeem Another Perk
              </button>
            </div>
          ) : (
            <div className="rewards-grid">
              {rewardCatalog.map((r) => {
                const Icon = r.icon;
                const canAfford = availableCredits >= r.cost;

                return (
                  <div key={r.id} className="reward-card glass-card">
                    <div className="flex items-center justify-between mb-2">
                      <div className="reward-icon-box">
                        <Icon size={20} className="text-primary" />
                      </div>
                      <span className="reward-cost font-mono">
                        <strong>{r.cost}</strong> Credits
                      </span>
                    </div>

                    <h4 className="reward-title">{r.title}</h4>
                    <p className="reward-desc">{r.desc}</p>

                    <button
                      className={`btn btn-sm ${canAfford ? "btn-primary" : "btn-secondary"}`}
                      disabled={!canAfford || redeeming}
                      onClick={() => handleRedeem(r)}
                    >
                      {canAfford ? "Redeem Now" : "Insufficient Credits"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>

      <style>{`
        .rewards-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }
        .reward-card {
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .reward-icon-box {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-sm);
          background: var(--primary-light);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .reward-cost {
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--primary);
        }
        .reward-title {
          font-size: 1.05rem;
        }
        .reward-desc {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.4;
          margin-bottom: 6px;
        }
        .success-redemption-box {
          background: var(--bg-muted);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-lg);
          padding: 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .coupon-display-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--bg-surface);
          border: 1px solid var(--primary-border);
          padding: 8px 18px;
          border-radius: var(--radius-md);
          font-size: 1.3rem;
          font-weight: 800;
          color: var(--primary);
        }
        .btn-copy-code {
          padding: 4px;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}

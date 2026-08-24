import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  X,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Award,
  Leaf,
  Sparkles,
  Edit3,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Wallet,
  TrendingUp,
  Cpu,
  Save
} from "lucide-react";

export default function ProfileModal({ onNavigate }) {
  const {
    user,
    profileModalOpen,
    closeProfileModal,
    updateProfile,
    logout
  } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    street: user?.address?.street || "",
    city: user?.address?.city || "",
    state: user?.address?.state || "",
    pincode: user?.address?.pincode || ""
  });
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!profileModalOpen || !user) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSaveSuccess(false);

    const res = await updateProfile(formData);
    setLoading(false);
    if (res.success) {
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setErrorMsg(res.error);
    }
  };

  const handleGoToWallet = () => {
    closeProfileModal();
    if (onNavigate) onNavigate("wallet");
  };

  const ecoStats = user.ecoStats || {
    devicesRecycled: 4,
    co2SavedKg: 48.6,
    preciousMetalsSavedGrams: 14.8,
    pickupsCompleted: 2,
    eprCertificatesGenerated: 2
  };

  const badges = user.badges && user.badges.length > 0 ? user.badges : [
    {
      id: "b1",
      name: "Eco Pioneer",
      tier: "Silver",
      description: "First device responsibly verified & diverted from landfill."
    },
    {
      id: "b2",
      name: "Verified Citizen",
      tier: "Gold",
      description: "Full KYC identity verified for official EPR credit minting."
    }
  ];

  return (
    <div className="modal-overlay animate-fadeIn" onClick={closeProfileModal}>
      <div
        className="modal-container profile-modal-card animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="profile-header">
          <div className="profile-hero">
            <div className="profile-avatar-wrapper">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-fallback">
                  {user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="profile-badge-pill">
                <ShieldCheck size={12} />
                <span>{user.kycStatus === "verified" ? "Verified" : "Citizen"}</span>
              </div>
            </div>

            <div className="profile-hero-meta">
              <div className="profile-name-row">
                <h2 className="profile-name">{user.name}</h2>
                <span className="profile-role-tag">{user.role?.toUpperCase() || "CITIZEN"}</span>
              </div>
              <p className="profile-email">
                <Mail size={13} />
                <span>{user.email}</span>
              </p>
              <div className="profile-meta-tags">
                <span className="profile-id-tag">ID: {user.userId}</span>
                <span className="profile-loc-tag">
                  <MapPin size={12} />
                  <span>{user.address?.city ? `${user.address.city}, ${user.address.state || "India"}` : "India"}</span>
                </span>
              </div>
            </div>
          </div>

          <button
            className="profile-close-btn"
            onClick={closeProfileModal}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Feedback Messages */}
        {saveSuccess && (
          <div className="profile-alert profile-alert-success animate-fadeIn">
            <CheckCircle2 size={16} />
            <span>Profile information updated successfully.</span>
          </div>
        )}

        {errorMsg && (
          <div className="profile-alert profile-alert-error animate-fadeIn">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Eco Impact KPI Dashboard */}
        <div className="profile-kpi-section">
          <div className="profile-section-title">
            <TrendingUp size={15} className="text-secondary" />
            <span>National Circular Economy Impact</span>
          </div>
          <div className="profile-kpi-grid">
            <div className="profile-kpi-card">
              <div className="profile-kpi-val">{ecoStats.devicesRecycled || 0}</div>
              <div className="profile-kpi-lbl">Devices Recycled</div>
            </div>
            <div className="profile-kpi-card">
              <div className="profile-kpi-val text-primary">{ecoStats.co2SavedKg || 0} kg</div>
              <div className="profile-kpi-lbl">CO₂ Emissions Diverted</div>
            </div>
            <div className="profile-kpi-card">
              <div className="profile-kpi-val">{ecoStats.preciousMetalsSavedGrams || 0} g</div>
              <div className="profile-kpi-lbl">Metals Recovered</div>
            </div>
            <div className="profile-kpi-card">
              <div className="profile-kpi-val">{ecoStats.eprCertificatesGenerated || 0}</div>
              <div className="profile-kpi-lbl">EPR Certificates</div>
            </div>
          </div>
        </div>

        {/* Badges & Recognitions */}
        <div className="profile-badges-section">
          <div className="profile-section-title">
            <Award size={15} className="text-secondary" />
            <span>Earned Statutory Badges ({badges.length})</span>
          </div>
          <div className="profile-badges-list">
            {badges.map((b, idx) => (
              <div key={b.id || idx} className={`profile-badge-card tier-${b.tier?.toLowerCase() || "bronze"}`}>
                <div className="profile-badge-icon">
                  <Leaf size={16} />
                </div>
                <div className="profile-badge-text">
                  <div className="profile-badge-head">
                    <span className="profile-badge-name">{b.name}</span>
                    <span className="profile-badge-tier">{b.tier || "Bronze"}</span>
                  </div>
                  <p className="profile-badge-desc">{b.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Profile Info / Edit Form */}
        <div className="profile-details-section">
          <div className="profile-section-header">
            <div className="profile-section-title">
              <UserIcon size={15} className="text-secondary" />
              <span>Contact & Address Profile</span>
            </div>
            <button
              type="button"
              className="profile-edit-toggle"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit3 size={13} />
              <span>{isEditing ? "Cancel" : "Edit Profile"}</span>
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleSave} className="profile-edit-form">
              <div className="profile-form-grid">
                <div className="profile-input-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="profile-input-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="profile-input-group full-width">
                  <label>Street Address</label>
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  />
                </div>
                <div className="profile-input-group">
                  <label>City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="profile-input-group">
                  <label>State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
                <div className="profile-input-group">
                  <label>PIN Code</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="profile-save-btn"
              >
                <Save size={15} />
                <span>{loading ? "Saving Changes..." : "Save Profile Details"}</span>
              </button>
            </form>
          ) : (
            <div className="profile-info-grid">
              <div className="profile-info-item">
                <span className="profile-info-lbl">Phone</span>
                <span className="profile-info-val">{user.phone || "Not provided"}</span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-lbl">City / State</span>
                <span className="profile-info-val">
                  {user.address?.city || user.address?.state
                    ? `${user.address?.city || ""} ${user.address?.state || ""}`.trim()
                    : "Not specified"}
                </span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-lbl">PIN Code</span>
                <span className="profile-info-val">{user.address?.pincode || "Not provided"}</span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-lbl">Account Status</span>
                <span className="profile-info-val text-primary">Active & Compliant</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="profile-footer-actions">
          <button
            type="button"
            className="profile-wallet-nav-btn"
            onClick={handleGoToWallet}
          >
            <Wallet size={15} />
            <span>Open Wallet Dashboard</span>
          </button>

          <button
            type="button"
            className="profile-logout-btn"
            onClick={logout}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Component Styles */}
        <style>{`
          .profile-modal-card {
            max-width: 620px;
            padding: 28px;
            background: var(--bg-surface);
            border: 1px solid var(--border-card);
            border-radius: var(--radius-xl);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }

          .profile-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 24px;
            padding-bottom: 18px;
            border-bottom: 1px solid var(--border-subtle);
          }

          .profile-hero {
            display: flex;
            align-items: center;
            gap: 18px;
          }

          .profile-avatar-wrapper {
            position: relative;
          }

          .profile-avatar-img {
            width: 68px;
            height: 68px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid var(--color-primary);
          }

          .profile-avatar-fallback {
            width: 68px;
            height: 68px;
            border-radius: 50%;
            background: linear-gradient(135deg, rgba(163, 177, 138, 0.3), rgba(88, 129, 87, 0.4));
            color: var(--color-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.4rem;
            font-weight: 700;
            border: 2px solid var(--color-primary);
          }

          .profile-badge-pill {
            position: absolute;
            bottom: -6px;
            left: 50%;
            transform: translateX(-50%);
            background: #0c0d0f;
            color: var(--color-primary);
            border: 1px solid var(--color-primary);
            border-radius: 999px;
            padding: 2px 8px;
            font-size: 0.65rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
          }

          .profile-hero-meta {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .profile-name-row {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .profile-name {
            font-size: 1.35rem;
            font-weight: 700;
            color: var(--text-primary);
            margin: 0;
            letter-spacing: -0.02em;
          }

          .profile-role-tag {
            background: rgba(163, 177, 138, 0.15);
            color: var(--color-primary);
            font-size: 0.68rem;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 4px;
            letter-spacing: 0.05em;
          }

          .profile-email {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.84rem;
            color: var(--text-muted);
            margin: 0;
          }

          .profile-meta-tags {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-top: 4px;
          }

          .profile-id-tag {
            font-size: 0.72rem;
            font-family: monospace;
            color: var(--text-dim);
            background: var(--bg-surface-elevated);
            padding: 2px 6px;
            border-radius: 4px;
          }

          .profile-loc-tag {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 0.76rem;
            color: var(--text-muted);
          }

          .profile-close-btn {
            background: var(--bg-surface-elevated);
            border: 1px solid var(--border-subtle);
            color: var(--text-muted);
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .profile-close-btn:hover {
            color: var(--text-primary);
            border-color: var(--border-focus);
            transform: scale(1.05);
          }

          .profile-alert {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 14px;
            border-radius: var(--radius-md);
            font-size: 0.82rem;
            margin-bottom: 18px;
          }

          .profile-alert-success {
            background: rgba(34, 197, 94, 0.1);
            color: #22c55e;
            border: 1px solid rgba(34, 197, 94, 0.25);
          }

          .profile-alert-error {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.25);
          }

          .profile-section-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.82rem;
            font-weight: 700;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 12px;
          }

          .profile-kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 22px;
          }

          .profile-kpi-card {
            background: var(--bg-surface-elevated);
            border: 1px solid var(--border-subtle);
            padding: 12px 10px;
            border-radius: var(--radius-md);
            text-align: center;
          }

          .profile-kpi-val {
            font-size: 1.15rem;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 4px;
          }

          .profile-kpi-lbl {
            font-size: 0.68rem;
            color: var(--text-dim);
            line-height: 1.25;
          }

          .profile-badges-list {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 22px;
          }

          .profile-badge-card {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            padding: 10px 12px;
            background: var(--bg-surface-elevated);
            border: 1px solid var(--border-subtle);
            border-radius: var(--radius-md);
          }

          .profile-badge-card.tier-gold {
            border-color: rgba(234, 179, 8, 0.3);
            background: rgba(234, 179, 8, 0.04);
          }

          .profile-badge-card.tier-silver {
            border-color: rgba(148, 163, 184, 0.3);
          }

          .profile-badge-icon {
            width: 28px;
            height: 28px;
            border-radius: 6px;
            background: rgba(163, 177, 138, 0.15);
            color: var(--color-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .profile-badge-text {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .profile-badge-head {
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .profile-badge-name {
            font-size: 0.82rem;
            font-weight: 600;
            color: var(--text-primary);
          }

          .profile-badge-tier {
            font-size: 0.65rem;
            font-weight: 700;
            padding: 1px 5px;
            border-radius: 4px;
            background: var(--bg-surface);
            color: var(--text-muted);
          }

          .profile-badge-desc {
            font-size: 0.72rem;
            color: var(--text-dim);
            margin: 0;
            line-height: 1.3;
          }

          .profile-details-section {
            margin-bottom: 22px;
            background: var(--bg-surface-elevated);
            padding: 16px;
            border-radius: var(--radius-lg);
            border: 1px solid var(--border-subtle);
          }

          .profile-section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
          }

          .profile-section-header .profile-section-title {
            margin-bottom: 0;
          }

          .profile-edit-toggle {
            display: flex;
            align-items: center;
            gap: 6px;
            background: none;
            border: none;
            color: var(--color-primary);
            font-size: 0.78rem;
            font-weight: 600;
            cursor: pointer;
          }

          .profile-edit-toggle:hover {
            text-decoration: underline;
          }

          .profile-info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          .profile-info-item {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .profile-info-lbl {
            font-size: 0.72rem;
            color: var(--text-dim);
            text-transform: uppercase;
          }

          .profile-info-val {
            font-size: 0.86rem;
            font-weight: 500;
            color: var(--text-primary);
          }

          .profile-form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          .profile-input-group {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .profile-input-group.full-width {
            grid-column: span 2;
          }

          .profile-input-group label {
            font-size: 0.72rem;
            color: var(--text-secondary);
            font-weight: 600;
          }

          .profile-input-group input {
            padding: 8px 10px;
            background: var(--bg-surface);
            border: 1px solid var(--border-subtle);
            border-radius: var(--radius-sm);
            color: var(--text-primary);
            font-size: 0.84rem;
            outline: none;
          }

          .profile-input-group input:focus {
            border-color: var(--color-primary);
          }

          .profile-save-btn {
            margin-top: 12px;
            padding: 10px 16px;
            background: var(--color-primary);
            color: #0c0d0f;
            border: none;
            border-radius: var(--radius-md);
            font-weight: 700;
            font-size: 0.86rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            cursor: pointer;
            width: 100%;
          }

          .profile-footer-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            padding-top: 14px;
            border-top: 1px solid var(--border-subtle);
          }

          .profile-wallet-nav-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 16px;
            background: var(--bg-surface-elevated);
            border: 1px solid var(--border-card);
            border-radius: var(--radius-md);
            color: var(--text-primary);
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .profile-wallet-nav-btn:hover {
            border-color: var(--color-primary);
            color: var(--color-primary);
          }

          .profile-logout-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 16px;
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.25);
            border-radius: var(--radius-md);
            color: #ef4444;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .profile-logout-btn:hover {
            background: rgba(239, 68, 68, 0.2);
            transform: translateY(-1px);
          }

          @media (max-width: 600px) {
            .profile-modal-card {
              padding: 18px;
            }
            .profile-kpi-grid {
              grid-template-columns: 1fr 1fr;
            }
            .profile-badges-list {
              grid-template-columns: 1fr;
            }
            .profile-form-grid {
              grid-template-columns: 1fr;
            }
            .profile-input-group.full-width {
              grid-column: span 1;
            }
            .profile-footer-actions {
              flex-direction: column;
            }
            .profile-wallet-nav-btn, .profile-logout-btn {
              width: 100%;
              justify-content: center;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

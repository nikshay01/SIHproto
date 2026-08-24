import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  MapPin,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";

export default function AuthModal() {
  const {
    authModalOpen,
    closeAuthModal,
    authModalTab,
    setAuthModalTab,
    login,
    register
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!authModalOpen) return null;

  const handleTabSwitch = (tab) => {
    setAuthModalTab(tab);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleQuickLogin = async (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setLoading(true);
    setErrorMsg("");
    const res = await login(demoEmail, demoPass);
    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    if (authModalTab === "signin") {
      const res = await login(email, password);
      setLoading(false);
      if (!res.success) {
        setErrorMsg(res.error);
      }
    } else {
      if (password.length < 6) {
        setLoading(false);
        setErrorMsg("Password must be at least 6 characters.");
        return;
      }
      const res = await register({
        name,
        email,
        password,
        phone,
        city
      });
      setLoading(false);
      if (!res.success) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg(res.message || "Account created successfully!");
      }
    }
  };

  return (
    <div className="modal-overlay animate-fadeIn" onClick={closeAuthModal}>
      <div
        className="modal-container auth-modal-card animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="auth-header">
          <div className="auth-header-info">
            <div className="auth-badge">
              <Sparkles size={14} className="text-secondary" />
              <span>National E-Waste Network</span>
            </div>
            <h2 className="auth-title">
              {authModalTab === "signin" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="auth-subtitle">
              {authModalTab === "signin"
                ? "Sign in to access your recycling wallet, verified certificates & pickups."
                : "Join the verified national circular economy and claim +150 Eco-Credits."}
            </p>
          </div>
          <button
            className="auth-close-btn"
            onClick={closeAuthModal}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${authModalTab === "signin" ? "active" : ""}`}
            onClick={() => handleTabSwitch("signin")}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${authModalTab === "signup" ? "active" : ""}`}
            onClick={() => handleTabSwitch("signup")}
          >
            Sign Up <span className="auth-tab-chip">+150 Pts</span>
          </button>
        </div>

        {/* Error / Success Feedback */}
        {errorMsg && (
          <div className="auth-alert auth-alert-error animate-fadeIn">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="auth-alert auth-alert-success animate-fadeIn">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="auth-form">
          {authModalTab === "signup" && (
            <div className="auth-input-group">
              <label className="auth-label">Full Name</label>
              <div className="auth-input-wrapper">
                <UserIcon size={16} className="auth-input-icon" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="auth-input"
                />
              </div>
            </div>
          )}

          <div className="auth-input-group">
            <label className="auth-label">Email Address</label>
            <div className="auth-input-wrapper">
              <Mail size={16} className="auth-input-icon" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
              />
            </div>
          </div>

          {authModalTab === "signup" && (
            <div className="auth-input-row">
              <div className="auth-input-group">
                <label className="auth-label">Mobile Number</label>
                <div className="auth-input-wrapper">
                  <Phone size={16} className="auth-input-icon" />
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="auth-input"
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label className="auth-label">City / State</label>
                <div className="auth-input-wrapper">
                  <MapPin size={16} className="auth-input-icon" />
                  <input
                    type="text"
                    placeholder="New Delhi"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="auth-input"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="auth-input-group">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrapper">
              <Lock size={16} className="auth-input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-submit-btn"
          >
            {loading ? (
              <span className="auth-btn-spinner" />
            ) : (
              <>
                <span>{authModalTab === "signin" ? "Sign In to Account" : "Create My Account"}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* SIH Hackathon Demo Quick Login Buttons */}
        <div className="auth-quick-demo">
          <div className="auth-demo-divider">
            <span>Or test with demo profiles</span>
          </div>
          <div className="auth-demo-grid">
            <button
              type="button"
              className="auth-demo-card"
              onClick={() => handleQuickLogin("demo@elocate.in", "password123")}
              disabled={loading}
            >
              <div className="auth-demo-avatar">PS</div>
              <div className="auth-demo-text">
                <span className="auth-demo-name">Priya Sharma</span>
                <span className="auth-demo-role">Citizen (500 Credits • 3 Badges)</span>
              </div>
            </button>

            <button
              type="button"
              className="auth-demo-card"
              onClick={() => handleQuickLogin("admin@elocate.in", "admin123")}
              disabled={loading}
            >
              <div className="auth-demo-avatar auth-demo-avatar-admin">RV</div>
              <div className="auth-demo-text">
                <span className="auth-demo-name">Dr. Rajesh Verma</span>
                <span className="auth-demo-role">CPCB Officer (Admin Access)</span>
              </div>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="auth-footer-notice">
          <ShieldCheck size={14} className="text-secondary" />
          <span>256-Bit Encrypted • Statutory CPCB Compliance Rules, 2022</span>
        </div>

        {/* Component-scoped CSS */}
        <style>{`
          .auth-modal-card {
            max-width: 480px;
            padding: 28px;
            background: var(--bg-surface);
            border: 1px solid var(--border-card);
            border-radius: var(--radius-xl);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
          }

          .auth-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
          }

          .auth-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: rgba(163, 177, 138, 0.12);
            color: var(--color-primary);
            padding: 4px 10px;
            border-radius: 999px;
            font-size: 0.72rem;
            font-weight: 600;
            margin-bottom: 8px;
            border: 1px solid rgba(163, 177, 138, 0.25);
          }

          .auth-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text-primary);
            margin: 0 0 6px 0;
            letter-spacing: -0.02em;
          }

          .auth-subtitle {
            font-size: 0.84rem;
            color: var(--text-muted);
            margin: 0;
            line-height: 1.45;
          }

          .auth-close-btn {
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
            flex-shrink: 0;
          }

          .auth-close-btn:hover {
            color: var(--text-primary);
            border-color: var(--border-focus);
            transform: scale(1.05);
          }

          .auth-tabs {
            display: flex;
            background: var(--bg-surface-elevated);
            padding: 4px;
            border-radius: var(--radius-md);
            margin-bottom: 20px;
            border: 1px solid var(--border-subtle);
          }

          .auth-tab-btn {
            flex: 1;
            padding: 8px 14px;
            background: transparent;
            border: none;
            color: var(--text-muted);
            font-weight: 600;
            font-size: 0.85rem;
            border-radius: var(--radius-sm);
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
          }

          .auth-tab-btn.active {
            background: var(--bg-surface);
            color: var(--text-primary);
            box-shadow: 0 2px 6px rgba(0,0,0,0.12);
          }

          .auth-tab-chip {
            background: rgba(163, 177, 138, 0.2);
            color: var(--color-primary);
            font-size: 0.7rem;
            padding: 2px 6px;
            border-radius: 999px;
            font-weight: 700;
          }

          .auth-alert {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 14px;
            border-radius: var(--radius-md);
            font-size: 0.82rem;
            margin-bottom: 16px;
          }

          .auth-alert-error {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.25);
          }

          .auth-alert-success {
            background: rgba(34, 197, 94, 0.1);
            color: #22c55e;
            border: 1px solid rgba(34, 197, 94, 0.25);
          }

          .auth-form {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }

          .auth-input-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          .auth-input-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .auth-label {
            font-size: 0.78rem;
            font-weight: 600;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }

          .auth-input-wrapper {
            position: relative;
            display: flex;
            align-items: center;
          }

          .auth-input-icon {
            position: absolute;
            left: 12px;
            color: var(--text-dim);
            pointer-events: none;
          }

          .auth-input {
            width: 100%;
            padding: 10px 12px 10px 38px;
            background: var(--bg-surface-elevated);
            border: 1px solid var(--border-subtle);
            border-radius: var(--radius-md);
            color: var(--text-primary);
            font-size: 0.88rem;
            outline: none;
            transition: all 0.2s ease;
          }

          .auth-input:focus {
            border-color: var(--color-primary);
            background: var(--bg-surface);
            box-shadow: 0 0 0 3px rgba(163, 177, 138, 0.15);
          }

          .auth-eye-btn {
            position: absolute;
            right: 10px;
            background: none;
            border: none;
            color: var(--text-dim);
            cursor: pointer;
            display: flex;
            align-items: center;
          }

          .auth-eye-btn:hover {
            color: var(--text-primary);
          }

          .auth-submit-btn {
            margin-top: 6px;
            padding: 12px 16px;
            background: var(--color-primary);
            color: #0c0d0f;
            border: none;
            border-radius: var(--radius-md);
            font-weight: 700;
            font-size: 0.92rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .auth-submit-btn:hover:not(:disabled) {
            opacity: 0.92;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(163, 177, 138, 0.3);
          }

          .auth-submit-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .auth-btn-spinner {
            width: 18px;
            height: 18px;
            border: 2px solid rgba(0,0,0,0.2);
            border-top-color: #0c0d0f;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .auth-quick-demo {
            margin-top: 20px;
            padding-top: 16px;
            border-top: 1px solid var(--border-subtle);
          }

          .auth-demo-divider {
            text-align: center;
            margin-bottom: 12px;
          }

          .auth-demo-divider span {
            font-size: 0.72rem;
            color: var(--text-dim);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-weight: 600;
          }

          .auth-demo-grid {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .auth-demo-card {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 12px;
            background: var(--bg-surface-elevated);
            border: 1px solid var(--border-subtle);
            border-radius: var(--radius-md);
            cursor: pointer;
            text-align: left;
            transition: all 0.2s ease;
          }

          .auth-demo-card:hover {
            border-color: var(--color-primary);
            background: var(--bg-surface-card);
            transform: translateX(2px);
          }

          .auth-demo-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: rgba(163, 177, 138, 0.2);
            color: var(--color-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.78rem;
            flex-shrink: 0;
          }

          .auth-demo-avatar-admin {
            background: rgba(59, 130, 246, 0.2);
            color: #3b82f6;
          }

          .auth-demo-text {
            display: flex;
            flex-direction: column;
            gap: 2px;
            overflow: hidden;
          }

          .auth-demo-name {
            font-size: 0.84rem;
            font-weight: 600;
            color: var(--text-primary);
          }

          .auth-demo-role {
            font-size: 0.72rem;
            color: var(--text-muted);
          }

          .auth-footer-notice {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            margin-top: 18px;
            font-size: 0.72rem;
            color: var(--text-dim);
          }

          @media (max-width: 480px) {
            .auth-modal-card {
              padding: 20px;
            }
            .auth-input-row {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

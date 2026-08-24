import React, { useState } from "react";
import {
  Recycle,
  Home,
  MapPin,
  Camera,
  Building2,
  Wallet,
  Cpu,
  Leaf,
  LocateFixed,
  Sun,
  Moon,
  Download,
  Menu,
  X,
  Activity,
  User as UserIcon,
  LogIn,
  ShieldCheck
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useLocation } from "../../context/LocationContext.jsx";
import { useWallet } from "../../context/WalletContext.jsx";
import { useFacilities } from "../../context/FacilityContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Navbar({ activeSection, onNavigate, onOpenMetrics }) {
  const { theme, toggleTheme, isDark } = useTheme();
  const { requestLocation, locationLabel, loadingLocation, hasLocation } = useLocation();
  const { userId } = useWallet();
  const { facilities } = useFacilities();
  const { user, isAuthenticated, openAuthModal, openProfileModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "landing", label: "Home", icon: Home },
    { id: "locate", label: "Locate", icon: MapPin },
    { id: "verify", label: "Verify Device", icon: Camera, highlight: true },
    { id: "facility", label: "Facility Portal", icon: Building2 },
    { id: "wallet", label: "My Wallet", icon: Wallet },
    { id: "evaluate", label: "Evaluate", icon: Cpu },
    { id: "nearest", label: "Nearest Facilities", icon: MapPin },
    { id: "learn", label: "Learn", icon: Leaf }
  ];

  const handleNavClick = (sectionId) => {
    onNavigate(sectionId);
    setMobileMenuOpen(false);
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(facilities, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ecycle_facilities_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <header className="navbar-root">
      <div className="navbar-container">
        {/* Brand */}
        <div className="navbar-brand" onClick={() => handleNavClick("landing")} role="button" tabIndex={0}>
          <div className="brand-icon-box">
            <Recycle size={22} className="text-secondary" />
          </div>
          <div className="brand-text-group">
            <span className="brand-title">e locate</span>
            <span className="brand-subtitle">National E-Waste Circular Hub</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="navbar-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`nav-item-btn ${isActive ? "active" : ""} ${item.highlight ? "highlighted" : ""}`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="navbar-actions">
          {/* User Auth Profile Pill or Sign In Button */}
          {isAuthenticated && user ? (
            <button
              className="user-profile-nav-pill"
              onClick={openProfileModal}
              title="View Eco-Profile & Badges"
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="user-nav-avatar" />
              ) : (
                <div className="user-nav-avatar-fallback">
                  {user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="user-nav-name">{user.name.split(" ")[0]}</span>
              <ShieldCheck size={13} className="text-secondary" />
            </button>
          ) : (
            <button
              className="btn-signin-nav"
              onClick={() => openAuthModal("signin")}
              title="Sign In / Register"
            >
              <LogIn size={15} />
              <span>Sign In</span>
            </button>
          )}

          {/* Near Me GPS Trigger */}
          <button
            className={`btn-icon ${hasLocation ? "btn-icon-active" : ""}`}
            onClick={requestLocation}
            title={locationLabel || "Sort facilities by GPS proximity"}
            disabled={loadingLocation}
          >
            <LocateFixed size={18} className={loadingLocation ? "animate-spin" : ""} />
          </button>

          {/* Location Badge */}
          {locationLabel && (
            <div className="location-pill">
              <MapPin size={13} />
              <span>{locationLabel}</span>
            </div>
          )}

          {/* System Architecture & Telemetry Modal Trigger */}
          <button
            className="btn-icon navbar-desktop-only"
            onClick={onOpenMetrics}
            title="Inspect System Design Architecture (Cluster, 6 Shards, Cache)"
          >
            <Activity size={18} />
          </button>

          {/* Theme Toggle */}
          <button className="btn-icon" onClick={toggleTheme} title="Toggle Dark / Light Theme">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Export Dataset */}
          <button className="btn-icon navbar-desktop-only" onClick={handleExportData} title="Export current facility records as JSON">
            <Download size={18} />
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            className="btn-icon mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-drawer">
          {/* Mobile User Profile Section */}
          <div className="mobile-user-box">
            {isAuthenticated && user ? (
              <div className="mobile-user-profile-card" onClick={() => { openProfileModal(); setMobileMenuOpen(false); }}>
                <div className="user-nav-avatar-fallback">
                  {user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="mobile-user-meta">
                  <div className="mobile-user-name">{user.name}</div>
                  <div className="mobile-user-email">{user.email}</div>
                </div>
                <button className="mobile-view-profile-btn">Profile</button>
              </div>
            ) : (
              <button
                className="mobile-signin-btn"
                onClick={() => { openAuthModal("signin"); setMobileMenuOpen(false); }}
              >
                <LogIn size={16} />
                <span>Sign In / Create Account</span>
              </button>
            )}
          </div>

          <div className="mobile-drawer-links">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`mobile-nav-btn ${isActive ? "active" : ""}`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        .navbar-root {
          position: sticky;
          top: 0;
          z-index: 100;
          background: var(--bg-surface);
          border-bottom: 1px solid var(--border-subtle);
          backdrop-filter: var(--glass-blur);
          -webkit-backdrop-filter: var(--glass-blur);
          height: 68px;
          display: flex;
          align-items: center;
        }
        .navbar-container {
          width: 100%;
          max-width: 1440px;
          margin: 0 auto;
          padding: 0 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          user-select: none;
          flex-shrink: 0;
        }
        .brand-icon-box {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-md);
          background: var(--primary-light);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--primary-border);
          flex-shrink: 0;
        }
        .brand-text-group {
          display: flex;
          flex-direction: column;
        }
        .brand-title {
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 1.15rem;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          line-height: 1.1;
        }
        .brand-subtitle {
          font-size: 0.72rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        .navbar-links {
          display: flex;
          align-items: center;
          gap: 4px;
          background: var(--bg-muted);
          padding: 4px 6px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-subtle);
          overflow-x: auto;
        }
        .nav-item-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: var(--radius-full);
          font-size: 0.86rem;
          font-weight: 600;
          color: var(--text-secondary);
          transition: all var(--transition-fast);
          white-space: nowrap;
        }
        .nav-item-btn:hover {
          color: var(--text-primary);
          background: var(--bg-hover);
        }
        .nav-item-btn.active {
          background: var(--bg-surface-elevated);
          color: var(--primary);
          box-shadow: var(--shadow-sm);
        }
        .nav-item-btn.highlighted {
          color: var(--primary);
        }
        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .wallet-pill-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--primary-light);
          border: 1px solid var(--primary-border);
          padding: 6px 12px;
          border-radius: var(--radius-full);
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--primary);
          transition: transform var(--transition-fast);
          white-space: nowrap;
        }
        .wallet-pill-btn:hover {
          transform: translateY(-1px);
        }
        .wallet-pill-lbl {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        .location-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          background: var(--bg-muted);
          border: 1px solid var(--border-card);
          padding: 6px 12px;
          border-radius: var(--radius-full);
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
          max-width: 160px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .user-profile-nav-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 10px 4px 6px;
          background: var(--bg-surface-elevated);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: all 0.2s ease;
          color: var(--text-primary);
        }
        .user-profile-nav-pill:hover {
          border-color: var(--color-primary);
          background: var(--bg-surface-card);
          transform: translateY(-1px);
        }
        .user-nav-avatar {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          object-fit: cover;
        }
        .user-nav-avatar-fallback {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: rgba(163, 177, 138, 0.25);
          color: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.72rem;
          font-weight: 700;
          flex-shrink: 0;
        }
        .user-nav-name {
          font-size: 0.84rem;
          font-weight: 600;
          max-width: 90px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .btn-signin-nav {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: var(--color-primary);
          color: #0c0d0f;
          border: none;
          border-radius: var(--radius-full);
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-signin-nav:hover {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(163, 177, 138, 0.25);
        }
        .mobile-user-box {
          padding-bottom: 12px;
          margin-bottom: 12px;
          border-bottom: 1px solid var(--border-subtle);
        }
        .mobile-user-profile-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: var(--bg-surface-elevated);
          border-radius: var(--radius-md);
          cursor: pointer;
        }
        .mobile-user-meta {
          flex: 1;
          overflow: hidden;
        }
        .mobile-user-name {
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .mobile-user-email {
          font-size: 0.74rem;
          color: var(--text-dim);
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .mobile-view-profile-btn {
          padding: 4px 10px;
          background: var(--color-primary);
          color: #0c0d0f;
          border: none;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 700;
        }
        .mobile-signin-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px;
          background: var(--color-primary);
          color: #0c0d0f;
          border: none;
          border-radius: var(--radius-md);
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
        }
        .mobile-menu-toggle {
          display: none;
        }
        .mobile-drawer {
          display: none;
        }
        .navbar-desktop-only {
          display: flex;
        }
        @media (max-width: 1024px) {
          .navbar-links {
            display: none;
          }
          .mobile-menu-toggle {
            display: flex;
          }
          .mobile-drawer {
            display: block;
            position: absolute;
            top: 68px;
            left: 0;
            right: 0;
            background: var(--bg-surface-elevated);
            border-bottom: 1px solid var(--border-card);
            box-shadow: var(--shadow-lg);
            padding: 16px 20px;
            animation: slideUp 200ms ease-out;
            max-height: calc(100vh - 68px);
            overflow-y: auto;
          }
          .mobile-drawer-links {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .mobile-nav-btn {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            border-radius: var(--radius-md);
            font-size: 0.95rem;
            font-weight: 600;
            color: var(--text-primary);
            background: var(--bg-muted);
            width: 100%;
          }
          .mobile-nav-btn.active {
            background: var(--primary-light);
            color: var(--primary);
            border: 1px solid var(--primary-border);
          }
          /* Hide location pill on tablet/mobile to save space */
          .location-pill {
            display: none;
          }
          /* Hide export & metrics buttons on mobile */
          .navbar-desktop-only {
            display: none;
          }
        }
        @media (max-width: 640px) {
          .navbar-root {
            height: 60px;
          }
          .mobile-drawer {
            top: 60px;
            max-height: calc(100vh - 60px);
          }
          .navbar-container {
            padding: 0 16px;
            gap: 8px;
          }
          .brand-title {
            font-size: 1rem;
          }
          .brand-subtitle {
            display: none;
          }
          .wallet-pill-lbl {
            display: none;
          }
          .wallet-pill-btn {
            padding: 6px 10px;
            font-size: 0.8rem;
          }
          .navbar-actions {
            gap: 5px;
          }
        }
        @media (max-width: 380px) {
          .navbar-container {
            padding: 0 12px;
            gap: 6px;
          }
          .brand-icon-box {
            width: 32px;
            height: 32px;
          }
          .wallet-pill-btn {
            padding: 5px 8px;
            font-size: 0.75rem;
          }
        }
      `}</style>
    </header>
  );
}

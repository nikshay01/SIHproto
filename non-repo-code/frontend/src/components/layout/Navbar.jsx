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
  Coins,
  LocateFixed,
  Sun,
  Moon,
  Download,
  Menu,
  X,
  Activity
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useLocation } from "../../context/LocationContext.jsx";
import { useWallet } from "../../context/WalletContext.jsx";
import { useFacilities } from "../../context/FacilityContext.jsx";

export default function Navbar({ activeSection, onNavigate, onOpenMetrics }) {
  const { theme, toggleTheme, isDark } = useTheme();
  const { requestLocation, locationLabel, loadingLocation, hasLocation } = useLocation();
  const { availableCredits } = useWallet();
  const { facilities } = useFacilities();
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
        <div className="navbar-brand" onClick={() => handleNavClick("landing")}>
          <div className="brand-icon-box">
            <Recycle className="brand-icon" size={22} />
          </div>
          <div className="brand-text-group">
            <span className="brand-title">Eco-Locate</span>
            <span className="brand-subtitle">E-Cycle India</span>
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
          {/* Live Wallet Credits Pill */}
          <button
            className="wallet-pill-btn"
            onClick={() => handleNavClick("wallet")}
            title="Available Reward Credits"
          >
            <Coins size={16} className="text-secondary" />
            <span className="wallet-pill-val">{availableCredits}</span>
            <span className="wallet-pill-lbl">Credits</span>
          </button>

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
            className="btn-icon"
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
          <button className="btn-icon" onClick={handleExportData} title="Export current facility records as JSON">
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
        .btn-icon-active {
          background: var(--primary-light) !important;
          color: var(--primary) !important;
          border-color: var(--primary-border) !important;
        }
        .mobile-menu-toggle {
          display: none;
        }
        .mobile-drawer {
          display: none;
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
          }
          .mobile-nav-btn.active {
            background: var(--primary-light);
            color: var(--primary);
            border: 1px solid var(--primary-border);
          }
        }
      `}</style>
    </header>
  );
}

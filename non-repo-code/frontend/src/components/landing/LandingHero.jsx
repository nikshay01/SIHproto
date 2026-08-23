import React, { useState } from "react";
import { Camera, MapPin, Search, ShieldCheck, ArrowRight } from "lucide-react";
import { useFacilities } from "../../context/FacilityContext.jsx";

export default function LandingHero({ onNavigate }) {
  const { setSearchQuery } = useFacilities();
  const [localSearch, setLocalSearch] = useState("");

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (localSearch.trim()) {
      setSearchQuery(localSearch.trim());
      onNavigate("locate");
    }
  };

  return (
    <section className="hero-section">
      <div className="hero-badge">
        <ShieldCheck size={16} className="text-primary" />
        <span>AI-Verified Responsible E-Waste Ecosystem</span>
      </div>

      <h1 className="hero-title">
        Your Old Tech Has a <span className="text-gradient">Future.</span>
      </h1>

      <p className="hero-subtitle">
        Prevent e-waste fraud with computer vision verification, discover 421+ authorized facilities nationwide, and earn reward credits when recycling certified electronics.
      </p>

      <div className="hero-cta-group">
        <button className="btn btn-primary btn-lg" onClick={() => onNavigate("verify")}>
          <Camera size={20} />
          <span>Verify & Recycle Device</span>
        </button>
        <button className="btn btn-secondary btn-lg" onClick={() => onNavigate("locate")}>
          <MapPin size={20} />
          <span>Find Nearby Facilities</span>
        </button>
      </div>

      {/* Global Hero Search */}
      <form className="hero-search-box" onSubmit={handleSearchSubmit}>
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Search facilities by name, district, or state..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="search-btn">
          <span>Search</span>
          <ArrowRight size={16} />
        </button>
      </form>

      <style>{`
        .hero-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 48px 0 32px 0;
          max-width: 860px;
          margin: 0 auto;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--primary-light);
          border: 1px solid var(--primary-border);
          color: var(--primary);
          padding: 6px 16px;
          border-radius: var(--radius-full);
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 24px;
        }
        .hero-title {
          font-size: 3.5rem;
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 18px;
          letter-spacing: -0.03em;
        }
        .text-gradient {
          background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-subtitle {
          font-size: 1.15rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 32px;
          max-width: 680px;
        }
        .hero-cta-group {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          justify-content: center;
          margin-bottom: 36px;
        }
        .hero-search-box {
          display: flex;
          align-items: center;
          width: 100%;
          max-width: 580px;
          background: var(--bg-surface);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-full);
          padding: 6px 8px 6px 18px;
          box-shadow: var(--shadow-md);
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
        }
        .hero-search-box:focus-within {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 4px var(--primary-light);
        }
        .search-icon {
          color: var(--text-muted);
          flex-shrink: 0;
          margin-right: 10px;
        }
        .search-input {
          flex: 1;
          border: none;
          background: transparent;
          color: var(--text-primary);
          font-size: 0.95rem;
          outline: none;
        }
        .search-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--primary);
          color: #ffffff;
          font-weight: 600;
          font-size: 0.9rem;
          padding: 8px 18px;
          border-radius: var(--radius-full);
          transition: background var(--transition-fast);
        }
        .search-btn:hover {
          background: var(--primary-hover);
        }
        @media (max-width: 768px) {
          .hero-title {
            font-size: 2.35rem;
          }
          .hero-subtitle {
            font-size: 1rem;
          }
          .hero-cta-group {
            width: 100%;
          }
          .hero-cta-group .btn {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
}

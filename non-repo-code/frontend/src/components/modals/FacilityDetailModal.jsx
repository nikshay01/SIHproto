import React, { useState } from "react";
import {
  X,
  Building,
  Bookmark,
  MapPin,
  Phone,
  Mail,
  Globe,
  User,
  ExternalLink,
  Truck,
  Copy,
  Check,
  ShieldCheck,
  Navigation,
  Recycle,
  AlertTriangle,
  Sparkles,
  Layers,
  Cpu,
  BatteryCharging
} from "lucide-react";
import { formatDistance, getGoogleMapsUrl } from "../../services/geoUtils.js";
import { useFacilities } from "../../context/FacilityContext.jsx";

export default function FacilityDetailModal({ facility, isOpen, onClose, onBookPickup }) {
  const { toggleBookmark, isBookmarked } = useFacilities();
  const [copiedKey, setCopiedKey] = useState(null);

  if (!isOpen || !facility) return null;

  const fid = facility.id || facility.facilityId;
  const saved = isBookmarked(fid);
  const dist = formatDistance(facility.distanceKm ?? facility.distance_km);
  const gmapsUrl = getGoogleMapsUrl(
    facility.name,
    facility.address,
    facility.location?.latitude,
    facility.location?.longitude
  );

  const acceptedTypes = facility.acceptedEwasteTypes || facility.accepted_ewaste_types || [
    "Smartphones & Tablets",
    "Laptops & Computers",
    "Cables & Circuit Boards",
    "Batteries & Power Banks",
    "Televisions & Monitory Displays"
  ];

  const acceptedCats = facility.acceptedCategories || facility.accepted_categories || ["ITEW", "CEEW", "Batteries"];
  const hazardousHandled = facility.hazardousMaterialsHandled || facility.hazardous_materials_handled || ["Lead", "PCBs", "Lithium"];
  const specializations = facility.specializations || ["Statutory Authorized Recycling Under E-Waste Rules 2022"];

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="modal-overlay animate-fadeIn" onClick={onClose}>
      <div className="modal-container modal-container-lg animate-slideUp" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-emerald">{facility.type}</span>
              <button
                className={`btn-bookmark-modal ${saved ? "saved" : ""}`}
                onClick={() => toggleBookmark(fid)}
                title={saved ? "Remove from saved" : "Save facility"}
              >
                <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
              </button>
            </div>
            <h3 className="modal-main-title">{facility.name}</h3>
            <p className="modal-auth-pill">
              <ShieldCheck size={14} className="text-primary" />
              <span>{facility.authorizationBy || "SPCB / CPCB Authorized Unit"}</span>
            </p>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Modal Body */}
        <div className="modal-body space-y-6">
          {/* Main Info Grid */}
          <div className="modal-info-grid">
            {/* Left: Operational Specs */}
            <div className="info-section-card">
              <h4>Regulatory & Operational Specs</h4>
              <div className="info-row">
                <span className="info-k">Facility ID</span>
                <span className="info-v font-mono">{fid}</span>
              </div>
              <div className="info-row">
                <span className="info-k">Annual Capacity</span>
                <strong className="info-v font-mono">{(facility.capacityMta || facility.capacity_mta || 0).toLocaleString()} MTA</strong>
              </div>
              <div className="info-row">
                <span className="info-k">Regulatory Compliance</span>
                <span className="info-v text-xs">{facility.regulatoryCompliance || "E-Waste Rules, 2022"}</span>
              </div>
              <div className="info-row">
                <span className="info-k">District & State</span>
                <span className="info-v">{facility.district ? `${facility.district}, ` : ""}{facility.state}</span>
              </div>
              <div className="info-row">
                <span className="info-k">Full Address</span>
                <span className="info-v text-xs">{facility.address}</span>
              </div>
              {dist && (
                <div className="info-row">
                  <span className="info-k">Proximity Distance</span>
                  <span className="info-v font-bold text-primary">{dist}</span>
                </div>
              )}
            </div>

            {/* Right: Contact Information */}
            <div className="info-section-card">
              <h4>Official Contact Directory</h4>
              
              <div className="info-row">
                <span className="info-k">Phone</span>
                <div className="flex items-center gap-2">
                  <span className="info-v font-mono">{facility.contact?.phone || "N/A"}</span>
                  {facility.contact?.phone && (
                    <button
                      className="btn-copy-sm"
                      onClick={() => handleCopy(facility.contact.phone, "phone")}
                      title="Copy phone"
                    >
                      {copiedKey === "phone" ? <Check size={13} className="text-primary" /> : <Copy size={13} />}
                    </button>
                  )}
                </div>
              </div>

              <div className="info-row">
                <span className="info-k">Toll-Free</span>
                <span className="info-v font-mono">{facility.contact?.tollFree || "N/A"}</span>
              </div>

              <div className="info-row">
                <span className="info-k">Email Address</span>
                <div className="flex items-center gap-2">
                  <span className="info-v text-xs">{facility.contact?.email || "N/A"}</span>
                  {facility.contact?.email && (
                    <button
                      className="btn-copy-sm"
                      onClick={() => handleCopy(facility.contact.email, "email")}
                      title="Copy email"
                    >
                      {copiedKey === "email" ? <Check size={13} className="text-primary" /> : <Copy size={13} />}
                    </button>
                  )}
                </div>
              </div>

              <div className="info-row">
                <span className="info-k">Official Website</span>
                {facility.contact?.website && facility.contact.website !== "N/A" ? (
                  <a
                    href={facility.contact.website.startsWith("http") ? facility.contact.website : `https://${facility.contact.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="info-v text-primary flex items-center gap-1 hover:underline text-xs"
                  >
                    <span>Visit Website</span>
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  <span className="info-v text-muted">N/A</span>
                )}
              </div>

              <div className="info-row">
                <span className="info-k">Contact Officer</span>
                <span className="info-v text-xs">{facility.contact?.contactPerson || "Operations / EHS Manager"}</span>
              </div>
            </div>
          </div>

          {/* Dedicated Section: Accepted E-Waste Types & Streams */}
          <div className="info-section-card full-width-card">
            <div className="section-head-with-badge">
              <div className="flex items-center gap-2">
                <Recycle size={18} className="text-primary" />
                <h4>Accepted E-Waste Streams & Authorized Scope</h4>
              </div>
              <div className="cpcb-category-chips">
                {acceptedCats.map((cat, idx) => (
                  <span key={idx} className="cpcb-cat-badge">
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            <div className="accepted-items-grid">
              {acceptedTypes.map((item, idx) => (
                <div key={idx} className="accepted-item-card">
                  <div className="accepted-item-bullet" />
                  <span className="accepted-item-text">{item}</span>
                </div>
              ))}
            </div>

            {/* Specializations & Hazardous Handling Sub-Row */}
            <div className="facility-safety-row">
              <div className="safety-block">
                <div className="safety-head">
                  <Sparkles size={14} className="text-primary" />
                  <span>Technical Specializations</span>
                </div>
                <div className="safety-tags-list">
                  {specializations.map((spec, idx) => (
                    <span key={idx} className="specialization-tag">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              <div className="safety-block">
                <div className="safety-head">
                  <AlertTriangle size={14} className="text-secondary" />
                  <span>Safe Hazardous Materials Processing</span>
                </div>
                <div className="safety-tags-list">
                  {hazardousHandled.map((haz, idx) => (
                    <span key={idx} className="hazard-safe-tag">
                      ✓ {haz}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="modal-footer">
          <a
            href={gmapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            <Navigation size={16} />
            <span>Open in Google Maps</span>
          </a>

          <button
            className="btn btn-secondary"
            onClick={() => {
              onClose();
              if (onBookPickup) onBookPickup(facility);
            }}
          >
            <Truck size={16} />
            <span>Schedule Doorstep Pickup</span>
          </button>
        </div>

        <style>{`
          .btn-bookmark-modal {
            background: var(--bg-surface-elevated);
            border: 1px solid var(--border-subtle);
            color: var(--text-muted);
            width: 28px;
            height: 28px;
            border-radius: var(--radius-sm);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all var(--transition-fast);
          }
          .btn-bookmark-modal:hover, .btn-bookmark-modal.saved {
            color: var(--accent-gold);
            border-color: var(--accent-gold);
          }
          .modal-title-group {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .modal-main-title {
            font-size: 1.25rem;
            font-weight: 800;
            color: var(--text-primary);
          }
          .modal-auth-pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 0.8rem;
            color: var(--primary);
            font-weight: 600;
          }
          .modal-info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          .info-section-card {
            background: var(--bg-surface-elevated);
            border: 1px solid var(--border-card);
            border-radius: var(--radius-lg);
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .full-width-card {
            grid-column: span 2;
          }
          .info-section-card h4 {
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-muted);
            font-weight: 700;
            border-bottom: 1px solid var(--border-subtle);
            padding-bottom: 8px;
            margin: 0;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
            font-size: 0.85rem;
          }
          .info-k {
            color: var(--text-muted);
            flex-shrink: 0;
          }
          .info-v {
            color: var(--text-primary);
            text-align: right;
            word-break: break-word;
          }
          .btn-copy-sm {
            background: var(--bg-surface);
            border: 1px solid var(--border-subtle);
            border-radius: var(--radius-sm);
            padding: 2px 6px;
            color: var(--text-muted);
            cursor: pointer;
          }
          .section-head-with-badge {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 10px;
            border-bottom: 1px solid var(--border-subtle);
            padding-bottom: 8px;
          }
          .section-head-with-badge h4 {
            border-bottom: none;
            padding-bottom: 0;
          }
          .cpcb-category-chips {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;
          }
          .cpcb-cat-badge {
            background: rgba(163, 177, 138, 0.15);
            color: var(--color-primary);
            font-size: 0.7rem;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 999px;
            border: 1px solid rgba(163, 177, 138, 0.25);
          }
          .accepted-items-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 8px;
            margin-top: 4px;
          }
          .accepted-item-card {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: var(--bg-surface);
            border: 1px solid var(--border-subtle);
            border-radius: var(--radius-md);
          }
          .accepted-item-bullet {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--color-primary);
            flex-shrink: 0;
          }
          .accepted-item-text {
            font-size: 0.82rem;
            font-weight: 500;
            color: var(--text-primary);
          }
          .facility-safety-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
            margin-top: 10px;
            padding-top: 12px;
            border-top: 1px solid var(--border-subtle);
          }
          .safety-block {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .safety-head {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.76rem;
            font-weight: 700;
            color: var(--text-secondary);
            text-transform: uppercase;
          }
          .safety-tags-list {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
          }
          .specialization-tag {
            font-size: 0.72rem;
            background: var(--bg-surface);
            border: 1px solid var(--border-subtle);
            color: var(--text-primary);
            padding: 3px 8px;
            border-radius: 4px;
          }
          .hazard-safe-tag {
            font-size: 0.72rem;
            background: rgba(34, 197, 94, 0.1);
            border: 1px solid rgba(34, 197, 94, 0.25);
            color: #22c55e;
            padding: 3px 8px;
            border-radius: 4px;
            font-weight: 600;
          }
          @media (max-width: 640px) {
            .modal-info-grid {
              grid-template-columns: 1fr;
            }
            .full-width-card {
              grid-column: span 1;
            }
            .facility-safety-row {
              grid-template-columns: 1fr;
            }
            .accepted-items-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

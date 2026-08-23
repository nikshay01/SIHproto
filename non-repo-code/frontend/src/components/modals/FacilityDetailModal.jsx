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
  Navigation
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

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-container-lg" onClick={(e) => e.stopPropagation()}>
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
              <span>{facility.authorizationBy || "SPCB / CPCB Authorized"}</span>
            </p>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body space-y-6">
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
        </div>

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
            <span>Book Doorstep Pickup</span>
          </button>
        </div>
      </div>

      <style>{`
        .modal-title-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .modal-main-title {
          font-size: 1.3rem;
        }
        .btn-bookmark-modal {
          color: var(--text-muted);
          padding: 4px;
        }
        .btn-bookmark-modal.saved {
          color: var(--accent-gold);
        }
        .modal-auth-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        .modal-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .info-section-card {
          background: var(--bg-muted);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-md);
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .info-section-card h4 {
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          font-size: 0.85rem;
          padding: 6px 0;
          border-bottom: 1px solid var(--border-subtle);
        }
        .info-k {
          color: var(--text-muted);
          flex-shrink: 0;
        }
        .info-v {
          text-align: right;
          word-break: break-word;
        }
        .btn-copy-sm {
          color: var(--text-muted);
          padding: 2px;
        }
        @media (max-width: 768px) {
          .modal-info-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

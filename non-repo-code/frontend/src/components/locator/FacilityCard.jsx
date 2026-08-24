import React from "react";
import { Bookmark, MapPin, Building, Phone, ExternalLink, Navigation, CheckCircle2 } from "lucide-react";
import { formatDistance, getGoogleMapsUrl } from "../../services/geoUtils.js";

export default function FacilityCard({ facility, isSaved, onToggleSave, onSelect, onOpenDetail }) {
  const getTypeBadgeClass = (type) => {
    switch (type) {
      case "Recycler": return "badge-emerald";
      case "Dismantler": return "badge-teal";
      case "Refurbisher": return "badge-gold";
      case "Collection Center": return "badge-muted";
      default: return "badge-emerald";
    }
  };

  const distFormatted = formatDistance(facility.distanceKm ?? facility.distance_km);
  const gmapsUrl = getGoogleMapsUrl(
    facility.name,
    facility.address,
    facility.location?.latitude,
    facility.location?.longitude
  );

  const acceptedTypes = facility.acceptedEwasteTypes || facility.accepted_ewaste_types || [];

  return (
    <div
      className="glass-card facility-card"
      onClick={() => {
        if (onSelect) onSelect(facility);
      }}
    >
      <div className="card-top-row">
        <span className={`badge ${getTypeBadgeClass(facility.type)}`}>
          {facility.type}
        </span>
        
        <div className="card-top-actions">
          {distFormatted && (
            <span className="distance-pill">
              <Navigation size={11} />
              {distFormatted}
            </span>
          )}
          <button
            className={`btn-bookmark ${isSaved ? "saved" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(facility.id || facility.facilityId);
            }}
            title={isSaved ? "Remove from saved" : "Save facility"}
          >
            <Bookmark size={15} fill={isSaved ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      <h4 className="facility-title">{facility.name}</h4>
      
      <p className="facility-address">
        <MapPin size={14} className="flex-shrink-0 text-muted" />
        <span>{facility.district ? `${facility.district}, ` : ""}{facility.state}</span>
      </p>

      {/* Accepted E-Waste Streams Preview */}
      {acceptedTypes.length > 0 && (
        <div className="accepted-chips-preview">
          <span className="accepted-chips-label">Accepts:</span>
          {acceptedTypes.slice(0, 2).map((item, idx) => (
            <span key={idx} className="accepted-chip-tag">
              {item}
            </span>
          ))}
          {acceptedTypes.length > 2 && (
            <span className="accepted-chip-more">
              +{acceptedTypes.length - 2} more
            </span>
          )}
        </div>
      )}

      <div className="facility-meta-row">
        <div className="capacity-stat">
          <span className="stat-k">Capacity</span>
          <span className="stat-v font-mono">{(facility.capacityMta || facility.capacity_mta || 0).toLocaleString()} MTA</span>
        </div>

        <div className="card-btn-group">
          <a
            href={gmapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="card-mini-btn"
            onClick={(e) => e.stopPropagation()}
            title="Open in Google Maps"
          >
            <ExternalLink size={14} />
          </a>
          <button
            className="btn btn-secondary btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenDetail) onOpenDetail(facility);
            }}
          >
            Details
          </button>
        </div>
      </div>

      <style>{`
        .facility-card {
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          cursor: pointer;
        }
        .card-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .card-top-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .distance-pill {
          display: flex;
          align-items: center;
          gap: 4px;
          background: var(--primary-light);
          color: var(--primary);
          font-size: 0.75rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: var(--radius-full);
        }
        .btn-bookmark {
          color: var(--text-muted);
          padding: 4px;
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
        }
        .btn-bookmark:hover, .btn-bookmark.saved {
          color: var(--accent-gold);
        }
        .facility-title {
          font-size: 1.05rem;
          font-weight: 700;
          line-height: 1.3;
        }
        .facility-address {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        .accepted-chips-preview {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
          padding: 6px 8px;
          background: var(--bg-surface-elevated);
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-subtle);
        }
        .accepted-chips-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-dim);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .accepted-chip-tag {
          font-size: 0.72rem;
          background: rgba(163, 177, 138, 0.12);
          color: var(--color-primary);
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 500;
          white-space: nowrap;
          max-width: 140px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .accepted-chip-more {
          font-size: 0.68rem;
          color: var(--text-muted);
          font-weight: 600;
        }
        .facility-meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 6px;
          border-top: 1px solid var(--border-subtle);
        }
        .capacity-stat {
          display: flex;
          flex-direction: column;
        }
        .stat-k {
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .stat-v {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .card-btn-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .card-mini-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-surface-elevated);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          transition: all var(--transition-fast);
        }
        .card-mini-btn:hover {
          color: var(--text-primary);
          border-color: var(--primary);
        }
      `}</style>
    </div>
  );
}

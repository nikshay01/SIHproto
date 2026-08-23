import React from "react";
import { Bookmark, MapPin, Building, Phone, ExternalLink, Navigation } from "lucide-react";
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
          line-height: 1.4;
        }
        .facility-meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 10px;
          border-top: 1px solid var(--border-subtle);
          margin-top: 4px;
        }
        .capacity-stat {
          display: flex;
          flex-direction: column;
        }
        .stat-k {
          font-size: 0.7rem;
          text-transform: uppercase;
          color: var(--text-muted);
          font-weight: 600;
        }
        .stat-v {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .card-btn-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .card-mini-btn {
          width: 30px;
          height: 30px;
          border-radius: var(--radius-sm);
          background: var(--bg-muted);
          border: 1px solid var(--border-card);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          transition: all var(--transition-fast);
        }
        .card-mini-btn:hover {
          color: var(--primary);
          background: var(--bg-hover);
        }
      `}</style>
    </div>
  );
}

import React from "react";
import { Bookmark, ExternalLink, Download, ArrowUpDown } from "lucide-react";
import { formatDistance, getGoogleMapsUrl } from "../../services/geoUtils.js";
import { useFacilities } from "../../context/FacilityContext.jsx";

export default function DirectoryTable({ onOpenDetail }) {
  const { facilities, toggleBookmark, isBookmarked, sortBy, setSortBy } = useFacilities();

  const handleSortToggle = (field) => {
    if (sortBy === `${field}_asc`) {
      setSortBy(`${field}_desc`);
    } else {
      setSortBy(`${field}_asc`);
    }
  };

  const handleExportCsv = () => {
    const headers = ["ID", "Name", "Type", "District", "State", "Capacity MTA", "Phone", "Email"];
    const rows = facilities.map(f => [
      f.id || f.facilityId,
      `"${(f.name || "").replace(/"/g, '""')}"`,
      f.type,
      `"${(f.district || "").replace(/"/g, '""')}"`,
      `"${(f.state || "").replace(/"/g, '""')}"`,
      f.capacityMta || f.capacity_mta || 0,
      f.contact?.phone || "",
      f.contact?.email || ""
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ecycle_facilities_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="table-view-container glass-card">
      <div className="table-header-row">
        <div>
          <h3>All Authorized Facilities Directory ({facilities.length})</h3>
          <p className="text-xs text-muted">Complete dataset compliant with E-Waste Rules 2022</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={handleExportCsv}>
          <Download size={14} />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="table-responsive-wrapper">
        <table className="facilities-table">
          <thead>
            <tr>
              <th onClick={() => handleSortToggle("name")}>
                <div className="th-content">
                  <span>Facility Name</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th>Type</th>
              <th onClick={() => handleSortToggle("state")}>
                <div className="th-content">
                  <span>State / UT</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th>District</th>
              <th onClick={() => handleSortToggle("capacity")}>
                <div className="th-content">
                  <span>Capacity (MTA)</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th onClick={() => handleSortToggle("distance")}>
                <div className="th-content">
                  <span>Distance</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {facilities.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-muted">
                  No facilities match your search criteria.
                </td>
              </tr>
            ) : (
              facilities.map((f) => {
                const fid = f.id || f.facilityId;
                const saved = isBookmarked(fid);
                const dist = formatDistance(f.distanceKm ?? f.distance_km);
                const gmaps = getGoogleMapsUrl(f.name, f.address, f.location?.latitude, f.location?.longitude);

                return (
                  <tr key={fid} onClick={() => onOpenDetail && onOpenDetail(f)}>
                    <td className="font-semibold text-primary-hover">{f.name}</td>
                    <td>
                      <span className="badge badge-muted text-xs">{f.type}</span>
                    </td>
                    <td>{f.state}</td>
                    <td>{f.district || "--"}</td>
                    <td className="font-mono">{(f.capacityMta || f.capacity_mta || 0).toLocaleString()}</td>
                    <td>
                      {dist ? <span className="text-primary font-semibold text-xs">{dist}</span> : "--"}
                    </td>
                    <td>
                      <div className="table-action-btns" onClick={(e) => e.stopPropagation()}>
                        <button
                          className={`btn-bookmark-sm ${saved ? "saved" : ""}`}
                          onClick={() => toggleBookmark(fid)}
                          title={saved ? "Remove Bookmark" : "Bookmark"}
                        >
                          <Bookmark size={14} fill={saved ? "currentColor" : "none"} />
                        </button>
                        <a
                          href={gmaps}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="table-btn-icon"
                          title="Google Maps Directions"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        .table-view-container {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .table-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .table-responsive-wrapper {
          overflow-x: auto;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
        }
        .facilities-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
          text-align: left;
        }
        .facilities-table th {
          background: var(--bg-muted);
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 12px 16px;
          cursor: pointer;
          user-select: none;
          white-space: nowrap;
        }
        .th-content {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .facilities-table td {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-subtle);
          color: var(--text-primary);
        }
        .facilities-table tbody tr {
          cursor: pointer;
          transition: background var(--transition-fast);
        }
        .facilities-table tbody tr:hover {
          background: var(--bg-hover);
        }
        .table-action-btns {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-bookmark-sm {
          padding: 4px;
          color: var(--text-muted);
          transition: color var(--transition-fast);
        }
        .btn-bookmark-sm.saved {
          color: var(--accent-gold);
        }
        .table-btn-icon {
          color: var(--text-muted);
          padding: 4px;
        }
        .table-btn-icon:hover {
          color: var(--primary);
        }
      `}</style>
    </div>
  );
}

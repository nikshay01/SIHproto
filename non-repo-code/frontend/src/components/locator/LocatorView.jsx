import React, { useState } from "react";
import { Map, Table2, Layers, Loader2 } from "lucide-react";
import FilterSidebar from "./FilterSidebar.jsx";
import FacilityCard from "./FacilityCard.jsx";
import LeafletMap from "./LeafletMap.jsx";
import DirectoryTable from "./DirectoryTable.jsx";
import { useFacilities } from "../../context/FacilityContext.jsx";

export default function LocatorView({ onOpenDetail }) {
  const { facilities, loading, selectedFacility, setSelectedFacility, toggleBookmark, isBookmarked } = useFacilities();
  const [viewMode, setViewMode] = useState("map"); // "map" or "table"

  return (
    <div className="locator-root">
      {/* View Mode Toggle Bar */}
      <div className="locator-header-bar">
        <div>
          <h2 className="locator-main-title">Nationwide Facility Directory</h2>
          <p className="text-sm text-muted">Explore 421 CPCB/SPCB authorized recyclers, dismantlers & collection centers</p>
        </div>

        <div className="view-mode-toggle">
          <button
            className={`toggle-btn ${viewMode === "map" ? "active" : ""}`}
            onClick={() => setViewMode("map")}
          >
            <Map size={16} />
            <span>Map & Cards</span>
          </button>
          <button
            className={`toggle-btn ${viewMode === "table" ? "active" : ""}`}
            onClick={() => setViewMode("table")}
          >
            <Table2 size={16} />
            <span>Table View</span>
          </button>
        </div>
      </div>

      {viewMode === "map" ? (
        <div className="locator-split-layout">
          {/* Left: Filter Sidebar + Cards List */}
          <aside className="locator-sidebar-panel">
            <FilterSidebar />

            <div className="cards-scroll-container">
              <div className="cards-count-label">
                <span>{facilities.length} Facilities Found</span>
                <span className="text-xs text-muted">Click card to zoom map</span>
              </div>

              {loading ? (
                <div className="loading-box">
                  <Loader2 size={24} className="animate-spin text-primary" />
                  <span>Loading facilities...</span>
                </div>
              ) : facilities.length === 0 ? (
                <div className="empty-box">
                  <p className="text-muted text-sm">No facilities match the chosen filters.</p>
                </div>
              ) : (
                <div className="cards-stack">
                  {facilities.map((f) => {
                    const fid = f.id || f.facilityId;
                    return (
                      <FacilityCard
                        key={fid}
                        facility={f}
                        isSaved={isBookmarked(fid)}
                        onToggleSave={toggleBookmark}
                        onSelect={(fac) => setSelectedFacility(fac)}
                        onOpenDetail={(fac) => onOpenDetail && onOpenDetail(fac)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          {/* Right: Leaflet Map */}
          <div className="locator-map-panel">
            <LeafletMap />
          </div>
        </div>
      ) : (
        <DirectoryTable onOpenDetail={onOpenDetail} />
      )}

      <style>{`
        .locator-root {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .locator-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .locator-main-title {
          font-size: 1.75rem;
          margin-bottom: 4px;
        }
        .view-mode-toggle {
          display: flex;
          background: var(--bg-muted);
          border: 1px solid var(--border-card);
          padding: 4px;
          border-radius: var(--radius-full);
          gap: 4px;
        }
        .toggle-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: var(--radius-full);
          font-size: 0.825rem;
          font-weight: 600;
          color: var(--text-secondary);
          transition: all var(--transition-fast);
        }
        .toggle-btn.active {
          background: var(--bg-surface-elevated);
          color: var(--primary);
          box-shadow: var(--shadow-sm);
        }
        .locator-split-layout {
          display: grid;
          grid-template-columns: 420px 1fr;
          gap: 20px;
          height: calc(100vh - 180px);
          min-height: 600px;
        }
        .locator-sidebar-panel {
          display: flex;
          flex-direction: column;
          gap: 16px;
          background: var(--bg-card);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-lg);
          padding: 20px;
          overflow-y: hidden;
        }
        .cards-scroll-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow-y: auto;
          padding-right: 4px;
        }
        .cards-count-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.825rem;
          font-weight: 700;
          color: var(--text-secondary);
        }
        .cards-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .locator-map-panel {
          height: 100%;
          min-height: 520px;
        }
        .loading-box, .empty-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          gap: 10px;
        }
        @media (max-width: 1024px) {
          .locator-split-layout {
            grid-template-columns: 1fr;
            height: auto;
          }
          .locator-map-panel {
            height: 480px;
          }
          .cards-scroll-container {
            max-height: 400px;
          }
        }
        @media (max-width: 768px) {
          .locator-header-bar {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .locator-main-title {
            font-size: 1.4rem;
          }
          .locator-map-panel {
            height: 360px;
          }
          .locator-sidebar-panel {
            padding: 14px;
          }
          .cards-scroll-container {
            max-height: 350px;
          }
        }
        @media (max-width: 480px) {
          .locator-map-panel {
            height: 300px;
          }
          .locator-sidebar-panel {
            padding: 10px;
          }
        }
      `}</style>
    </div>
  );
}

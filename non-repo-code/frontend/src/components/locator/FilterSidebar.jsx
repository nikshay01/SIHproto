import React from "react";
import { Search, RotateCcw, X, Bookmark, Filter } from "lucide-react";
import { useFacilities } from "../../context/FacilityContext.jsx";

export default function FilterSidebar() {
  const {
    statesList,
    selectedState,
    setSelectedState,
    selectedType,
    setSelectedType,
    minCapacity,
    setMinCapacity,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    activeChip,
    setActiveChip,
    typeCounts,
    resetFilters
  } = useFacilities();

  return (
    <div className="filter-sidebar-root">
      {/* Search & Reset */}
      <div className="filter-top-row">
        <div className="sidebar-title-group">
          <Filter size={18} className="text-primary" />
          <h3>Directory Filters</h3>
        </div>
        <button className="btn-text-sm" onClick={resetFilters} title="Reset all filters">
          <RotateCcw size={13} />
          <span>Reset</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="search-wrapper">
        <Search size={16} className="search-icon-sm" />
        <input
          type="text"
          placeholder="Search by name, city, state..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input-sm"
        />
        {searchQuery && (
          <button className="btn-clear-search" onClick={() => setSearchQuery("")}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter Dropdowns Grid */}
      <div className="filter-controls-grid">
        {/* State Dropdown */}
        <div className="input-group">
          <label className="input-label">State / UT</label>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="input-field select-sm"
          >
            <option value="ALL">All States & UTs (36)</option>
            {statesList.map((st) => (
              <option key={st.state} value={st.state}>
                {st.state} ({st.total_facilities})
              </option>
            ))}
          </select>
        </div>

        {/* Type Dropdown */}
        <div className="input-group">
          <label className="input-label">Facility Type</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="input-field select-sm"
          >
            <option value="ALL">All Facility Types</option>
            <option value="Recycler">Recyclers Only</option>
            <option value="Dismantler">Dismantlers Only</option>
            <option value="Refurbisher">Refurbishers Only</option>
            <option value="Collection Center">Collection Centers Only</option>
          </select>
        </div>

        {/* Min Capacity */}
        <div className="input-group">
          <label className="input-label">Min. Capacity</label>
          <select
            value={minCapacity}
            onChange={(e) => setMinCapacity(Number(e.target.value))}
            className="input-field select-sm"
          >
            <option value={0}>Any Capacity</option>
            <option value={1000}>&gt; 1,000 MTA</option>
            <option value={5000}>&gt; 5,000 MTA</option>
            <option value={10000}>&gt; 10,000 MTA</option>
            <option value={25000}>&gt; 25,000 MTA</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="input-group">
          <label className="input-label">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field select-sm"
          >
            <option value="distance_asc">Distance (Closest First)</option>
            <option value="capacity_desc">Capacity (High to Low)</option>
            <option value="capacity_asc">Capacity (Low to High)</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="state_asc">State (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Quick Filter Chips */}
      <div className="filter-chips-row">
        <button
          className={`chip-btn ${activeChip === "ALL" ? "active" : ""}`}
          onClick={() => setActiveChip("ALL")}
        >
          All ({typeCounts.all})
        </button>

        <button
          className={`chip-btn ${activeChip === "SAVED" ? "active" : ""}`}
          onClick={() => setActiveChip("SAVED")}
        >
          <Bookmark size={12} />
          Saved ({typeCounts.saved})
        </button>

        <button
          className={`chip-btn ${activeChip === "Recycler" ? "active" : ""}`}
          onClick={() => setActiveChip("Recycler")}
        >
          Recyclers ({typeCounts.recycler})
        </button>

        <button
          className={`chip-btn ${activeChip === "Dismantler" ? "active" : ""}`}
          onClick={() => setActiveChip("Dismantler")}
        >
          Dismantlers ({typeCounts.dismantler})
        </button>

        <button
          className={`chip-btn ${activeChip === "Refurbisher" ? "active" : ""}`}
          onClick={() => setActiveChip("Refurbisher")}
        >
          Refurbishers ({typeCounts.refurbisher})
        </button>

        <button
          className={`chip-btn ${activeChip === "Collection Center" ? "active" : ""}`}
          onClick={() => setActiveChip("Collection Center")}
        >
          Collection ({typeCounts.collection})
        </button>
      </div>

      <style>{`
        .filter-sidebar-root {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .filter-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .sidebar-title-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sidebar-title-group h3 {
          font-size: 1.05rem;
          font-weight: 700;
        }
        .btn-text-sm {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 600;
          transition: color var(--transition-fast);
        }
        .btn-text-sm:hover {
          color: var(--primary);
        }
        .search-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .search-icon-sm {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
          pointer-events: none;
        }
        .search-input-sm {
          width: 100%;
          padding: 9px 34px 9px 34px;
          background: var(--bg-surface);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          color: var(--text-primary);
          outline: none;
          transition: border-color var(--transition-fast);
        }
        .search-input-sm:focus {
          border-color: var(--border-focus);
        }
        .btn-clear-search {
          position: absolute;
          right: 10px;
          color: var(--text-muted);
          padding: 2px;
        }
        .filter-controls-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .select-sm {
          padding: 8px 10px;
          font-size: 0.84rem;
        }
        .filter-chips-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .chip-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          border-radius: var(--radius-full);
          font-size: 0.76rem;
          font-weight: 600;
          background: var(--bg-muted);
          border: 1px solid var(--border-card);
          color: var(--text-secondary);
          transition: all var(--transition-fast);
        }
        .chip-btn:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }
        .chip-btn.active {
          background: var(--primary-light);
          color: var(--primary);
          border-color: var(--primary-border);
        }
        @media (max-width: 640px) {
          .filter-controls-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

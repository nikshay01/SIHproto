import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { getFacilities, getStateSummaries } from "../services/api.js";
import { useLocation } from "./LocationContext.jsx";

const FacilityContext = createContext();

export function FacilityProvider({ children }) {
  const { coords } = useLocation();

  const [facilities, setFacilities] = useState([]);
  const [statesList, setStatesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [selectedState, setSelectedState] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [minCapacity, setMinCapacity] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("distance_asc");
  const [activeChip, setActiveChip] = useState("ALL"); // ALL, SAVED, Recycler, Dismantler, Refurbisher, Collection Center

  // Bookmarks (Saved Facilities)
  const [savedIds, setSavedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ecycle_saved_facilities") || "[]");
    } catch {
      return [];
    }
  });

  // Selected Facility for Map focus / Detail Modal
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [detailModalFacility, setDetailModalFacility] = useState(null);

  // Load facilities and states
  const fetchFacilitiesData = useCallback(async () => {
    setLoading(true);
    try {
      const [facRes, stateRes] = await Promise.all([
        getFacilities({
          state: selectedState !== "ALL" ? selectedState : undefined,
          type: selectedType !== "ALL" ? selectedType : undefined,
          minCapacity: minCapacity > 0 ? minCapacity : undefined,
          search: searchQuery.trim() || undefined,
          userLat: coords?.latitude,
          userLng: coords?.longitude,
          sortBy
        }),
        getStateSummaries()
      ]);

      if (facRes.ok) {
        setFacilities(facRes.facilities || []);
      }
      if (stateRes.ok) {
        setStatesList(stateRes.states || []);
      }
    } catch (err) {
      console.warn("Failed to load facilities:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedState, selectedType, minCapacity, searchQuery, sortBy, coords]);

  useEffect(() => {
    fetchFacilitiesData();
  }, [fetchFacilitiesData]);

  // Bookmark Toggle
  const toggleBookmark = (facilityId) => {
    setSavedIds(prev => {
      const exists = prev.includes(facilityId);
      const next = exists ? prev.filter(id => id !== facilityId) : [...prev, facilityId];
      localStorage.setItem("ecycle_saved_facilities", JSON.stringify(next));
      return next;
    });
  };

  const isBookmarked = (facilityId) => savedIds.includes(facilityId);

  // Filtered facilities based on activeChip
  const filteredFacilities = useMemo(() => {
    if (activeChip === "SAVED") {
      return facilities.filter(f => savedIds.includes(f.id || f.facilityId));
    }
    if (activeChip !== "ALL") {
      return facilities.filter(f => f.type === activeChip);
    }
    return facilities;
  }, [facilities, activeChip, savedIds]);

  // Dynamic Type Counts for Chips
  const typeCounts = useMemo(() => {
    return {
      all: facilities.length,
      saved: facilities.filter(f => savedIds.includes(f.id || f.facilityId)).length,
      recycler: facilities.filter(f => f.type === "Recycler").length,
      dismantler: facilities.filter(f => f.type === "Dismantler").length,
      refurbisher: facilities.filter(f => f.type === "Refurbisher").length,
      collection: facilities.filter(f => f.type === "Collection Center").length
    };
  }, [facilities, savedIds]);

  const resetFilters = () => {
    setSelectedState("ALL");
    setSelectedType("ALL");
    setMinCapacity(0);
    setSearchQuery("");
    setSortBy("distance_asc");
    setActiveChip("ALL");
  };

  return (
    <FacilityContext.Provider
      value={{
        facilities: filteredFacilities,
        rawFacilities: facilities,
        statesList,
        loading,
        error,
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
        savedIds,
        toggleBookmark,
        isBookmarked,
        resetFilters,
        selectedFacility,
        setSelectedFacility,
        detailModalFacility,
        setDetailModalFacility,
        refetch: fetchFacilitiesData
      }}
    >
      {children}
    </FacilityContext.Provider>
  );
}

export function useFacilities() {
  const context = useContext(FacilityContext);
  if (!context) throw new Error("useFacilities must be used within FacilityProvider");
  return context;
}

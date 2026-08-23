import React, { createContext, useContext, useState, useEffect } from "react";
import { reverseGeocodeCoords } from "../services/geoUtils.js";

const LocationContext = createContext();

export function LocationProvider({ children }) {
  const [coords, setCoords] = useState(null); // { latitude, longitude }
  const [locationLabel, setLocationLabel] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setLoadingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ latitude, longitude });

        // Reverse geocode
        const geoInfo = await reverseGeocodeCoords(latitude, longitude);
        if (geoInfo?.shortLabel) {
          setLocationLabel(geoInfo.shortLabel);
        } else {
          setLocationLabel("Near You");
        }
        setLoadingLocation(false);
      },
      (error) => {
        console.warn("Geolocation permission denied or timed out:", error.message);
        setLocationError("Location permission denied or unavailable.");
        setLoadingLocation(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const clearLocation = () => {
    setCoords(null);
    setLocationLabel(null);
  };

  return (
    <LocationContext.Provider
      value={{
        coords,
        locationLabel,
        loadingLocation,
        locationError,
        requestLocation,
        clearLocation,
        hasLocation: Boolean(coords)
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) throw new Error("useLocation must be used within LocationProvider");
  return context;
}

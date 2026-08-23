/**
 * Geospatial Utilities for Proximity and Reverse Geocoding
 */

/**
 * Calculates Haversine distance in kilometers
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Earth radius km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Reverse geocode latitude and longitude using OpenStreetMap Nominatim
 */
export async function reverseGeocodeCoords(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "ECycleIndia-Portal/2.0"
      }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address || {};
    
    const city = addr.city || addr.town || addr.village || addr.suburb || addr.county || "";
    const state = addr.state || "";
    const district = addr.state_district || addr.county || "";

    return {
      displayName: data.display_name,
      city,
      district,
      state,
      shortLabel: city && state ? `${city}, ${state}` : (state || "Current Location")
    };
  } catch (err) {
    console.warn("Reverse geocoding error:", err.message);
    return null;
  }
}

export function formatDistance(distanceKm) {
  if (distanceKm == null) return null;
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

export function getGoogleMapsUrl(name, address, lat, lng) {
  if (lat && lng) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ", " + address)}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || name)}`;
}

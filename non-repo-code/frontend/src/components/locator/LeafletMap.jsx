import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { LocateFixed, RotateCcw } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useFacilities } from "../../context/FacilityContext.jsx";
import { formatDistance, getGoogleMapsUrl } from "../../services/geoUtils.js";

const DEFAULT_CENTER = [22.3511, 78.6677]; // All-India Geographic Center
const DEFAULT_ZOOM = 5;

export default function LeafletMap() {
  const { isDark } = useTheme();
  const { facilities, selectedFacility, setSelectedFacility, setDetailModalFacility } = useFacilities();
  
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerClusterGroupRef = useRef(null);
  const markersMapRef = useRef(new Map());

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: false,
        attributionControl: false
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Tile Layer based on theme
    const tileUrl = isDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: "abcd"
    });

    tileLayer.addTo(map);

    return () => {
      // Clean up tile on theme switch
      map.removeLayer(tileLayer);
    };
  }, [isDark]);

  // Marker Pin Generator
  const createCustomPin = (type) => {
    let color = "#10b981"; // Recycler
    if (type === "Dismantler") color = "#0d9488";
    if (type === "Refurbisher") color = "#f59e0b";
    if (type === "Collection Center") color = "#8b5cf6";

    return L.divIcon({
      className: "custom-map-marker",
      html: `
        <div style="
          width: 28px;
          height: 28px;
          border-radius: 50% 50% 50% 0;
          background: ${color};
          transform: rotate(-45deg);
          border: 2px solid #ffffff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 10px;
            height: 10px;
            background: #ffffff;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -28]
    });
  };

  // Render Facilities Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (markerClusterGroupRef.current) {
      map.removeLayer(markerClusterGroupRef.current);
    }

    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 45,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false
    });

    markersMapRef.current.clear();

    facilities.forEach((f) => {
      const lat = f.location?.latitude;
      const lng = f.location?.longitude;
      if (lat == null || lng == null) return;

      const marker = L.marker([lat, lng], {
        icon: createCustomPin(f.type)
      });

      const dist = formatDistance(f.distanceKm ?? f.distance_km);
      const gmaps = getGoogleMapsUrl(f.name, f.address, lat, lng);

      const popupHtml = `
        <div class="map-popup-card">
          <span class="popup-type-tag">${f.type}</span>
          <h4 class="popup-title">${f.name}</h4>
          <p class="popup-addr">${f.district ? f.district + ", " : ""}${f.state}</p>
          <div class="popup-meta">
            <span>Capacity: <strong>${(f.capacityMta || 0).toLocaleString()} MTA</strong></span>
            ${dist ? `<span>• <strong>${dist}</strong></span>` : ""}
          </div>
          <div class="popup-actions">
            <a href="${gmaps}" target="_blank" rel="noopener noreferrer" class="popup-btn-primary">
              Directions
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 260 });

      marker.on("click", () => {
        if (setSelectedFacility) setSelectedFacility(f);
      });

      clusterGroup.addLayer(marker);
      markersMapRef.current.set(f.id || f.facilityId, marker);
    });

    map.addLayer(clusterGroup);
    markerClusterGroupRef.current = clusterGroup;
  }, [facilities, setSelectedFacility]);

  // Fly to selected facility
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedFacility) return;

    const lat = selectedFacility.location?.latitude;
    const lng = selectedFacility.location?.longitude;

    if (lat != null && lng != null) {
      map.flyTo([lat, lng], 13, { duration: 1.2 });
      const marker = markersMapRef.current.get(selectedFacility.id || selectedFacility.facilityId);
      if (marker) {
        setTimeout(() => marker.openPopup(), 400);
      }
    }
  }, [selectedFacility]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, { duration: 1.0 });
    }
  };

  return (
    <div className="map-wrapper-card">
      <div ref={mapContainerRef} className="leaflet-map-canvas" />

      {/* Recenter Button */}
      <button className="btn-recenter-map" onClick={handleRecenter} title="Reset to All-India view">
        <RotateCcw size={16} />
        <span>Recenter India</span>
      </button>

      {/* Map Legend Bar */}
      <div className="map-legend-bar">
        <div className="legend-item"><span className="legend-dot bg-emerald-500"></span>Recycler</div>
        <div className="legend-item"><span className="legend-dot bg-teal-500"></span>Dismantler</div>
        <div className="legend-item"><span className="legend-dot bg-amber-500"></span>Refurbisher</div>
        <div className="legend-item"><span className="legend-dot bg-purple-500"></span>Collection</div>
      </div>

      <style>{`
        .map-wrapper-card {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 520px;
          border-radius: var(--radius-lg);
          overflow: hidden;
          border: 1px solid var(--border-card);
          box-shadow: var(--shadow-sm);
        }
        .leaflet-map-canvas {
          width: 100%;
          height: 100%;
          min-height: 520px;
          background: var(--bg-surface);
        }
        .btn-recenter-map {
          position: absolute;
          top: 14px;
          right: 14px;
          z-index: 400;
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-surface);
          border: 1px solid var(--border-card);
          box-shadow: var(--shadow-md);
          color: var(--text-primary);
          padding: 8px 14px;
          border-radius: var(--radius-full);
          font-size: 0.825rem;
          font-weight: 600;
          transition: all var(--transition-fast);
        }
        .btn-recenter-map:hover {
          background: var(--bg-hover);
          color: var(--primary);
        }
        .map-legend-bar {
          position: absolute;
          bottom: 14px;
          left: 14px;
          z-index: 400;
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--bg-surface);
          border: 1px solid var(--border-card);
          box-shadow: var(--shadow-md);
          padding: 6px 14px;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 600;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 5px;
          color: var(--text-secondary);
        }
        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .bg-emerald-500 { background: #10b981; }
        .bg-teal-500 { background: #0d9488; }
        .bg-amber-500 { background: #f59e0b; }
        .bg-purple-500 { background: #8b5cf6; }

        /* Leaflet Popup Styling */
        .leaflet-popup-content-wrapper {
          background: var(--bg-surface-elevated) !important;
          color: var(--text-primary) !important;
          border-radius: var(--radius-md) !important;
          border: 1px solid var(--border-card) !important;
          box-shadow: var(--shadow-lg) !important;
          padding: 0 !important;
        }
        .leaflet-popup-content {
          margin: 12px !important;
          line-height: 1.4 !important;
        }
        .leaflet-popup-tip {
          background: var(--bg-surface-elevated) !important;
        }
        .map-popup-card {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .popup-type-tag {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--primary);
        }
        .popup-title {
          font-size: 0.95rem;
          font-weight: 700;
          line-height: 1.2;
          color: var(--text-primary);
        }
        .popup-addr {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .popup-meta {
          font-size: 0.78rem;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .popup-actions {
          margin-top: 8px;
          display: flex;
        }
        .popup-btn-primary {
          background: var(--primary);
          color: #ffffff !important;
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          font-size: 0.78rem;
          font-weight: 600;
          text-align: center;
          display: inline-block;
          width: 100%;
        }
      `}</style>
    </div>
  );
}

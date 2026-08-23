import React, { useState, useEffect } from "react";

const NearestFacilities = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null); // {lat, lng}

  useEffect(() => {
    // Get user's current location
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
      },
      (err) => {
        setError(`Error getting location: ${err.message}`);
        setLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    // Fetch nearest facilities when location is available
    if (!location) return;

    const fetchNearestFacilities = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/facility/nearest?lat=${location.lat}&lng=${location.lng}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch facilities: ${response.status}`);
        }
        const data = await response.json();
        setFacilities(data.facilities || []);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchNearestFacilities();
  }, [location]);

  if (loading) {
    return <div className="glass-card">Loading nearest facilities...</div>;
  }

  if (error) {
    return <div className="error-alert-banner">{error}</div>;
  }

  if (facilities.length === 0) {
    return <div className="glass-card">No facilities found near your location.</div>;
  }

  return (
    <div className="nearest-facilities-container">
      <h3>Nearest E-Waste Facilities</h3>
      <p>Showing the 5 closest authorized facilities to your location with turn-by-turn directions</p>
      <div className="facilities-list">
        {facilities.map((facility) => (
          <div key={facility.id} className="facility-card glass-card">
            <div className="facility-header">
              <h4>{facility.name}</h4>
              <span className="badge badge-teal">
                {facility.distance_km} km away
              </span>
            </div>
            <div className="facility-details">
              <p><strong>Address:</strong> {facility.address}</p>
              <p><strong>City:</strong> {facility.district}, {facility.state}</p>
              <p><strong>Type:</strong> {facility.type}</p>
              <p><strong>Capacity:</strong> {facility.capacityMta || facility.capacity_mta || 0} MTA</p>
              <p><strong>Status:</strong> {facility.status}</p>
              {facility.contact?.phone && (
                <p><strong>Contact:</strong> {facility.contact.phone}</p>
              )}
              {facility.contact?.email && (
                <p><strong>Email:</strong> {facility.contact.email}</p>
              )}
              {location && facility.location?.latitude && facility.location?.longitude ? (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${location.lat},${location.lng}&destination=${facility.location.latitude},${facility.location.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-primary"
                >
                  Get Directions
                </a>
              ) : (
                <a
                  href={facility.location?.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-primary"
                >
                  View on Map
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
      <style>{`
        .nearest-facilities-container {
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        .nearest-facilities-container h3 {
          color: var(--primary);
          margin-bottom: 10px;
        }
        .nearest-facilities-container p {
          color: var(--text-secondary);
          margin-bottom: 20px;
        }
        .facilities-list {
          display: grid;
          gap: 16px;
        }
        .facility-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .facility-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .facility-header h4 {
          margin: 0;
          font-size: 1.25rem;
          color: var(--text-dark);
        }
        .facility-details p {
          margin: 4px 0;
          color: var(--text-muted);
          font-size: 0.9rem;
        }
        .facility-details p strong {
          color: var(--text-dark);
          display: inline-block;
          width: 80px;
        }
        @media (max-width: 640px) {
          .facility-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          .facility-details p strong {
            width: 70px;
          }
        }
      `}</style>
    </div>
  );
};

export default NearestFacilities;
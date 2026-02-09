import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import './LocationMap.css';

const getFlagCode = (location, country) => {
  const value = `${location} ${country}`.toLowerCase();
  if (value.includes('dominican')) return 'DR';
  if (value.includes('mexico')) return 'MX';
  if (
    value.includes('usa') ||
    value.includes('united states') ||
    value.includes('california') ||
    value.includes('new york') ||
    value.includes('texas') ||
    value.includes('florida')
  ) {
    return 'US';
  }
  return '??';
};

function LocationMap({ members }) {
  const [locationData, setLocationData] = useState([]);
  const [stats, setStats] = useState({ cities: 0, countries: 0, states: 0 });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapPoints, setMapPoints] = useState([]);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [mapWarning, setMapWarning] = useState('');

  useEffect(() => {
    processLocations();
  }, [members]);

  useEffect(() => {
    if (locationData.length === 0) {
      setMapPoints([]);
      setMapWarning('');
      return;
    }

    geocodeLocations(locationData);
  }, [locationData]);

  const processLocations = () => {
    const locationMap = {};

    members.forEach((member) => {
      if (!member.location) return;

      const location = member.location.trim();
      if (!locationMap[location]) {
        locationMap[location] = {
          location,
          members: [],
          city: extractCity(location),
          state: extractState(location),
          country: extractCountry(location)
        };
      }
      locationMap[location].members.push(member);
    });

    const locations = Object.values(locationMap);
    const cities = new Set(locations.map((loc) => loc.city).filter(Boolean)).size;
    const states = new Set(locations.map((loc) => loc.state).filter(Boolean)).size;
    const countries = new Set(locations.map((loc) => loc.country).filter(Boolean)).size;

    setLocationData(locations);
    setStats({ cities, states, countries });
  };

  const extractCity = (location) => {
    const parts = location.split(',');
    return parts[0]?.trim() || location;
  };

  const extractState = (location) => {
    const parts = location.split(',');
    if (parts.length >= 3) {
      return parts[1].trim();
    }
    return null;
  };

  const extractCountry = (location) => {
    const parts = location.split(',');
    if (parts.length >= 3) {
      return parts[2].trim();
    }
    if (location.toLowerCase().includes('usa') ||
        location.toLowerCase().includes('united states')) {
      return 'USA';
    }
    if (location.toLowerCase().includes('dominican republic')) {
      return 'Dominican Republic';
    }
    return parts.length === 2 ? parts[1].trim() : null;
  };

  const getGeocodeQuery = (location) => {
    const parts = [location.city, location.state, location.country].filter(Boolean);
    return parts.length ? parts.join(', ') : location.location;
  };

  const getGeoCache = () => {
    try {
      const raw = localStorage.getItem('geoCache_v1');
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      return {};
    }
  };

  const setGeoCache = (cache) => {
    try {
      localStorage.setItem('geoCache_v1', JSON.stringify(cache));
    } catch (error) {
      // Ignore storage errors.
    }
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const geocodeLocations = async (locations) => {
    setIsMapLoading(true);
    setMapWarning('');

    const cache = getGeoCache();
    const updatedCache = { ...cache };
    const points = [];
    let missingCount = 0;

    for (let i = 0; i < locations.length; i += 1) {
      const loc = locations[i];
      const cacheEntry = updatedCache[loc.location];
      if (cacheEntry && cacheEntry.lat && cacheEntry.lon) {
        points.push({ ...loc, lat: cacheEntry.lat, lon: cacheEntry.lon });
        continue;
      }

      const query = getGeocodeQuery(loc);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
          {
            headers: {
              'Accept-Language': 'en'
            }
          }
        );
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const result = data[0];
          const lat = Number(result.lat);
          const lon = Number(result.lon);
          if (Number.isFinite(lat) && Number.isFinite(lon)) {
            updatedCache[loc.location] = { lat, lon, updatedAt: Date.now() };
            points.push({ ...loc, lat, lon });
          } else {
            missingCount += 1;
          }
        } else {
          missingCount += 1;
        }
      } catch (error) {
        missingCount += 1;
      }

      if (i < locations.length - 1) {
        await sleep(1000);
      }
    }

    setGeoCache(updatedCache);
    setMapPoints(points);
    setIsMapLoading(false);

    if (missingCount > 0) {
      setMapWarning(
        'Some locations could not be mapped. Add city and country for better results.'
      );
    }
  };

  const createCountIcon = useMemo(() => {
    return (count) => L.divIcon({
      className: 'map-count-icon',
      html: `<span>${count}</span>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
  }, []);

  const FitBounds = ({ points }) => {
    const map = useMap();
    useEffect(() => {
      if (!points.length) return;
      const bounds = L.latLngBounds(points.map((point) => [point.lat, point.lon]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 });
    }, [map, points]);
    return null;
  };

  if (members.filter((member) => member.location).length === 0) {
    return (
      <div className="map-empty-state">
        <div className="map-empty-icon">Map</div>
        <h3>No Locations Set</h3>
        <p>Add locations to family members to see them on the map</p>
        <div className="map-empty-hint">
          <strong>Tip:</strong> Edit family members and add their location
          (e.g., "Los Angeles, California, USA")
        </div>
      </div>
    );
  }

  return (
    <div className="location-map-container">
      <div className="map-header">
        <h2>Family Locations</h2>
        <p className="map-subtitle">Where the Medina family calls home</p>
      </div>

      <div className="map-stats">
        <div className="map-stat-card">
          <div className="map-stat-number">{stats.cities}</div>
          <div className="map-stat-label">Cities</div>
        </div>
        <div className="map-stat-card">
          <div className="map-stat-number">{stats.states || stats.countries}</div>
          <div className="map-stat-label">States/Provinces</div>
        </div>
        <div className="map-stat-card">
          <div className="map-stat-number">{stats.countries}</div>
          <div className="map-stat-label">Countries</div>
        </div>
        <div className="map-stat-card">
          <div className="map-stat-number">{locationData.length}</div>
          <div className="map-stat-label">Unique Locations</div>
        </div>
      </div>

      <div className="map-info-box">
        <div className="map-info-icon">i</div>
        <div className="map-info-text">
          <strong>Location Guide:</strong> Click on any location card to see who lives there.
          Locations are grouped by city to show family clusters.
        </div>
      </div>

      <div className="map-visualization">
        <div className="map-world live-map">
          <h3>Family Distribution Map</h3>
          <div className="map-live">
            {isMapLoading && (
              <div className="map-loading">Loading map locations...</div>
            )}
            {!isMapLoading && (
              <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom={false}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                {mapPoints.map((point) => (
                  <Marker
                    key={point.location}
                    position={[point.lat, point.lon]}
                    icon={createCountIcon(point.members.length)}
                    eventHandlers={{
                      click: () => setSelectedLocation(point)
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                      {point.city}
                    </Tooltip>
                  </Marker>
                ))}
                <FitBounds points={mapPoints} />
              </MapContainer>
            )}
          </div>
          {mapWarning && <div className="map-warning">{mapWarning}</div>}
        </div>
      </div>

      <div className="locations-section">
        <h3>All Locations ({locationData.length})</h3>
        <div className="location-cards-grid">
          {locationData.map((loc) => (
            <div
              key={loc.location}
              className="location-card"
              onClick={() => setSelectedLocation(loc)}
            >
              <div className="location-header">
                <div className="location-flag">
                  {getFlagCode(loc.location, loc.country)}
                </div>
                <div className="location-name">
                  <div className="location-city">{loc.city}</div>
                  {loc.state && <div className="location-region">{loc.state}</div>}
                </div>
                <div className="location-count">
                  <span className="count-number">{loc.members.length}</span>
                  <span className="count-label">member{loc.members.length !== 1 ? 's' : ''}</span>
                </div>
              </div>

              <div className="location-members">
                {loc.members.slice(0, 3).map((member) => (
                  <div key={member.id} className="location-member-chip">
                    <div className="member-chip-avatar">
                      {member.photoURL ? (
                        <img src={member.photoURL} alt={member.name} />
                      ) : (
                        member.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span>{member.name}</span>
                  </div>
                ))}
                {loc.members.length > 3 && (
                  <div className="location-member-chip more">
                    +{loc.members.length - 3} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedLocation && (
        <div className="location-modal-overlay" onClick={() => setSelectedLocation(null)}>
          <div className="location-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="location-modal-close" onClick={() => setSelectedLocation(null)}>X</button>

            <div className="location-modal-header">
              <div className="location-modal-flag">
                {getFlagCode(selectedLocation.location, selectedLocation.country)}
              </div>
              <div className="location-modal-title">
                <h3>{selectedLocation.city}</h3>
                <p>{selectedLocation.location}</p>
              </div>
            </div>

            <div className="location-modal-stats">
              <div className="modal-stat">
                <span className="modal-stat-number">{selectedLocation.members.length}</span>
                <span className="modal-stat-label">
                  Family Member{selectedLocation.members.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="location-modal-body">
              <h4>Who Lives Here:</h4>
              <div className="location-modal-members">
                {selectedLocation.members.map((member) => (
                  <div key={member.id} className="modal-member-card">
                    <div className="modal-member-avatar">
                      {member.photoURL ? (
                        <img src={member.photoURL} alt={member.name} />
                      ) : (
                        <div className="modal-member-initial">
                          {member.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="modal-member-info">
                      <div className="modal-member-name">{member.name}</div>
                      <div className="modal-member-relation">{member.relationship}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LocationMap;

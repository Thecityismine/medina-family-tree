import React, { useState, useEffect } from 'react';
import './LocationMap.css';

function LocationMap({ members }) {
  const [locationData, setLocationData] = useState([]);
  const [stats, setStats] = useState({ cities: 0, countries: 0, states: 0 });
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    processLocations();
  }, [members]);

  const processLocations = () => {
    // Group members by location
    const locationMap = {};
    
    members.forEach(member => {
      if (!member.location) return;
      
      const location = member.location.trim();
      if (!locationMap[location]) {
        locationMap[location] = {
          location: location,
          members: [],
          city: extractCity(location),
          state: extractState(location),
          country: extractCountry(location)
        };
      }
      locationMap[location].members.push(member);
    });

    const locations = Object.values(locationMap);
    
    // Calculate stats
    const cities = new Set(locations.map(l => l.city).filter(Boolean)).size;
    const states = new Set(locations.map(l => l.state).filter(Boolean)).size;
    const countries = new Set(locations.map(l => l.country).filter(Boolean)).size;

    setLocationData(locations);
    setStats({ cities, states, countries });
  };

  const extractCity = (location) => {
    // Try to extract city from common formats
    // "Los Angeles, California" -> "Los Angeles"
    // "New York, NY, USA" -> "New York"
    const parts = location.split(',');
    return parts[0]?.trim() || location;
  };

  const extractState = (location) => {
    // Try to extract state from common formats
    const parts = location.split(',');
    if (parts.length >= 2) {
      return parts[1].trim();
    }
    return null;
  };

  const extractCountry = (location) => {
    // Try to extract country from common formats
    const parts = location.split(',');
    if (parts.length >= 3) {
      return parts[2].trim();
    }
    // Common countries
    if (location.toLowerCase().includes('usa') || 
        location.toLowerCase().includes('united states')) {
      return 'USA';
    }
    if (location.toLowerCase().includes('dominican republic')) {
      return 'Dominican Republic';
    }
    return parts.length === 2 ? parts[1].trim() : null;
  };

  const getFlag = (location) => {
    const country = extractCountry(location)?.toLowerCase() || '';
    
    if (country.includes('usa') || country.includes('united states') || 
        location.toLowerCase().includes('california') ||
        location.toLowerCase().includes('new york') ||
        location.toLowerCase().includes('texas') ||
        location.toLowerCase().includes('florida')) {
      return '🇺🇸';
    }
    if (country.includes('dominican') || country.includes('dr')) {
      return '🇩🇴';
    }
    if (country.includes('mexico')) {
      return '🇲🇽';
    }
    return '🌍';
  };

  if (members.filter(m => m.location).length === 0) {
    return (
      <div className="map-empty-state">
        <div className="map-empty-icon">🗺️</div>
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
      {/* Header */}
      <div className="map-header">
        <h2>🗺️ Family Locations</h2>
        <p className="map-subtitle">Where the Medina family calls home</p>
      </div>

      {/* Stats */}
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

      {/* Info Box */}
      <div className="map-info-box">
        <div className="map-info-icon">📍</div>
        <div className="map-info-text">
          <strong>Location Guide:</strong> Click on any location card to see who lives there. 
          Locations are grouped by city to show family clusters.
        </div>
      </div>

      {/* Visual Map Representation */}
      <div className="map-visualization">
        <div className="map-world">
          <h3>Family Distribution Map</h3>
          <div className="map-pins-container">
            {locationData.map((loc, index) => (
              <div 
                key={index} 
                className="map-pin"
                onClick={() => setSelectedLocation(loc)}
                style={{
                  left: `${(index * 25 + 15) % 85}%`,
                  top: `${40 + (index % 3) * 15}%`
                }}
              >
                <div className="pin-marker">
                  <span className="pin-icon">📍</span>
                  <span className="pin-count">{loc.members.length}</span>
                </div>
                <div className="pin-label">{loc.city}</div>
              </div>
            ))}
          </div>
          <div className="map-decoration">
            <div className="map-grid"></div>
          </div>
        </div>
      </div>

      {/* Location Cards */}
      <div className="locations-section">
        <h3>All Locations ({locationData.length})</h3>
        <div className="location-cards-grid">
          {locationData.map((loc, index) => (
            <div 
              key={index} 
              className="location-card"
              onClick={() => setSelectedLocation(loc)}
            >
              <div className="location-header">
                <div className="location-flag">{getFlag(loc.location)}</div>
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
                {loc.members.slice(0, 3).map(member => (
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

      {/* Location Detail Modal */}
      {selectedLocation && (
        <div className="location-modal-overlay" onClick={() => setSelectedLocation(null)}>
          <div className="location-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="location-modal-close" onClick={() => setSelectedLocation(null)}>✕</button>
            
            <div className="location-modal-header">
              <div className="location-modal-flag">{getFlag(selectedLocation.location)}</div>
              <div className="location-modal-title">
                <h3>{selectedLocation.city}</h3>
                <p>{selectedLocation.location}</p>
              </div>
            </div>

            <div className="location-modal-stats">
              <div className="modal-stat">
                <span className="modal-stat-number">{selectedLocation.members.length}</span>
                <span className="modal-stat-label">Family Member{selectedLocation.members.length !== 1 ? 's' : ''}</span>
              </div>
            </div>

            <div className="location-modal-body">
              <h4>Who Lives Here:</h4>
              <div className="location-modal-members">
                {selectedLocation.members.map(member => (
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

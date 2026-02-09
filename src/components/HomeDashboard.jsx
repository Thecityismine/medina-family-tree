import React, { useState, useEffect } from 'react';
import './HomeDashboard.css';

function HomeDashboard({ members, user }) {
  const [stats, setStats] = useState({
    totalMembers: 0,
    upcomingBirthdays: 0,
    generations: 0,
    locations: 0
  });
  const [recentlyAdded, setRecentlyAdded] = useState([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);

  useEffect(() => {
    calculateStats();
    getRecentlyAdded();
    getUpcomingBirthdays();
  }, [members]);

  const calculateStats = () => {
    // Total members
    const totalMembers = members.length;

    // Upcoming birthdays (next 30 days)
    const today = new Date();
    const next30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const upcoming = members.filter(m => {
      if (!m.birthDate) return false;
      const nextBday = getNextBirthday(new Date(m.birthDate));
      return nextBday <= next30Days;
    }).length;

    // Generations
    const relationships = members.map(m => m.relationship);
    const hasGeneration1 = relationships.some(r => 
      ['Father', 'Mother', 'Grandfather', 'Grandmother', "Anseli's Mother"].includes(r)
    );
    const hasGeneration2 = relationships.some(r => 
      ['You (Admin)', 'Spouse', 'Partner', 'Brother', 'Sister'].includes(r)
    );
    const hasGeneration3 = relationships.some(r => 
      ['Son', 'Daughter', 'Child'].includes(r)
    );
    const hasGeneration4 = relationships.some(r => 
      ['Grandson', 'Granddaughter', 'Grandchild'].includes(r)
    );
    const generations = [hasGeneration1, hasGeneration2, hasGeneration3, hasGeneration4]
      .filter(Boolean).length;

    // Locations
    const uniqueLocations = new Set(
      members.filter(m => m.location).map(m => m.location)
    ).size;

    setStats({
      totalMembers,
      upcomingBirthdays: upcoming,
      generations,
      locations: uniqueLocations
    });
  };

  const getNextBirthday = (birthDate) => {
    const today = new Date();
    const thisYear = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    
    if (thisYear < today) {
      return new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
    }
    return thisYear;
  };

  const getRecentlyAdded = () => {
    const sorted = [...members]
      .filter(m => m.createdAt)
      .sort((a, b) => {
        const aTime = a.createdAt.seconds || 0;
        const bTime = b.createdAt.seconds || 0;
        return bTime - aTime;
      })
      .slice(0, 3);
    
    setRecentlyAdded(sorted);
  };

  const getUpcomingBirthdays = () => {
    const today = new Date();
    
    const upcoming = members
      .filter(m => m.birthDate)
      .map(member => {
        const birthDate = new Date(member.birthDate);
        const nextBirthday = getNextBirthday(birthDate);
        const daysUntil = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
        
        return {
          ...member,
          daysUntil,
          nextBirthday
        };
      })
      .filter(m => m.daysUntil <= 30)
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 3);

    setUpcomingBirthdays(upcoming);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="home-dashboard">
      {/* Welcome Header */}
      <div className="welcome-header">
        <h1>{getTimeOfDay()}! 👋</h1>
        <p className="welcome-subtitle">Welcome to The Medina Family Tree</p>
      </div>

      {/* Quick Stats */}
      <div className="dashboard-stats">
        <div className="dash-stat-card">
          <div className="dash-stat-icon">👥</div>
          <div className="dash-stat-content">
            <div className="dash-stat-number">{stats.totalMembers}</div>
            <div className="dash-stat-label">Family Members</div>
          </div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-icon">🎂</div>
          <div className="dash-stat-content">
            <div className="dash-stat-number">{stats.upcomingBirthdays}</div>
            <div className="dash-stat-label">Upcoming Birthdays</div>
          </div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-icon">🌳</div>
          <div className="dash-stat-content">
            <div className="dash-stat-number">{stats.generations}</div>
            <div className="dash-stat-label">Generations</div>
          </div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-icon">🗺️</div>
          <div className="dash-stat-content">
            <div className="dash-stat-number">{stats.locations}</div>
            <div className="dash-stat-label">Locations</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Upcoming Birthdays Widget */}
        {upcomingBirthdays.length > 0 && (
          <div className="dashboard-widget">
            <div className="widget-header">
              <h3>🎉 Upcoming Birthdays</h3>
              <span className="widget-count">{upcomingBirthdays.length}</span>
            </div>
            <div className="widget-content">
              {upcomingBirthdays.map(member => (
                <div key={member.id} className="widget-item">
                  <div className="widget-item-avatar">
                    {member.photoURL ? (
                      <img src={member.photoURL} alt={member.name} />
                    ) : (
                      member.name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="widget-item-info">
                    <div className="widget-item-name">{member.name}</div>
                    <div className="widget-item-detail">
                      {formatDate(member.birthDate)}
                    </div>
                  </div>
                  <div className={`widget-item-badge ${member.daysUntil === 0 ? 'today' : ''}`}>
                    {member.daysUntil === 0 ? 'Today!' : 
                     member.daysUntil === 1 ? 'Tomorrow' : 
                     `${member.daysUntil} days`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recently Added Widget */}
        {recentlyAdded.length > 0 && (
          <div className="dashboard-widget">
            <div className="widget-header">
              <h3>✨ Recently Added</h3>
              <span className="widget-count">{recentlyAdded.length}</span>
            </div>
            <div className="widget-content">
              {recentlyAdded.map(member => (
                <div key={member.id} className="widget-item">
                  <div className="widget-item-avatar">
                    {member.photoURL ? (
                      <img src={member.photoURL} alt={member.name} />
                    ) : (
                      member.name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="widget-item-info">
                    <div className="widget-item-name">{member.name}</div>
                    <div className="widget-item-detail">{member.relationship}</div>
                  </div>
                  <div className="widget-item-badge new">New</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions Widget */}
        <div className="dashboard-widget quick-actions">
          <div className="widget-header">
            <h3>⚡ Quick Actions</h3>
          </div>
          <div className="widget-content">
            <div className="action-grid">
              <button className="action-button" onClick={() => window.location.hash = '#tree'}>
                <span className="action-icon">🌳</span>
                <span className="action-label">View Tree</span>
              </button>
              <button className="action-button" onClick={() => window.location.hash = '#birthdays'}>
                <span className="action-icon">🎂</span>
                <span className="action-label">Birthdays</span>
              </button>
              <button className="action-button" onClick={() => window.location.hash = '#map'}>
                <span className="action-icon">🗺️</span>
                <span className="action-label">Map</span>
              </button>
              <button className="action-button" onClick={() => window.location.hash = '#members'}>
                <span className="action-icon">👥</span>
                <span className="action-label">Members</span>
              </button>
            </div>
          </div>
        </div>

        {/* Family Highlights Widget */}
        <div className="dashboard-widget highlights">
          <div className="widget-header">
            <h3>📊 Family Highlights</h3>
          </div>
          <div className="widget-content">
            <div className="highlight-item">
              <span className="highlight-label">Est.</span>
              <span className="highlight-value">1947</span>
            </div>
            <div className="highlight-item">
              <span className="highlight-label">Family Name</span>
              <span className="highlight-value">Medina</span>
            </div>
            <div className="highlight-item">
              <span className="highlight-label">Total Members</span>
              <span className="highlight-value">{stats.totalMembers}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeDashboard;

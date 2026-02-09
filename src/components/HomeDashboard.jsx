import React, { useEffect, useState } from 'react';
import { getNextBirthdayDate, parseBirthDate } from '../utils/birthdays';
import './HomeDashboard.css';

const FALLBACK_GENERATIONS = {
  1: [
    'Father',
    'Mother',
    'Grandfather',
    'Grandmother',
    'Great Grandfather',
    'Great Grandmother',
    "Anseli's Mother",
    'Uncle',
    'Aunt',
    'Great Uncle',
    'Great Aunt'
  ],
  2: [
    'You (Admin)',
    'You',
    'Self',
    'Spouse',
    'Partner',
    'Brother',
    'Sister',
    'Sibling',
    'Cousin',
    'First Cousin'
  ],
  3: ['Son', 'Daughter', 'Child', 'Nephew', 'Niece'],
  4: ['Grandson', 'Granddaughter', 'Grandchild']
};

const getCreatedAtMs = (value) => {
  if (!value) return 0;
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  if (typeof value._seconds === 'number') return value._seconds * 1000;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  return 0;
};

const formatShortDate = (value) => {
  const date = parseBirthDate(value);
  if (!date) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getGenerationCount = (members) => {
  if (members.length === 0) return 0;

  const memberMap = new Map(members.map((member) => [member.id, member]));
  const generationById = new Map();
  const visiting = new Set();

  const getParentIds = (member) => {
    if (!member || !Array.isArray(member.parentIds)) return [];
    return member.parentIds.filter((id) => memberMap.has(id));
  };

  const getFallbackGeneration = (relationship) => {
    if (!relationship) return null;
    const entry = Object.entries(FALLBACK_GENERATIONS).find(([, list]) =>
      list.includes(relationship)
    );
    return entry ? Number(entry[0]) : null;
  };

  const computeGeneration = (memberId) => {
    if (generationById.has(memberId)) return generationById.get(memberId);
    if (visiting.has(memberId)) return 1;

    visiting.add(memberId);
    const member = memberMap.get(memberId);
    const parentIds = getParentIds(member);

    let generation = 1;
    if (parentIds.length > 0) {
      const parentGenerations = parentIds
        .map((id) => computeGeneration(id))
        .filter((value) => Number.isFinite(value));
      generation = parentGenerations.length > 0 ? Math.max(...parentGenerations) + 1 : 1;
    }

    generationById.set(memberId, generation);
    visiting.delete(memberId);
    return generation;
  };

  members.forEach((member) => {
    computeGeneration(member.id);
  });

  members.forEach((member) => {
    const parentIds = getParentIds(member);
    if (parentIds.length > 0) return;

    const fallbackGeneration = getFallbackGeneration(member.relationship);
    if (fallbackGeneration) {
      generationById.set(member.id, fallbackGeneration);
    } else if (Array.isArray(member.spouseIds)) {
      const spouseGeneration = member.spouseIds
        .map((id) => generationById.get(id))
        .find((value) => Number.isFinite(value));
      if (spouseGeneration) {
        generationById.set(member.id, spouseGeneration);
      }
    }
  });

  return new Set(generationById.values()).size;
};

function HomeDashboard({ members, user, onNavigate }) {
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
    const totalMembers = members.length;

    const today = new Date();
    const next30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const upcoming = members.filter((member) => {
      const nextBirthday = getNextBirthdayDate(member.birthDate, today);
      return nextBirthday ? nextBirthday <= next30Days : false;
    }).length;

    const generations = getGenerationCount(members);

    const uniqueLocations = new Set(
      members
        .map((member) => (member.location || '').trim())
        .filter(Boolean)
    ).size;

    setStats({
      totalMembers,
      upcomingBirthdays: upcoming,
      generations,
      locations: uniqueLocations
    });
  };

  const getRecentlyAdded = () => {
    const sorted = [...members]
      .filter((member) => member.createdAt)
      .sort((a, b) => getCreatedAtMs(b.createdAt) - getCreatedAtMs(a.createdAt))
      .slice(0, 3);

    setRecentlyAdded(sorted);
  };

  const getUpcomingBirthdays = () => {
    const today = new Date();

    const upcoming = members
      .map((member) => {
        const nextBirthday = getNextBirthdayDate(member.birthDate, today);
        if (!nextBirthday) return null;
        const daysUntil = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
        return { ...member, daysUntil, nextBirthday };
      })
      .filter((member) => member && member.daysUntil <= 30)
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 3);

    setUpcomingBirthdays(upcoming);
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleNavigate = (view) => {
    if (onNavigate) {
      onNavigate(view);
    }
  };

  return (
    <div className="home-dashboard">
      <div className="welcome-header">
        <h1>{getTimeOfDay()}!</h1>
        <p className="welcome-subtitle">Welcome to The Medina Family Tree</p>
      </div>

      <div className="dashboard-stats">
        <div className="dash-stat-card">
          <div className="dash-stat-icon">Members</div>
          <div className="dash-stat-content">
            <div className="dash-stat-number">{stats.totalMembers}</div>
            <div className="dash-stat-label">Family Members</div>
          </div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-icon">Birthdays</div>
          <div className="dash-stat-content">
            <div className="dash-stat-number">{stats.upcomingBirthdays}</div>
            <div className="dash-stat-label">Upcoming Birthdays</div>
          </div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-icon">Tree</div>
          <div className="dash-stat-content">
            <div className="dash-stat-number">{stats.generations}</div>
            <div className="dash-stat-label">Generations</div>
          </div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-icon">Locations</div>
          <div className="dash-stat-content">
            <div className="dash-stat-number">{stats.locations}</div>
            <div className="dash-stat-label">Locations</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {upcomingBirthdays.length > 0 && (
          <div className="dashboard-widget">
            <div className="widget-header">
              <h3>Upcoming Birthdays</h3>
              <span className="widget-count">{upcomingBirthdays.length}</span>
            </div>
            <div className="widget-content">
              {upcomingBirthdays.map((member) => (
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
                      {formatShortDate(member.birthDate)}
                    </div>
                  </div>
                  <div className={`widget-item-badge ${member.daysUntil === 0 ? 'today' : ''}`}>
                    {member.daysUntil === 0 ? 'Today' :
                      member.daysUntil === 1 ? 'Tomorrow' :
                        `${member.daysUntil} days`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {recentlyAdded.length > 0 && (
          <div className="dashboard-widget">
            <div className="widget-header">
              <h3>Recently Added</h3>
              <span className="widget-count">{recentlyAdded.length}</span>
            </div>
            <div className="widget-content">
              {recentlyAdded.map((member) => (
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

        <div className="dashboard-widget quick-actions">
          <div className="widget-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="widget-content">
            <div className="action-grid">
              <button className="action-button" onClick={() => handleNavigate('tree')}>
                <span className="action-icon">Tree</span>
                <span className="action-label">View Tree</span>
              </button>
              <button className="action-button" onClick={() => handleNavigate('birthdays')}>
                <span className="action-icon">Birthdays</span>
                <span className="action-label">Birthdays</span>
              </button>
              <button className="action-button" onClick={() => handleNavigate('locations')}>
                <span className="action-icon">Map</span>
                <span className="action-label">Locations</span>
              </button>
              <button className="action-button" onClick={() => handleNavigate('list')}>
                <span className="action-icon">Members</span>
                <span className="action-label">Members</span>
              </button>
            </div>
          </div>
        </div>

        <div className="dashboard-widget highlights">
          <div className="widget-header">
            <h3>Family Highlights</h3>
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

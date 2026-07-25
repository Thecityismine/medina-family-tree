import React, { useEffect, useMemo, useState } from 'react';
import { getNextBirthdayDate, parseBirthDate } from '../utils/birthdays';
import { Avatar, Badge, Card, Icon, Stat, Skeleton } from './ui';
import { getOnThisDay, getFamilyMilestones } from '../utils/timeline';
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

/* Earliest birth year in the tree — anchors the hero's "1947 -> Today" range
   in real data instead of a hardcoded string. */
const getFoundingYear = (members) => {
  const years = members
    .map((member) => parseBirthDate(member.birthDate))
    .filter(Boolean)
    .map((date) => date.getFullYear());
  return years.length > 0 ? Math.min(...years) : null;
};

function HomeDashboard({ members, user, isLoading = false, onNavigate }) {
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

  const handleNavigate = (view) => {
    if (onNavigate) {
      onNavigate(view);
    }
  };

  /* Collage backdrop built from photos that already exist in Firestore — no
     new schema, no upload flow. Needs at least 4 to read as a collage rather
     than as a mistake; below that the hero falls back to a warm gradient. */
  const collage = useMemo(
    () => members.filter((m) => m.photoURL).slice(0, 12),
    [members]
  );
  const hasCollage = collage.length >= 4;
  const foundingYear = useMemo(() => getFoundingYear(members), [members]);

  const onThisDay = useMemo(() => getOnThisDay(members), [members]);
  const milestones = useMemo(() => getFamilyMilestones(members), [members]);

  return (
    <div className="home-dashboard">
      {/*
        HERO. Replaces "Good afternoon!" — a greeting says nothing about this
        family. The name, the span of years, and the faces do.
      */}
      <section className={`hero ${hasCollage ? 'hero--collage' : 'hero--plain'}`}>
        {hasCollage && (
          <div className="hero__collage" aria-hidden="true">
            {collage.map((member) => (
              <img key={member.id} src={member.photoURL} alt="" loading="lazy" decoding="async" />
            ))}
          </div>
        )}

        <div className="hero__content">
          <p className="hero__eyebrow t-label">
            {foundingYear ? `${foundingYear} — Today` : 'Est. 1947'}
          </p>
          <h1 className="t-display hero__title">The Medina Family</h1>

          <div className="hero__facts">
            <span className="hero__fact">
              <strong className="t-tabular">{stats.generations}</strong> Generations
            </span>
            <span className="hero__sep" aria-hidden="true" />
            <span className="hero__fact">
              <strong className="t-tabular">{stats.totalMembers}</strong> Members
            </span>
            <span className="hero__sep" aria-hidden="true" />
            <span className="hero__fact">
              <strong className="t-tabular">{stats.locations}</strong> Places
            </span>
          </div>

          <p className="hero__quote">Our family&rsquo;s story continues.</p>
        </div>
      </section>

      {/*
        ON THIS DAY. Only renders when today actually matches a past event, so
        it never occupies space with an empty state. Memorial anniversaries are
        worded differently from birthdays rather than lumped together.
      */}
      {onThisDay.length > 0 && (
        <section className="otd">
          <div className="otd__head">
            <Icon name="sparkle" size={18} />
            <h3>On this day</h3>
          </div>
          <ul className="otd__list">
            {onThisDay.map((event) => (
              <li key={event.id} className="otd__item">
                <Avatar member={event.member} size="md" ring deceased={event.isMemorial} />
                <div className="otd__body">
                  <p className="otd__text">
                    <strong>{event.member.name}</strong>{' '}
                    {event.isMemorial ? 'was lost to us' : 'was born'} in{' '}
                    <span className="t-tabular">{event.year}</span>.
                  </p>
                  <p className="otd__ago t-sm">
                    {event.yearsAgo} {event.yearsAgo === 1 ? 'year' : 'years'} ago today
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="dashboard-stats">
        {isLoading ? (
          <>
            <Skeleton variant="card" />
            <Skeleton variant="card" />
            <Skeleton variant="card" />
            <Skeleton variant="card" />
          </>
        ) : (
          <>
            <Card surface="1" pad="md" className="dash-stat-card">
              <Icon name="users" size={20} className="dash-stat-icon" />
              <Stat value={stats.totalMembers} label="Family Members" />
            </Card>
            <Card surface="1" pad="md" className="dash-stat-card">
              <Icon name="cake" size={20} className="dash-stat-icon" />
              <Stat value={stats.upcomingBirthdays} label="Upcoming Birthdays" />
            </Card>
            <Card surface="1" pad="md" className="dash-stat-card">
              <Icon name="tree" size={20} className="dash-stat-icon" />
              <Stat value={stats.generations} label="Generations" />
            </Card>
            <Card surface="1" pad="md" className="dash-stat-card">
              <Icon name="pin" size={20} className="dash-stat-icon" />
              <Stat value={stats.locations} label="Locations" />
            </Card>
          </>
        )}
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
                  <Avatar member={member} size="md" ring />
                  <div className="widget-item-info">
                    <div className="widget-item-name t-truncate">{member.name}</div>
                    <div className="widget-item-detail">
                      {formatShortDate(member.birthDate)}
                    </div>
                  </div>
                  <Badge tone={member.daysUntil === 0 ? 'solid' : 'gold'}>
                    {member.daysUntil === 0 ? 'Today' :
                      member.daysUntil === 1 ? 'Tomorrow' :
                        `${member.daysUntil} days`}
                  </Badge>
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
                  <Avatar member={member} size="md" ring />
                  <div className="widget-item-info">
                    <div className="widget-item-name t-truncate">{member.name}</div>
                    <div className="widget-item-detail">{member.relationship}</div>
                  </div>
                  <Badge tone="success">New</Badge>
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
              {/* Icon slots previously held the literal words "Tree",
                  "Birthdays", "Map", "Members". */}
              <button className="action-button" onClick={() => handleNavigate('tree')}>
                <Icon name="tree" size={22} className="action-icon" />
                <span className="action-label">View Tree</span>
              </button>
              <button className="action-button" onClick={() => handleNavigate('birthdays')}>
                <Icon name="cake" size={22} className="action-icon" />
                <span className="action-label">Birthdays</span>
              </button>
              <button className="action-button" onClick={() => handleNavigate('locations')}>
                <Icon name="pin" size={22} className="action-icon" />
                <span className="action-label">Locations</span>
              </button>
              <button className="action-button" onClick={() => handleNavigate('list')}>
                <Icon name="users" size={22} className="action-icon" />
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
            {/* All derived from existing dates — no hardcoded values. */}
            {milestones.oldestLiving && (
              <div className="highlight-item">
                <span className="highlight-label">Eldest</span>
                <span className="highlight-value">
                  {milestones.oldestLiving.member.name}
                  <small className="t-tabular"> · {milestones.oldestLiving.age}</small>
                </span>
              </div>
            )}
            {milestones.newestArrival && (
              <div className="highlight-item">
                <span className="highlight-label">Newest arrival</span>
                <span className="highlight-value">
                  {milestones.newestArrival.member.name}
                  <small className="t-tabular"> · {milestones.newestArrival.year}</small>
                </span>
              </div>
            )}
            <div className="highlight-item">
              <span className="highlight-label">Living</span>
              <span className="highlight-value t-tabular">{milestones.livingCount}</span>
            </div>
            {milestones.rememberedCount > 0 && (
              <div className="highlight-item">
                <span className="highlight-label">Remembered</span>
                <span className="highlight-value t-tabular">{milestones.rememberedCount}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeDashboard;

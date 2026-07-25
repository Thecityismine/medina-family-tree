import React, { useMemo, useState } from 'react';
import { Avatar, Icon, SegmentedControl } from './ui';
import MemberDetailModal from './MemberDetailModal';
import { buildTimeline, groupByDecade, EVENT_TYPES } from '../utils/timeline';
import './Timeline.css';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'birth', label: 'Births' },
  { value: 'death', label: 'Remembered' }
];

function Timeline({ members = [] }) {
  const [filter, setFilter] = useState('all');
  const [selectedMember, setSelectedMember] = useState(null);

  const events = useMemo(() => buildTimeline(members), [members]);

  const filtered = useMemo(
    () => (filter === 'all' ? events : events.filter((e) => e.type === filter)),
    [events, filter]
  );

  const decades = useMemo(() => groupByDecade(filtered), [filtered]);

  const span = useMemo(() => {
    if (events.length === 0) return null;
    return { from: events[0].year, to: events[events.length - 1].year };
  }, [events]);

  if (events.length === 0) {
    return (
      <div className="timeline-empty">
        <Icon name="clock" size={40} />
        <p>No dated events yet.</p>
        <p className="t-sm">
          The timeline builds itself from birthdays and memorial dates as you add them.
        </p>
      </div>
    );
  }

  return (
    <div className="timeline">
      <header className="timeline__header">
        <div>
          <h2>Family Timeline</h2>
          {span && (
            <p className="timeline__span t-tabular">
              {span.from} &mdash; {span.to} &middot; {events.length} moments
            </p>
          )}
        </div>
        <SegmentedControl
          ariaLabel="Filter timeline"
          value={filter}
          onChange={setFilter}
          options={FILTERS}
        />
      </header>

      {decades.map((group) => (
        <section key={group.decade} className="decade">
          <h3 className="decade__label t-tabular">{group.label}</h3>

          <ol className="decade__events">
            {group.events.map((event) => {
              const meta = EVENT_TYPES[event.type];
              return (
                <li key={event.id} className={`event event--${event.type}`}>
                  <div className="event__year t-tabular">{event.year}</div>

                  {/* The spine. Decorative: the year and label carry meaning. */}
                  <div className="event__spine" aria-hidden="true">
                    <span className="event__dot">
                      <Icon name={meta.icon} size={12} />
                    </span>
                  </div>

                  <button
                    type="button"
                    className="event__card"
                    onClick={() => setSelectedMember(event.member)}
                  >
                    <Avatar member={event.member} size="sm" ring />
                    <span className="event__body">
                      <span className="event__title t-truncate">{event.title}</span>
                      <span className="event__meta">
                        {meta.label}
                        {event.detail && <> &middot; {event.detail}</>}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      {selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          members={members}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
}

export default Timeline;

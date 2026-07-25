import React, { useMemo } from 'react';
import FamilyUnitCard from './FamilyUnitCard';
import { Avatar, Icon } from './ui';
import { buildFamilyUnits, findUnattached } from '../utils/familyUnits';
import './FamilyUnits.css';

function FamilyUnits({ members = [], onSelectMember }) {
  const units = useMemo(() => buildFamilyUnits(members), [members]);
  const unattached = useMemo(() => findUnattached(members, units), [members, units]);

  if (members.length === 0) {
    return (
      <div className="units-empty">
        <Icon name="users" size={40} />
        <p>No family members yet.</p>
      </div>
    );
  }

  if (units.length === 0) {
    return (
      <div className="units-empty">
        <Icon name="heart" size={40} />
        <p>No households yet.</p>
        <p className="t-sm">
          Households appear once members are linked as spouses or parents.
        </p>
      </div>
    );
  }

  return (
    <div className="units">
      <div className="units__grid animate-in">
        {units.map((unit) => (
          <FamilyUnitCard key={unit.id} unit={unit} onSelectMember={onSelectMember} />
        ))}
      </div>

      {/* Anyone with no spouse and no parent link would otherwise vanish from
          this view entirely — surfaced so the count always reconciles. */}
      {unattached.length > 0 && (
        <section className="units__unattached">
          <h3>Not yet linked</h3>
          <p className="t-sm">
            {unattached.length} {unattached.length === 1 ? 'member has' : 'members have'} no
            spouse or parent connection, so they don&rsquo;t appear in a household above.
          </p>
          <ul className="units__unattached-list">
            {unattached.map((member) => (
              <li key={member.id}>
                <button
                  type="button"
                  className="unit__child"
                  onClick={() => onSelectMember?.(member)}
                >
                  <Avatar member={member} size="sm" ring />
                  <span className="unit__child-name t-truncate">{member.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default FamilyUnits;

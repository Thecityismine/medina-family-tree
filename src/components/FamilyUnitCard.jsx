import React from 'react';
import { Avatar, Icon } from './ui';
import { calculateAge, parseBirthDate } from '../utils/birthdays';

/* A household rather than a person: the couple (or single parent) on top,
   their children beneath. Reading "John & Mary -> Alex, George, Steven"
   carries the shape of a family in a way three separate cards cannot. */

const lifespan = (member) => {
  const born = parseBirthDate(member.birthDate);
  if (!born) return member.relationship || 'Family Member';

  const birthYear = born.getFullYear();
  const died = parseBirthDate(member.passedAwayDate);
  if (died) return birthYear + ' – ' + died.getFullYear();

  const age = calculateAge(member.birthDate);
  return age !== null ? birthYear + ' · ' + age : String(birthYear);
};

function FamilyUnitCard({ unit, onSelectMember }) {
  const { partners, children, type } = unit;

  return (
    <article className="unit">
      <header className="unit__partners">
        {partners.map((partner, index) => (
          <React.Fragment key={partner.id}>
            {index > 0 && (
              <span className="unit__bond" aria-label="married to">
                <Icon name="heart" size={16} />
              </span>
            )}
            <button
              type="button"
              className="unit__partner"
              onClick={() => onSelectMember?.(partner)}
            >
              <Avatar member={partner} size="lg" ring />
              <span className="unit__partner-name">{partner.name}</span>
              <span className="unit__partner-meta t-tabular">{lifespan(partner)}</span>
            </button>
          </React.Fragment>
        ))}
      </header>

      {children.length > 0 && (
        <div className="unit__children">
          <p className="unit__children-label t-label">
            {type === 'single' ? 'Children' : 'Children'} &middot; {children.length}
          </p>
          <ul className="unit__children-list">
            {children.map((child) => (
              <li key={child.id}>
                <button
                  type="button"
                  className="unit__child"
                  onClick={() => onSelectMember?.(child)}
                >
                  <Avatar member={child} size="sm" ring />
                  <span className="unit__child-name t-truncate">{child.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

export default FamilyUnitCard;

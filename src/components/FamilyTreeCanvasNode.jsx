import React from 'react';
import { calculateAge } from '../utils/birthdays';
import { CARD_WIDTH, CARD_HEIGHT } from '../utils/familyTreeLayout';

const NODE_WIDTH = 156;
const NODE_HEIGHT = 116;

function FamilyTreeCanvasNode({ member, x, y, branch, onSelect }) {
  const age = calculateAge(member.birthDate);
  const isYou = ['You (Admin)', 'You', 'Self'].includes(member.relationship);
  const left = x + (CARD_WIDTH - NODE_WIDTH) / 2;
  const top = y + (CARD_HEIGHT - NODE_HEIGHT) / 2;

  return (
    <div
      className={`ftc-node ftc-node--${branch}${isYou ? ' ftc-node--you' : ''}`}
      style={{ width: NODE_WIDTH, height: NODE_HEIGHT, transform: `translate(${left}px, ${top}px)` }}
      onClick={() => onSelect(member)}
    >
      {member.passedAwayDate && (
        <span className="ftc-node-dove" title="Passed away">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M2 13c3.5-1.5 5.8-4 7.5-6.2 1.1-1.5 3.3-1.8 4.8-.7l1.3 1 3.6-1.6-2 3.6 3.8 2.1-4.6.6c-2 .3-3.9-.2-5.6-1.3l-1-.6-1.4 1.4c-1.5 1.6-3.4 2.7-5.6 3.3l-3.8 1L2 13z" />
          </svg>
        </span>
      )}

      <div className="ftc-node-photo">
        {member.photoURL ? (
          <img src={member.photoURL} alt={member.name} />
        ) : (
          <div className="ftc-node-initial">{member.name?.charAt(0).toUpperCase()}</div>
        )}
      </div>

      <div className="ftc-node-name">{member.name}</div>
      <div className="ftc-node-relation">{member.relationship || 'Family Member'}</div>
      {age !== null && <div className="ftc-node-age">Age {age}</div>}
    </div>
  );
}

export default React.memo(FamilyTreeCanvasNode);

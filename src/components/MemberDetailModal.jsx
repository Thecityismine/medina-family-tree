import React from 'react';
import { calculateAge, formatBirthDate } from '../utils/birthdays';
import { Avatar } from './ui';
import './FamilyTree.css';

const formatCreatedAt = (value) => {
  if (!value) return 'Unknown';
  if (typeof value.toDate === 'function') {
    return value.toDate().toLocaleDateString();
  }
  if (typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000).toLocaleDateString();
  }
  if (typeof value._seconds === 'number') {
    return new Date(value._seconds * 1000).toLocaleDateString();
  }
  return 'Unknown';
};

function MemberDetailModal({ member, members, onClose }) {
  if (!member) return null;

  const memberById = new Map(members.map((m) => [m.id, m]));
  const memberNameMap = members.reduce((acc, m) => {
    acc[m.id] = m.name || 'Unnamed member';
    return acc;
  }, {});

  const resolveNames = (ids) => {
    if (!Array.isArray(ids)) return [];
    return ids.map((id) => memberNameMap[id]).filter(Boolean);
  };

  const getParentIdsForIds = (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) return [];
    const nextIds = [];
    ids.forEach((id) => {
      const relative = memberById.get(id);
      if (!relative || !Array.isArray(relative.parentIds)) return;
      relative.parentIds.forEach((parentId) => {
        if (parentId) nextIds.push(parentId);
      });
    });
    return Array.from(new Set(nextIds));
  };

  const childrenNames = members
    .filter((m) => Array.isArray(m.parentIds) && m.parentIds.includes(member.id))
    .map((m) => m.name || 'Unnamed member')
    .sort((a, b) => a.localeCompare(b));

  const parentIds = Array.isArray(member.parentIds) ? member.parentIds : [];
  const parentNames = resolveNames(parentIds);
  const grandParentIds = getParentIdsForIds(parentIds);
  const grandParentNames = resolveNames(grandParentIds);
  const greatGrandParentIds = getParentIdsForIds(grandParentIds);
  const greatGrandParentNames = resolveNames(greatGrandParentIds);

  return (
    <div className="tree-modal-overlay" onClick={onClose}>
      <div className="tree-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="tree-modal-close" onClick={onClose}>X</button>

        <div className="tree-modal-header">
          <Avatar member={member} size="xl" ring className="tree-modal-photo" />
          <div className="tree-modal-title">
            <h3>{member.name}</h3>
            <p>{member.relationship || 'Family Member'}</p>
          </div>
        </div>

        <div className="tree-modal-body">
          {parentNames.length > 0 && (
            <div className="tree-modal-detail">
              <span className="detail-label">Parents:</span>
              <span className="detail-value">{parentNames.join(', ')}</span>
            </div>
          )}

          {grandParentNames.length > 0 && (
            <div className="tree-modal-detail">
              <span className="detail-label">Grandparents:</span>
              <span className="detail-value">{grandParentNames.join(', ')}</span>
            </div>
          )}

          {greatGrandParentNames.length > 0 && (
            <div className="tree-modal-detail">
              <span className="detail-label">Great Grandparents:</span>
              <span className="detail-value">{greatGrandParentNames.join(', ')}</span>
            </div>
          )}

          {childrenNames.length > 0 && (
            <div className="tree-modal-detail">
              <span className="detail-label">Children:</span>
              <span className="detail-value">{childrenNames.join(', ')}</span>
            </div>
          )}

          <div className="tree-modal-detail">
            <span className="detail-label">Birthday:</span>
            <span className="detail-value">{formatBirthDate(member.birthDate)}</span>
          </div>

          {member.passedAwayDate && (
            <div className="tree-modal-detail">
              <span className="detail-label">Passed Away:</span>
              <span className="detail-value">{formatBirthDate(member.passedAwayDate)}</span>
            </div>
          )}

          {calculateAge(member.birthDate) !== null && (
            <div className="tree-modal-detail">
              <span className="detail-label">Age:</span>
              <span className="detail-value">{calculateAge(member.birthDate)} years old</span>
            </div>
          )}

          {member.location && (
            <div className="tree-modal-detail">
              <span className="detail-label">Location:</span>
              <span className="detail-value">{member.location}</span>
            </div>
          )}

          <div className="tree-modal-detail">
            <span className="detail-label">Added:</span>
            <span className="detail-value">{formatCreatedAt(member.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MemberDetailModal;

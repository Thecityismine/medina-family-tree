import React, { useState, useEffect } from 'react';
import './FamilyTree.css';

const RELATION_LEVELS = {
  'Great Grandfather': 1,
  'Great Grandmother': 1,
  'Great Grandparent': 1,
  Grandfather: 2,
  Grandmother: 2,
  Father: 3,
  Mother: 3,
  "Anseli's Mother": 3,
  'Great Uncle': 3,
  'Great Aunt': 3,
  Uncle: 3,
  Aunt: 3,
  'You (Admin)': 4,
  You: 4,
  Self: 4,
  Spouse: 4,
  Partner: 4,
  Brother: 4,
  Sister: 4,
  Sibling: 4,
  Cousin: 4,
  'First Cousin': 4,
  Son: 5,
  Daughter: 5,
  Child: 5,
  Nephew: 5,
  Niece: 5,
  Grandson: 6,
  Granddaughter: 6,
  Grandchild: 6,
  'Great Grandson': 7,
  'Great Granddaughter': 7,
  'Great Grandchild': 7,
  'Great Grandkid': 7
};

const SELF_RELATIONSHIPS = ['You (Admin)', 'You', 'Self'];

const getDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  if (typeof value._seconds === 'number') return new Date(value._seconds * 1000);
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

const formatDate = (value) => {
  const date = getDate(value);
  if (!date) return 'Not set';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const calculateAge = (birthDate) => {
  const date = getDate(birthDate);
  if (!date) return null;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age--;
  }
  return age;
};

const formatCreatedAt = (createdAt) => {
  const date = getDate(createdAt);
  return date ? date.toLocaleDateString() : 'Unknown';
};

const resolveTitles = (level, selfLevel) => {
  if (selfLevel !== null) {
    const offset = level - selfLevel;
    if (offset === -3) return 'Great-Grandparents';
    if (offset === -2) return 'Grandparents';
    if (offset === -1) return 'Parents & Family Elders';
    if (offset === 0) return 'Your Generation';
    if (offset === 1) return 'Children & Younger Family';
    if (offset === 2) return 'Grandchildren';
    if (offset === 3) return 'Great-Grandchildren';
    return `Generation ${level}`;
  }

  if (level === 1) return 'Great-Grandparents';
  if (level === 2) return 'Grandparents';
  if (level === 3) return 'Parents & Family Elders';
  if (level === 4) return 'Your Generation';
  if (level === 5) return 'Children & Younger Family';
  if (level === 6) return 'Grandchildren';
  if (level === 7) return 'Great-Grandchildren';
  return `Generation ${level}`;
};

function FamilyTree({ members }) {
  const [selectedMember, setSelectedMember] = useState(null);
  const [treeData, setTreeData] = useState({ generations: [], stats: {} });

  useEffect(() => {
    buildTreeStructure();
  }, [members]);

  const buildTreeStructure = () => {
    if (!Array.isArray(members) || members.length === 0) {
      setTreeData({ generations: [], stats: {} });
      return;
    }

    const memberById = new Map(members.map((member) => [member.id, member]));
    const generationById = new Map();
    const childrenByParent = new Map();

    members.forEach((member) => {
      if (!Array.isArray(member.parentIds)) return;
      member.parentIds.forEach((parentId) => {
        if (!childrenByParent.has(parentId)) {
          childrenByParent.set(parentId, []);
        }
        childrenByParent.get(parentId).push(member.id);
      });
    });

    const selfMember = members.find((member) =>
      SELF_RELATIONSHIPS.includes(member.relationship)
    );

    const setLevel = (memberId, level) => {
      if (!memberById.has(memberId)) return;
      if (!generationById.has(memberId)) {
        generationById.set(memberId, level);
      }
    };

    members.forEach((member) => {
      const fallbackLevel = RELATION_LEVELS[member.relationship];
      if (Number.isFinite(fallbackLevel)) {
        setLevel(member.id, fallbackLevel);
      }
    });

    if (selfMember) {
      const queue = [];
      const selfLevel = generationById.get(selfMember.id) || 4;
      generationById.set(selfMember.id, selfLevel);
      queue.push(selfMember.id);

      while (queue.length > 0) {
        const memberId = queue.shift();
        const member = memberById.get(memberId);
        const currentLevel = generationById.get(memberId);

        if (!member || !Number.isFinite(currentLevel)) continue;

        if (Array.isArray(member.parentIds)) {
          member.parentIds.forEach((parentId) => {
            if (!memberById.has(parentId)) return;
            if (!generationById.has(parentId)) {
              generationById.set(parentId, currentLevel - 1);
              queue.push(parentId);
            }
          });
        }

        (childrenByParent.get(memberId) || []).forEach((childId) => {
          if (!memberById.has(childId)) return;
          if (!generationById.has(childId)) {
            generationById.set(childId, currentLevel + 1);
            queue.push(childId);
          }
        });

        if (Array.isArray(member.spouseIds)) {
          member.spouseIds.forEach((spouseId) => {
            if (!memberById.has(spouseId)) return;
            if (!generationById.has(spouseId)) {
              generationById.set(spouseId, currentLevel);
              queue.push(spouseId);
            }
          });
        }
      }
    }

    const visiting = new Set();
    const computeFromParents = (memberId) => {
      if (generationById.has(memberId)) return generationById.get(memberId);
      if (visiting.has(memberId)) return null;

      visiting.add(memberId);
      const member = memberById.get(memberId);
      const parentIds = Array.isArray(member?.parentIds)
        ? member.parentIds.filter((parentId) => memberById.has(parentId))
        : [];

      let level = null;
      if (parentIds.length > 0) {
        const parentLevels = parentIds
          .map((parentId) => computeFromParents(parentId))
          .filter((value) => Number.isFinite(value));

        if (parentLevels.length > 0) {
          level = Math.max(...parentLevels) + 1;
        }
      }

      visiting.delete(memberId);

      if (Number.isFinite(level)) {
        generationById.set(memberId, level);
      }

      return level;
    };

    members.forEach((member) => {
      computeFromParents(member.id);
    });

    members.forEach((member) => {
      if (generationById.has(member.id)) return;
      generationById.set(member.id, 4);
    });

    members.forEach((member) => {
      if (!Array.isArray(member.spouseIds)) return;
      const memberLevel = generationById.get(member.id);
      member.spouseIds.forEach((spouseId) => {
        if (!memberById.has(spouseId)) return;
        if (!generationById.has(spouseId)) {
          generationById.set(spouseId, memberLevel);
        }
      });
    });

    const minLevel = Math.min(...Array.from(generationById.values()));
    const shift = 1 - minLevel;
    const normalizedById = new Map();
    generationById.forEach((level, memberId) => {
      normalizedById.set(memberId, level + shift);
    });

    const selfLevel = selfMember ? normalizedById.get(selfMember.id) : null;
    const generationsMap = new Map();

    members.forEach((member) => {
      const level = normalizedById.get(member.id) || 1;
      if (!generationsMap.has(level)) {
        generationsMap.set(level, []);
      }
      generationsMap.get(level).push(member);
    });

    const sortMembers = (a, b) => {
      const dateA = getDate(a.birthDate);
      const dateB = getDate(b.birthDate);
      if (dateA && dateB) return dateA - dateB;
      if (dateA) return -1;
      if (dateB) return 1;
      return (a.name || '').localeCompare(b.name || '');
    };

    const levels = Array.from(generationsMap.keys()).sort((a, b) => a - b);
    const generations = levels.map((level) => ({
      level,
      title: resolveTitles(level, selfLevel ?? null),
      members: generationsMap.get(level).sort(sortMembers)
    }));

    const stats = {
      totalGenerations: generations.length,
      totalMembers: members.length,
      largestGeneration:
        generations.length > 0
          ? Math.max(...generations.map((generation) => generation.members.length))
          : 0
    };

    setTreeData({ generations, stats });
  };

  if (!Array.isArray(members) || members.length === 0) {
    return (
      <div className="tree-empty-state">
        <div className="tree-empty-icon">Tree</div>
        <h3>No Family Members Yet</h3>
        <p>Add family members to see your family tree</p>
      </div>
    );
  }

  return (
    <div className="family-tree-container">
      <div className="tree-header">
        <h2>The Medina Family Tree</h2>
        <p className="tree-subtitle">Est. 1947</p>
      </div>

      <div className="tree-stats">
        <div className="tree-stat-card">
          <div className="tree-stat-number">{treeData.stats.totalGenerations}</div>
          <div className="tree-stat-label">Generations</div>
        </div>
        <div className="tree-stat-card">
          <div className="tree-stat-number">{treeData.stats.totalMembers}</div>
          <div className="tree-stat-label">Family Members</div>
        </div>
        <div className="tree-stat-card">
          <div className="tree-stat-number">{treeData.stats.largestGeneration}</div>
          <div className="tree-stat-label">Largest Generation</div>
        </div>
      </div>

      <div className="tree-info-box">
        <div className="info-icon">i</div>
        <div className="info-text">
          <strong>How to use:</strong> Click a family member to view details. Generations are
          built from parent links, spouse links, and relationship labels.
        </div>
      </div>

      <div className="tree-visualization">
        {treeData.generations.map((generation, index) => (
          <div key={generation.level} className="generation-group">
            <div className="generation-header">
              <span className="generation-badge">Generation {generation.level}</span>
              <span className="generation-title">{generation.title}</span>
            </div>

            {index > 0 && <div className="connection-line"></div>}

            <div className="generation-members">
              {generation.members.map((member) => {
                const age = calculateAge(member.birthDate);
                const isYou = SELF_RELATIONSHIPS.includes(member.relationship);
                const memberName = member.name || 'Unnamed member';

                return (
                  <div
                    key={member.id}
                    className={`tree-person-card ${isYou ? 'is-you' : ''}`}
                    onClick={() => setSelectedMember(member)}
                  >
                    <div className="tree-person-photo">
                      {member.photoURL ? (
                        <img src={member.photoURL} alt={memberName} />
                      ) : (
                        <div className="tree-person-initial">
                          {memberName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="tree-person-info">
                      <div className="tree-person-name">{memberName}</div>
                      <div className="tree-person-relation">
                        {member.relationship || 'Family Member'}
                      </div>
                      {age !== null && <div className="tree-person-age">Age {age}</div>}
                    </div>

                    {isYou && <div className="you-badge">You</div>}
                  </div>
                );
              })}
            </div>

            {index < treeData.generations.length - 1 && <div className="generation-spacer"></div>}
          </div>
        ))}
      </div>

      <div className="tree-legend">
        <h4>Legend</h4>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-badge you-badge">You</div>
            <span>Your profile</span>
          </div>
          <div className="legend-item">
            <div className="legend-line"></div>
            <span>Family connections</span>
          </div>
        </div>
      </div>

      {selectedMember && (
        <div className="tree-modal-overlay" onClick={() => setSelectedMember(null)}>
          <div className="tree-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="tree-modal-close" onClick={() => setSelectedMember(null)}>
              X
            </button>

            <div className="tree-modal-header">
              <div className="tree-modal-photo">
                {selectedMember.photoURL ? (
                  <img src={selectedMember.photoURL} alt={selectedMember.name || 'Family member'} />
                ) : (
                  <div className="tree-modal-initial">
                    {(selectedMember.name || '?').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="tree-modal-title">
                <h3>{selectedMember.name || 'Unnamed member'}</h3>
                <p>{selectedMember.relationship || 'Family Member'}</p>
              </div>
            </div>

            <div className="tree-modal-body">
              <div className="tree-modal-detail">
                <span className="detail-label">Birthday:</span>
                <span className="detail-value">{formatDate(selectedMember.birthDate)}</span>
              </div>

              {selectedMember.passedAwayDate && (
                <div className="tree-modal-detail">
                  <span className="detail-label">Passed Away:</span>
                  <span className="detail-value">{formatDate(selectedMember.passedAwayDate)}</span>
                </div>
              )}

              {calculateAge(selectedMember.birthDate) !== null && (
                <div className="tree-modal-detail">
                  <span className="detail-label">Age:</span>
                  <span className="detail-value">
                    {calculateAge(selectedMember.birthDate)} years old
                  </span>
                </div>
              )}

              {selectedMember.location && (
                <div className="tree-modal-detail">
                  <span className="detail-label">Location:</span>
                  <span className="detail-value">{selectedMember.location}</span>
                </div>
              )}

              <div className="tree-modal-detail">
                <span className="detail-label">Added:</span>
                <span className="detail-value">{formatCreatedAt(selectedMember.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FamilyTree;

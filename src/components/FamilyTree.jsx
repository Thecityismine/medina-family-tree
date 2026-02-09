import React, { useEffect, useMemo, useState } from 'react';
import { calculateAge, formatBirthDate, parseBirthDate } from '../utils/birthdays';
import './FamilyTree.css';

const SELF_RELATIONSHIPS = ['You (Admin)', 'You', 'Self'];

const RELATION_OFFSETS = {
  Father: -1,
  Mother: -1,
  Grandfather: -2,
  Grandmother: -2,
  'Great Grandfather': -3,
  'Great Grandmother': -3,
  "Anseli's Mother": -1,
  Uncle: -1,
  Aunt: -1,
  'Great Uncle': -2,
  'Great Aunt': -2,
  Spouse: 0,
  Partner: 0,
  Brother: 0,
  Sister: 0,
  Sibling: 0,
  Cousin: 0,
  'First Cousin': 0,
  Son: 1,
  Daughter: 1,
  Child: 1,
  Nephew: 1,
  Niece: 1,
  Grandson: 2,
  Granddaughter: 2,
  Grandchild: 2
};

const GENERATION_TITLES = {
  1: 'Parents & In-Laws',
  2: 'Your Generation',
  3: 'Children',
  4: 'Grandchildren'
};

const getRelationOffset = (relationship) => {
  if (!relationship) return null;
  return Object.prototype.hasOwnProperty.call(RELATION_OFFSETS, relationship)
    ? RELATION_OFFSETS[relationship]
    : null;
};

const sortMembers = (a, b) => {
  const dateA = parseBirthDate(a.birthDate);
  const dateB = parseBirthDate(b.birthDate);
  if (dateA && dateB) return dateA - dateB;
  if (dateA) return -1;
  if (dateB) return 1;
  return (a.name || '').localeCompare(b.name || '');
};

const createMemberSorter = (selfMember) => {
  if (!selfMember) return sortMembers;
  const spouseIds = new Set(selfMember.spouseIds || []);
  return (a, b) => {
    const rank = (member) => {
      if (member.id === selfMember.id) return 0;
      if (spouseIds.has(member.id)) return 1;
      return 2;
    };
    const rankDiff = rank(a) - rank(b);
    if (rankDiff !== 0) return rankDiff;
    return sortMembers(a, b);
  };
};

function FamilyTree({ members }) {
  const [selectedMember, setSelectedMember] = useState(null);
  const [treeData, setTreeData] = useState({ generations: [], stats: {} });
  const memberById = useMemo(() => {
    return new Map(members.map((member) => [member.id, member]));
  }, [members]);
  const memberNameMap = useMemo(() => {
    return members.reduce((acc, member) => {
      acc[member.id] = member.name || 'Unnamed member';
      return acc;
    }, {});
  }, [members]);

  const childrenMap = useMemo(() => {
    const map = {};
    members.forEach((member) => {
      if (!Array.isArray(member.parentIds)) return;
      member.parentIds.forEach((parentId) => {
        if (!map[parentId]) {
          map[parentId] = [];
        }
        map[parentId].push(member.name || 'Unnamed member');
      });
    });
    Object.keys(map).forEach((parentId) => {
      map[parentId].sort((a, b) => a.localeCompare(b));
    });
    return map;
  }, [members]);

  useEffect(() => {
    buildTreeStructure();
  }, [members]);

  const buildTreeStructure = () => {
    const memberMap = new Map(members.map((member) => [member.id, member]));
    const generationById = new Map();
    const selfMember = members.find((member) =>
      SELF_RELATIONSHIPS.includes(member.relationship)
    );

    const getParentIds = (member) => {
      if (!member || !Array.isArray(member.parentIds)) return [];
      return member.parentIds.filter((id) => memberMap.has(id));
    };

    if (selfMember) {
      const childrenMap = new Map();
      members.forEach((member) => {
        getParentIds(member).forEach((parentId) => {
          if (!childrenMap.has(parentId)) {
            childrenMap.set(parentId, []);
          }
          childrenMap.get(parentId).push(member.id);
        });
      });

      const queue = [];
      const setLevel = (memberId, level) => {
        if (!generationById.has(memberId)) {
          generationById.set(memberId, level);
          queue.push(memberId);
        }
      };

      setLevel(selfMember.id, 0);

      while (queue.length > 0) {
        const currentId = queue.shift();
        const currentLevel = generationById.get(currentId);
        const currentMember = memberMap.get(currentId);

        getParentIds(currentMember).forEach((parentId) => {
          setLevel(parentId, currentLevel - 1);
        });

        (childrenMap.get(currentId) || []).forEach((childId) => {
          setLevel(childId, currentLevel + 1);
        });

        if (Array.isArray(currentMember.spouseIds)) {
          currentMember.spouseIds.forEach((spouseId) => {
            setLevel(spouseId, currentLevel);
          });
        }
      }

      members.forEach((member) => {
        if (generationById.has(member.id)) return;
        const offset = getRelationOffset(member.relationship);
        if (offset !== null) {
          generationById.set(member.id, offset);
        }
      });
    } else {
      const visiting = new Set();

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
    }

    if (generationById.size === 0) {
      return;
    }

    const minLevel = Math.min(...generationById.values());
    const shift = 1 - minLevel;
    const normalizedGenerations = new Map();
    generationById.forEach((level, memberId) => {
      normalizedGenerations.set(memberId, level + shift);
    });

    const selfGeneration = selfMember ? normalizedGenerations.get(selfMember.id) : null;

    const generationMap = new Map();
    members.forEach((member) => {
      const generation = normalizedGenerations.get(member.id) || 1;
      if (!generationMap.has(generation)) {
        generationMap.set(generation, []);
      }
      generationMap.get(generation).push(member);
    });

    const generationLevels = Array.from(generationMap.keys()).sort((a, b) => a - b);
    const sorter = createMemberSorter(selfMember);
    const resolveTitle = (level) => {
      if (!selfMember || selfGeneration === null) {
        return GENERATION_TITLES[level] || `Generation ${level}`;
      }

      const offset = level - selfGeneration;
      if (offset === 0) return 'Your Generation';
      if (offset === -1) return 'Parents & In-Laws';
      if (offset === -2) return 'Grandparents';
      if (offset === -3) return 'Great-Grandparents';
      if (offset === 1) return 'Children';
      if (offset === 2) return 'Grandchildren';
      if (offset === 3) return 'Great-Grandchildren';
      return `Generation ${level}`;
    };

    const generations = generationLevels.map((level) => ({
      level,
      title: resolveTitle(level),
      members: generationMap.get(level).sort(sorter)
    }));

    const stats = {
      totalGenerations: generationLevels.length,
      totalMembers: members.length,
      largestGeneration: generations.length > 0
        ? Math.max(...generations.map((generation) => generation.members.length))
        : 0
    };

    setTreeData({ generations, stats });
  };

  const openMemberModal = (member) => {
    setSelectedMember(member);
  };

  const closeMemberModal = () => {
    setSelectedMember(null);
  };

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
    const parsed = parseBirthDate(value);
    return parsed ? parsed.toLocaleDateString() : 'Unknown';
  };

  const resolveNames = (ids) => {
    if (!Array.isArray(ids)) return [];
    return ids.map((id) => memberNameMap[id]).filter(Boolean);
  };

  const getParentIdsForIds = (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) return [];
    const nextIds = [];
    ids.forEach((id) => {
      const member = memberById.get(id);
      if (!member || !Array.isArray(member.parentIds)) return;
      member.parentIds.forEach((parentId) => {
        if (parentId) nextIds.push(parentId);
      });
    });
    return Array.from(new Set(nextIds));
  };

  if (members.length === 0) {
    return (
      <div className="tree-empty-state">
        <div className="tree-empty-icon">0</div>
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
          <strong>How to use:</strong> Click on any family member to view their full details.
          The tree uses parent links to place relatives in the correct generation.
        </div>
      </div>

      <div className="tree-visualization">
        {treeData.generations.map((generation, genIndex) => (
          <div key={generation.level} className="generation-group">
            <div className="generation-header">
              <span className="generation-badge">Generation {generation.level}</span>
              <span className="generation-title">{generation.title}</span>
            </div>

            {genIndex > 0 && <div className="connection-line"></div>}

            <div className="generation-members">
              {generation.members.map((member) => {
                const age = calculateAge(member.birthDate);
                const isYou = ['You (Admin)', 'You', 'Self'].includes(member.relationship);

                return (
                  <div
                    key={member.id}
                    className={`tree-person-card ${isYou ? 'is-you' : ''}`}
                    onClick={() => openMemberModal(member)}
                  >
                    {member.passedAwayDate && (
                      <span className="tree-person-dove" title="Passed away">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M2 13c3.5-1.5 5.8-4 7.5-6.2 1.1-1.5 3.3-1.8 4.8-.7l1.3 1 3.6-1.6-2 3.6 3.8 2.1-4.6.6c-2 .3-3.9-.2-5.6-1.3l-1-.6-1.4 1.4c-1.5 1.6-3.4 2.7-5.6 3.3l-3.8 1L2 13z" />
                        </svg>
                      </span>
                    )}
                    <div className="tree-person-photo">
                      {member.photoURL ? (
                        <img src={member.photoURL} alt={member.name} />
                      ) : (
                        <div className="tree-person-initial">
                          {member.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="tree-person-info">
                      <div className="tree-person-name">{member.name}</div>
                      <div className="tree-person-relation">{member.relationship || 'Family Member'}</div>
                      {age !== null && (
                        <div className="tree-person-age">Age {age}</div>
                      )}
                    </div>

                    {isYou && <div className="you-badge">You</div>}
                  </div>
                );
              })}
            </div>

            {genIndex < treeData.generations.length - 1 && (
              <div className="generation-spacer"></div>
            )}
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
        <div className="tree-modal-overlay" onClick={closeMemberModal}>
          <div className="tree-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="tree-modal-close" onClick={closeMemberModal}>X</button>

            <div className="tree-modal-header">
              <div className="tree-modal-photo">
                {selectedMember.photoURL ? (
                  <img src={selectedMember.photoURL} alt={selectedMember.name} />
                ) : (
                  <div className="tree-modal-initial">
                    {selectedMember.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="tree-modal-title">
                <h3>{selectedMember.name}</h3>
                <p>{selectedMember.relationship || 'Family Member'}</p>
              </div>
            </div>

            <div className="tree-modal-body">
              {(() => {
                const parentIds = Array.isArray(selectedMember.parentIds)
                  ? selectedMember.parentIds
                  : [];
                const parentNames = resolveNames(parentIds);
                const grandParentIds = getParentIdsForIds(parentIds);
                const grandParentNames = resolveNames(grandParentIds);
                const greatGrandParentIds = getParentIdsForIds(grandParentIds);
                const greatGrandParentNames = resolveNames(greatGrandParentIds);

                return (
                  <>
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
                  </>
                );
              })()}

              {childrenMap[selectedMember.id]?.length > 0 && (
                <div className="tree-modal-detail">
                  <span className="detail-label">Children:</span>
                  <span className="detail-value">
                    {childrenMap[selectedMember.id].join(', ')}
                  </span>
                </div>
              )}

              <div className="tree-modal-detail">
                <span className="detail-label">Birthday:</span>
                <span className="detail-value">{formatBirthDate(selectedMember.birthDate)}</span>
              </div>

              {selectedMember.passedAwayDate && (
                <div className="tree-modal-detail">
                  <span className="detail-label">Passed Away:</span>
                  <span className="detail-value">{formatBirthDate(selectedMember.passedAwayDate)}</span>
                </div>
              )}

              {calculateAge(selectedMember.birthDate) !== null && (
                <div className="tree-modal-detail">
                  <span className="detail-label">Age:</span>
                  <span className="detail-value">{calculateAge(selectedMember.birthDate)} years old</span>
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

import React, { useEffect, useState } from 'react';
import { Avatar, Card, Icon, SegmentedControl, Stat } from './ui';
import FamilyUnits from './FamilyUnits';
import { calculateAge, parseBirthDate } from '../utils/birthdays';
import { computeGenerations, getGenerationTitle } from '../utils/familyTreeGenerations';
import MemberDetailModal from './MemberDetailModal';
import FamilyTreeCanvas from './FamilyTreeCanvas';
import './FamilyTree.css';

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
  const [mode, setMode] = useState('list');
  const [selectedMember, setSelectedMember] = useState(null);
  const [treeData, setTreeData] = useState({ generations: [], stats: {} });

  useEffect(() => {
    buildTreeStructure();
  }, [members]);

  const buildTreeStructure = () => {
    const { generationById: normalizedGenerations, selfMember } = computeGenerations(members);

    if (normalizedGenerations.size === 0) {
      return;
    }

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
    const resolveTitle = (level) => getGenerationTitle(level, selfMember ? selfGeneration : null);

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

  if (members.length === 0) {
    return (
      <div className="tree-empty-state">
        <Icon name="tree" size={40} className="tree-empty-icon" />
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

      {/* Was two free-floating pills with no shared track, so they read as
          unrelated buttons rather than as alternatives. */}
      <div className="tree-mode-toggle">
        <SegmentedControl
          ariaLabel="Tree view"
          value={mode}
          onChange={setMode}
          size="lg"
          options={[
            { value: 'list', label: 'Generations', icon: <Icon name="grid" size={16} /> },
            { value: 'families', label: 'Families', icon: <Icon name="heart" size={16} /> },
            { value: 'canvas', label: 'Canvas', icon: <Icon name="tree" size={16} /> }
          ]}
        />
      </div>

      <div className="tree-stats">
        <Card surface="1" pad="md">
          <Stat value={treeData.stats.totalGenerations} label="Generations" />
        </Card>
        <Card surface="1" pad="md">
          <Stat value={treeData.stats.totalMembers} label="Family Members" />
        </Card>
        <Card surface="1" pad="md">
          <Stat value={treeData.stats.largestGeneration} label="Largest Generation" />
        </Card>
      </div>

      {mode === 'canvas' && (
        <FamilyTreeCanvas members={members} onSelectMember={openMemberModal} />
      )}

      {mode === 'families' && (
        <FamilyUnits members={members} onSelectMember={openMemberModal} />
      )}

      {mode === 'list' && (
        <>
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
                    <Avatar member={member} size="lg" ring className="tree-person-photo" />

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
        </>
      )}

      {selectedMember && (
        <MemberDetailModal member={selectedMember} members={members} onClose={closeMemberModal} />
      )}
    </div>
  );
}

export default FamilyTree;

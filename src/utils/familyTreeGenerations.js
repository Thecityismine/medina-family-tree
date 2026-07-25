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

const getRelationOffset = (relationship) => {
  if (!relationship) return null;
  return Object.prototype.hasOwnProperty.call(RELATION_OFFSETS, relationship)
    ? RELATION_OFFSETS[relationship]
    : null;
};

/**
 * Assigns every member a generation level via BFS out from "you" (parents
 * one level up, children one level down, spouses same level), falling back
 * to RELATION_OFFSETS for anyone the BFS doesn't reach, and finally to a
 * pure parent-depth walk if there's no "you" at all. Normalized so the
 * topmost generation is level 1. Shared by the List view and Canvas view so
 * both agree on who belongs in which row.
 */
export function computeGenerations(members) {
  const memberMap = new Map(members.map((member) => [member.id, member]));
  const generationById = new Map();
  const selfMember = members.find((member) => SELF_RELATIONSHIPS.includes(member.relationship));

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
    return { generationById, selfMember };
  }

  const minLevel = Math.min(...generationById.values());
  const shift = 1 - minLevel;
  const normalizedGenerations = new Map();
  generationById.forEach((level, memberId) => {
    normalizedGenerations.set(memberId, level + shift);
  });

  return { generationById: normalizedGenerations, selfMember };
}

const GENERATION_TITLES = {
  1: 'Parents & In-Laws',
  2: 'Your Generation',
  3: 'Children',
  4: 'Grandchildren'
};

/**
 * Human-readable label for a generation level, relative to "you" when
 * known (so it reads "Grandparents" / "Children" etc. from your point of
 * view), falling back to absolute labels otherwise. Shared by the List
 * view and Canvas view so row labels always agree.
 */
export function getGenerationTitle(level, selfGeneration) {
  if (selfGeneration === null || selfGeneration === undefined) {
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
}

import { computeGenerations, getGenerationTitle } from './familyTreeGenerations';

export const CARD_WIDTH = 180;
export const CARD_HEIGHT = 140;

const H_GAP = 40;
const V_GAP = 70;
const COLUMN_GAP = 110;
const PADDING_TOP_RIGHT_BOTTOM = 80;
const PADDING_LEFT = 190; // extra room for the generation row labels

const CELL_WIDTH = CARD_WIDTH + H_GAP;
const ROW_HEIGHT = CARD_HEIGHT + V_GAP;

const BRANCHES = ['medina', 'anseli', 'shared'];

const emptyLayout = (members, message) => ({
  ready: false,
  message,
  blocksByBranch: { medina: { nodes: [], connectors: [] }, anseli: { nodes: [], connectors: [] }, shared: { nodes: [], connectors: [] } },
  canvasSize: { width: 0, height: 0 },
  rows: [],
  unplaced: members
});

function buildChildrenMap(members) {
  const map = new Map();
  members.forEach((member) => {
    (member.parentIds || []).forEach((parentId) => {
      if (!map.has(parentId)) map.set(parentId, []);
      map.get(parentId).push(member.id);
    });
  });
  return map;
}

function collectDescendants(startId, childrenMap) {
  const result = new Set();
  const queue = [startId];
  while (queue.length > 0) {
    const current = queue.shift();
    (childrenMap.get(current) || []).forEach((childId) => {
      if (!result.has(childId)) {
        result.add(childId);
        queue.push(childId);
      }
    });
  }
  return result;
}

/**
 * Orders one branch's members within each generation row (spouses kept
 * adjacent, siblings kept together, otherwise sorted near their parents'
 * slot from the row above so children roughly line up under parents), and
 * returns the slot index each member landed on plus how many slots each
 * row needed.
 */
function assignSlots(includedMembers, generationById, effectiveBranch, targetBranch) {
  const byLevel = new Map();
  includedMembers.forEach((member) => {
    if (effectiveBranch.get(member.id) !== targetBranch) return;
    const level = generationById.get(member.id);
    if (!byLevel.has(level)) byLevel.set(level, []);
    byLevel.get(level).push(member);
  });

  const levels = Array.from(byLevel.keys()).sort((a, b) => a - b);
  const slotById = new Map();
  const levelWidths = new Map();

  levels.forEach((level) => {
    const rowMembers = byLevel.get(level);

    const sortKey = (member) => {
      const parentSlots = (member.parentIds || [])
        .map((id) => slotById.get(id))
        .filter((slot) => slot !== undefined);
      if (parentSlots.length) return parentSlots.reduce((a, b) => a + b, 0) / parentSlots.length;
      return null;
    };
    const siblingKey = (member) => (member.parentIds || []).slice().sort().join('|');

    const sorted = [...rowMembers].sort((a, b) => {
      const ka = sortKey(a);
      const kb = sortKey(b);
      if (ka === null && kb === null) return (a.name || '').localeCompare(b.name || '');
      if (ka === null) return 1;
      if (kb === null) return -1;
      if (ka !== kb) return ka - kb;
      const sa = siblingKey(a);
      const sb = siblingKey(b);
      if (sa !== sb) return sa.localeCompare(sb);
      return (a.name || '').localeCompare(b.name || '');
    });

    const placed = new Set();
    const order = [];
    sorted.forEach((member) => {
      if (placed.has(member.id)) return;
      order.push(member);
      placed.add(member.id);

      const spouseId = (member.spouseIds || [])[0];
      if (spouseId && !placed.has(spouseId)) {
        const spouseMember = rowMembers.find((m) => m.id === spouseId);
        if (spouseMember) {
          order.push(spouseMember);
          placed.add(spouseId);
        }
      }
    });

    order.forEach((member, index) => {
      slotById.set(member.id, index);
    });
    levelWidths.set(level, order.length);
  });

  return { slotById, levelWidths, levels };
}

/**
 * Builds the canvas layout: you + your spouse + your direct descendants
 * always anchor the center column (regardless of their own branch tag —
 * they're "the trunk", not either side), your tagged blood relatives fan
 * out left, your spouse's fan out right, both hugging the center column so
 * the whole thing reads as one connected tree. Generation rows are shared
 * with the List view's own BFS so both always agree on who's in which row.
 */
export function buildFamilyTreeCanvasLayout(members, options = {}) {
  const collapsedIds = options.collapsedIds || new Set();

  const { generationById, selfMember } = computeGenerations(members);
  if (!selfMember) {
    return emptyLayout(
      members,
      'Set a relationship of "You", "You (Admin)", or "Self" on your own entry to enable the canvas view.'
    );
  }

  const spouseId = Array.isArray(selfMember.spouseIds) ? selfMember.spouseIds[0] : null;
  const childrenMap = buildChildrenMap(members);

  const centerIds = new Set([selfMember.id]);
  if (spouseId) centerIds.add(spouseId);
  collectDescendants(selfMember.id, childrenMap).forEach((id) => centerIds.add(id));
  if (spouseId) collectDescendants(spouseId, childrenMap).forEach((id) => centerIds.add(id));

  const effectiveBranch = new Map();
  members.forEach((member) => {
    if (!generationById.has(member.id)) return;
    if (centerIds.has(member.id)) {
      effectiveBranch.set(member.id, 'shared');
    } else if (BRANCHES.includes(member.branch)) {
      effectiveBranch.set(member.id, member.branch);
    }
  });

  const hiddenByCollapse = new Set();
  collapsedIds.forEach((id) => {
    collectDescendants(id, childrenMap).forEach((descendantId) => hiddenByCollapse.add(descendantId));
  });

  const includedMembers = members.filter(
    (m) => effectiveBranch.has(m.id) && !hiddenByCollapse.has(m.id)
  );

  if (includedMembers.length === 0) {
    return emptyLayout(members, 'Tag family members with a branch in Settings to enable the canvas view.');
  }

  const medina = assignSlots(includedMembers, generationById, effectiveBranch, 'medina');
  const anseli = assignSlots(includedMembers, generationById, effectiveBranch, 'anseli');
  const shared = assignSlots(includedMembers, generationById, effectiveBranch, 'shared');

  const medinaColumnWidth = Math.max(0, ...Array.from(medina.levelWidths.values(), (n) => n * CELL_WIDTH));
  const anseliColumnWidth = Math.max(0, ...Array.from(anseli.levelWidths.values(), (n) => n * CELL_WIDTH));
  const sharedColumnWidth = Math.max(0, ...Array.from(shared.levelWidths.values(), (n) => n * CELL_WIDTH));

  const sharedLeftEdge = -sharedColumnWidth / 2;
  const sharedRightEdge = sharedColumnWidth / 2;
  const medinaRightEdge = sharedLeftEdge - COLUMN_GAP;
  const anseliLeftEdge = sharedRightEdge + COLUMN_GAP;

  const positioned = new Map(); // id -> { x, y, branch }

  const placeColumn = (result, branch, align) => {
    result.levels.forEach((level) => {
      const rowWidth = result.levelWidths.get(level) * CELL_WIDTH;
      let rowStartX;
      if (align === 'right') {
        rowStartX = medinaRightEdge - rowWidth;
      } else if (align === 'left') {
        rowStartX = anseliLeftEdge;
      } else {
        rowStartX = -rowWidth / 2;
      }

      includedMembers.forEach((member) => {
        if (effectiveBranch.get(member.id) !== branch) return;
        if (generationById.get(member.id) !== level) return;
        const slot = result.slotById.get(member.id);
        if (slot === undefined) return;
        positioned.set(member.id, {
          x: rowStartX + slot * CELL_WIDTH,
          y: level * ROW_HEIGHT,
          branch
        });
      });
    });
  };

  placeColumn(medina, 'medina', 'right');
  placeColumn(shared, 'shared', 'center');
  placeColumn(anseli, 'anseli', 'left');

  const directChildCount = new Map();
  includedMembers.forEach((member) => {
    directChildCount.set(member.id, (childrenMap.get(member.id) || []).length);
  });

  const rawNodes = Array.from(positioned.entries()).map(([id, pos]) => ({
    id,
    ...pos,
    childCount: directChildCount.get(id) || 0,
    isCollapsed: collapsedIds.has(id)
  }));

  const rawConnectors = [];
  const drawnSpousePairs = new Set();

  includedMembers.forEach((member) => {
    const pos = positioned.get(member.id);
    if (!pos) return;

    (member.parentIds || []).forEach((parentId) => {
      const parentPos = positioned.get(parentId);
      if (!parentPos) return;
      rawConnectors.push({
        x1: parentPos.x + CARD_WIDTH / 2,
        y1: parentPos.y + CARD_HEIGHT,
        x2: pos.x + CARD_WIDTH / 2,
        y2: pos.y,
        branch: pos.branch,
        type: 'parent-child',
        fromId: parentId,
        toId: member.id
      });
    });

    const memberSpouseId = (member.spouseIds || [])[0];
    if (memberSpouseId) {
      const pairKey = [member.id, memberSpouseId].sort().join('|');
      const spousePos = positioned.get(memberSpouseId);
      if (spousePos && !drawnSpousePairs.has(pairKey)) {
        drawnSpousePairs.add(pairKey);
        rawConnectors.push({
          x1: pos.x + CARD_WIDTH,
          y1: pos.y + CARD_HEIGHT / 2,
          x2: spousePos.x,
          y2: spousePos.y + CARD_HEIGHT / 2,
          branch: pos.branch,
          type: 'spouse',
          fromId: member.id,
          toId: memberSpouseId
        });
      }
    }
  });

  const placedIds = new Set(positioned.keys());
  const unplaced = members.filter((m) => !placedIds.has(m.id) && !hiddenByCollapse.has(m.id));

  const minX = Math.min(...rawNodes.map((n) => n.x), 0);
  const minY = Math.min(...rawNodes.map((n) => n.y), 0);
  const maxX = Math.max(...rawNodes.map((n) => n.x + CARD_WIDTH), CARD_WIDTH);
  const maxY = Math.max(...rawNodes.map((n) => n.y + CARD_HEIGHT), CARD_HEIGHT);
  const shiftX = PADDING_LEFT - minX;
  const shiftY = PADDING_TOP_RIGHT_BOTTOM - minY;

  const blocksByBranch = { medina: { nodes: [], connectors: [] }, anseli: { nodes: [], connectors: [] }, shared: { nodes: [], connectors: [] } };

  rawNodes.forEach((n) => {
    blocksByBranch[n.branch].nodes.push({ ...n, x: n.x + shiftX, y: n.y + shiftY });
  });
  rawConnectors.forEach((c) => {
    blocksByBranch[c.branch].connectors.push({
      ...c,
      x1: c.x1 + shiftX,
      y1: c.y1 + shiftY,
      x2: c.x2 + shiftX,
      y2: c.y2 + shiftY
    });
  });

  const canvasSize = {
    width: maxX - minX + PADDING_LEFT + PADDING_TOP_RIGHT_BOTTOM,
    height: maxY - minY + PADDING_TOP_RIGHT_BOTTOM * 2
  };

  const selfGeneration = generationById.get(selfMember.id);
  const levelsPresent = Array.from(new Set(rawNodes.map((n) => generationById.get(n.id)))).sort((a, b) => a - b);
  const rows = levelsPresent.map((level) => ({
    level,
    y: level * ROW_HEIGHT + shiftY,
    title: getGenerationTitle(level, selfGeneration)
  }));

  return {
    ready: true,
    message: null,
    blocksByBranch,
    canvasSize,
    rows,
    unplaced
  };
}

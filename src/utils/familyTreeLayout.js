import { computeGenerations } from './familyTreeGenerations';

export const CARD_WIDTH = 180;
export const CARD_HEIGHT = 140;

const H_GAP = 40;
const V_GAP = 70;
const COLUMN_GAP = 110;
const CANVAS_PADDING = 80;

const CELL_WIDTH = CARD_WIDTH + H_GAP;
const ROW_HEIGHT = CARD_HEIGHT + V_GAP;

const BRANCHES = ['medina', 'anseli', 'shared'];

const branchOf = (member) => (BRANCHES.includes(member.branch) ? member.branch : null);

const emptyLayout = (members, message) => ({
  ready: false,
  message,
  blocksByBranch: { medina: { nodes: [], connectors: [] }, anseli: { nodes: [], connectors: [] }, shared: { nodes: [], connectors: [] } },
  canvasSize: { width: 0, height: 0 },
  unplaced: members
});

/**
 * Orders one branch's members within each generation row (spouses kept
 * adjacent, otherwise sorted near their parents' slot from the row above so
 * children roughly line up under parents), and returns the slot index each
 * member landed on plus how many slots each row needed.
 */
function assignSlots(members, generationById, targetBranch) {
  const byLevel = new Map();
  members.forEach((member) => {
    if (branchOf(member) !== targetBranch) return;
    if (!generationById.has(member.id)) return;
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

    const sorted = [...rowMembers].sort((a, b) => {
      const ka = sortKey(a);
      const kb = sortKey(b);
      if (ka === null && kb === null) return (a.name || '').localeCompare(b.name || '');
      if (ka === null) return 1;
      if (kb === null) return -1;
      return ka - kb;
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
 * Builds the hard left/right split canvas layout by placing every tagged
 * member into a generation row (shared logic with the List view) and a
 * left/center/right column by branch. Medina rows are right-aligned to hug
 * the shared column, Anseli rows are left-aligned to hug it from the other
 * side, and the shared column is centered — so all three columns read as
 * one connected tree instead of needing a single-perspective layout engine
 * that can't show aunts/uncles/cousins (see project notes).
 */
export function buildFamilyTreeCanvasLayout(members) {
  const { generationById, selfMember } = computeGenerations(members);

  if (!selfMember) {
    return emptyLayout(
      members,
      'Set a relationship of "You", "You (Admin)", or "Self" on your own entry to enable the canvas view.'
    );
  }

  const taggedMembers = members.filter((m) => branchOf(m) && generationById.has(m.id));
  if (taggedMembers.length === 0) {
    return emptyLayout(members, 'Tag family members with a branch in Settings to enable the canvas view.');
  }

  const medina = assignSlots(taggedMembers, generationById, 'medina');
  const anseli = assignSlots(taggedMembers, generationById, 'anseli');
  const shared = assignSlots(taggedMembers, generationById, 'shared');

  const medinaColumnWidth = Math.max(0, ...Array.from(medina.levelWidths.values(), (n) => n * CELL_WIDTH), 0);
  const anseliColumnWidth = Math.max(0, ...Array.from(anseli.levelWidths.values(), (n) => n * CELL_WIDTH), 0);
  const sharedColumnWidth = Math.max(0, ...Array.from(shared.levelWidths.values(), (n) => n * CELL_WIDTH), 0);

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

      taggedMembers.forEach((member) => {
        if (branchOf(member) !== branch) return;
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

  const rawNodes = Array.from(positioned.entries()).map(([id, pos]) => ({ id, ...pos }));

  const rawConnectors = [];
  const drawnSpousePairs = new Set();

  taggedMembers.forEach((member) => {
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
        branch: pos.branch
      });
    });

    const spouseId = (member.spouseIds || [])[0];
    if (spouseId) {
      const pairKey = [member.id, spouseId].sort().join('|');
      const spousePos = positioned.get(spouseId);
      if (spousePos && !drawnSpousePairs.has(pairKey)) {
        drawnSpousePairs.add(pairKey);
        rawConnectors.push({
          x1: pos.x + CARD_WIDTH,
          y1: pos.y + CARD_HEIGHT / 2,
          x2: spousePos.x,
          y2: spousePos.y + CARD_HEIGHT / 2,
          branch: pos.branch
        });
      }
    }
  });

  const placedIds = new Set(positioned.keys());
  const unplaced = members.filter((m) => !placedIds.has(m.id));

  const minX = Math.min(...rawNodes.map((n) => n.x), 0);
  const minY = Math.min(...rawNodes.map((n) => n.y), 0);
  const maxX = Math.max(...rawNodes.map((n) => n.x + CARD_WIDTH), CARD_WIDTH);
  const maxY = Math.max(...rawNodes.map((n) => n.y + CARD_HEIGHT), CARD_HEIGHT);
  const shiftX = CANVAS_PADDING - minX;
  const shiftY = CANVAS_PADDING - minY;

  const blocksByBranch = { medina: { nodes: [], connectors: [] }, anseli: { nodes: [], connectors: [] }, shared: { nodes: [], connectors: [] } };

  rawNodes.forEach((n) => {
    blocksByBranch[n.branch].nodes.push({ ...n, x: n.x + shiftX, y: n.y + shiftY });
  });
  rawConnectors.forEach((c) => {
    blocksByBranch[c.branch].connectors.push({
      x1: c.x1 + shiftX,
      y1: c.y1 + shiftY,
      x2: c.x2 + shiftX,
      y2: c.y2 + shiftY
    });
  });

  return {
    ready: true,
    message: null,
    blocksByBranch,
    canvasSize: {
      width: maxX - minX + CANVAS_PADDING * 2,
      height: maxY - minY + CANVAS_PADDING * 2
    },
    unplaced
  };
}

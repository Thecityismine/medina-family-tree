import calcTree from 'relatives-tree';
import { toRelativesTreeNodes, findReachableIds } from './familyTreeGraph';

const SELF_RELATIONSHIPS = ['You (Admin)', 'You', 'Self'];

export const CARD_WIDTH = 180;
export const CARD_HEIGHT = 140;
const CANVAS_PADDING = 80;

const gridToPx = (x, y, mirrored) => ({
  x: (mirrored ? -x : x) * (CARD_WIDTH / 2),
  y: y * (CARD_HEIGHT / 2)
});

const emptyLayout = (members, message) => ({
  ready: false,
  message,
  blocksByBranch: { medina: { nodes: [], connectors: [] }, anseli: { nodes: [], connectors: [] }, shared: { nodes: [], connectors: [] } },
  canvasSize: { width: 0, height: 0 },
  unplaced: members
});

function buildBlock(members, candidateIds, rootId) {
  const reachable = findReachableIds(members, candidateIds, rootId);
  if (reachable.size === 0) return { reachable, calc: null };

  const relNodes = toRelativesTreeNodes(members, Array.from(reachable));
  const calc = calcTree(relNodes, { rootId });
  return { reachable, calc };
}

/**
 * Builds the hard left/right split canvas layout: a "medina" block (rooted
 * at you, grown from your blood relatives), an "anseli" block (rooted at
 * your spouse, mirrored horizontally), and a "shared" block (you + your
 * spouse + your direct descendants) sitting between them. All three are
 * calcTree() calls run independently, then composited into one shared
 * pixel coordinate space via the "bridge" technique below.
 */
export function buildFamilyTreeCanvasLayout(members) {
  const selfMember = members.find((m) => SELF_RELATIONSHIPS.includes(m.relationship));
  if (!selfMember) {
    return emptyLayout(
      members,
      'Set a relationship of "You", "You (Admin)", or "Self" on your own entry to enable the canvas view.'
    );
  }

  const jorgeId = selfMember.id;
  const anseliId = Array.isArray(selfMember.spouseIds) ? selfMember.spouseIds[0] : null;
  if (!anseliId || !members.some((m) => m.id === anseliId)) {
    return emptyLayout(members, 'Link a spouse on your own entry to enable the split canvas view.');
  }

  const medinaCandidates = new Set(members.filter((m) => m.branch === 'medina').map((m) => m.id));
  medinaCandidates.add(jorgeId); // bridge node — see note below

  const anseliCandidates = new Set(members.filter((m) => m.branch === 'anseli').map((m) => m.id));
  anseliCandidates.add(anseliId); // bridge node

  const sharedCandidates = new Set(members.filter((m) => m.branch === 'shared').map((m) => m.id));
  sharedCandidates.add(jorgeId);
  sharedCandidates.add(anseliId);

  const medinaBlock = buildBlock(members, medinaCandidates, jorgeId);
  const anseliBlock = buildBlock(members, anseliCandidates, anseliId);
  const sharedBlock = buildBlock(members, sharedCandidates, jorgeId);

  if (!sharedBlock.calc) {
    return emptyLayout(members, 'Tag yourself and your spouse as "Shared" to enable the canvas view.');
  }

  const sharedJorgeNode = sharedBlock.calc.nodes.find((n) => n.id === jorgeId);
  const sharedAnseliNode = sharedBlock.calc.nodes.find((n) => n.id === anseliId);
  if (!sharedJorgeNode || !sharedAnseliNode) {
    return emptyLayout(members, 'Could not place you and your spouse together — check your spouse link.');
  }

  // The shared block (you + spouse + descendants) is the anchor: it sits at
  // the origin and is never mirrored or offset. The medina/anseli blocks
  // each include their bridge person (you, or your spouse) purely so their
  // blood relatives resolve into a coherent subtree — that bridge person's
  // card is never drawn twice, only the shared block draws it. Instead, each
  // side block is offset so its bridge slot lands exactly on top of the real
  // card the shared block draws, making the connector lines flow seamlessly
  // from each side into the center couple.
  const worldJorge = gridToPx(sharedJorgeNode.left, sharedJorgeNode.top, false);
  const worldAnseli = gridToPx(sharedAnseliNode.left, sharedAnseliNode.top, false);

  let medinaOffset = { left: 0, top: 0 };
  if (medinaBlock.calc) {
    const bridgeNode = medinaBlock.calc.nodes.find((n) => n.id === jorgeId);
    const bridgeLocal = gridToPx(bridgeNode.left, bridgeNode.top, false);
    medinaOffset = { left: worldJorge.x - bridgeLocal.x, top: worldJorge.y - bridgeLocal.y };
  }

  let anseliOffset = { left: 0, top: 0 };
  if (anseliBlock.calc) {
    const bridgeNode = anseliBlock.calc.nodes.find((n) => n.id === anseliId);
    const bridgeLocal = gridToPx(bridgeNode.left, bridgeNode.top, true);
    anseliOffset = { left: worldAnseli.x - bridgeLocal.x, top: worldAnseli.y - bridgeLocal.y };
  }

  const blockConfigs = [
    { branch: 'medina', mirrored: false, block: medinaBlock, offset: medinaOffset, bridgeId: jorgeId },
    { branch: 'shared', mirrored: false, block: sharedBlock, offset: { left: 0, top: 0 }, bridgeId: null },
    { branch: 'anseli', mirrored: true, block: anseliBlock, offset: anseliOffset, bridgeId: anseliId }
  ];

  const rawNodes = [];
  const rawConnectors = [];

  blockConfigs.forEach(({ branch, mirrored, block, offset, bridgeId }) => {
    if (!block.calc) return;

    block.calc.nodes.forEach((node) => {
      // Side blocks reserve a slot for their bridge person but don't draw a
      // card there — the shared block already draws that person's card.
      if (bridgeId && node.id === bridgeId) return;

      const local = gridToPx(node.left, node.top, mirrored);
      rawNodes.push({ id: node.id, x: offset.left + local.x, y: offset.top + local.y, branch });
    });

    block.calc.connectors.forEach(([x1, y1, x2, y2]) => {
      const p1 = gridToPx(x1, y1, mirrored);
      const p2 = gridToPx(x2, y2, mirrored);
      rawConnectors.push({
        x1: offset.left + p1.x,
        y1: offset.top + p1.y,
        x2: offset.left + p2.x,
        y2: offset.top + p2.y,
        branch
      });
    });
  });

  const placedIds = new Set([...medinaBlock.reachable, ...anseliBlock.reachable, ...sharedBlock.reachable]);
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

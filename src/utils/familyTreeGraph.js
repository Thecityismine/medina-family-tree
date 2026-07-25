const VALID_GENDERS = new Set(['male', 'female']);

// relatives-tree only supports a binary gender for layout-direction bookkeeping.
// The value is never read for card content (cards look up the full member record
// by id instead), so this fallback has no visible effect on non-binary members.
const normalizeGender = (gender) => (VALID_GENDERS.has(gender) ? gender : 'female');

/**
 * Converts Firestore member docs into relatives-tree `Node[]`.
 * `memberIds`, if provided, restricts the graph to that subset — any
 * parentIds/spouseIds pointing outside the subset are safely dropped
 * instead of producing a dangling reference.
 */
export function toRelativesTreeNodes(members, memberIds = null) {
  const allowed = memberIds ? new Set(memberIds) : new Set(members.map((m) => m.id));
  const byId = new Map(members.map((m) => [m.id, m]));
  const nodes = new Map();

  const ensure = (id) => {
    if (!nodes.has(id)) {
      const member = byId.get(id);
      nodes.set(id, {
        id,
        gender: normalizeGender(member?.gender),
        parents: [],
        children: [],
        siblings: [],
        spouses: []
      });
    }
    return nodes.get(id);
  };

  members.forEach((member) => {
    if (!allowed.has(member.id)) return;
    ensure(member.id);

    (member.parentIds || []).forEach((parentId) => {
      if (!parentId || !allowed.has(parentId) || !byId.has(parentId)) return;

      const child = ensure(member.id);
      if (!child.parents.some((rel) => rel.id === parentId)) {
        child.parents.push({ id: parentId, type: 'blood' });
      }

      const parent = ensure(parentId);
      if (!parent.children.some((rel) => rel.id === member.id)) {
        parent.children.push({ id: member.id, type: 'blood' });
      }
    });

    (member.spouseIds || []).forEach((spouseId) => {
      if (!spouseId || !allowed.has(spouseId) || !byId.has(spouseId)) return;

      const a = ensure(member.id);
      if (!a.spouses.some((rel) => rel.id === spouseId)) {
        a.spouses.push({ id: spouseId, type: 'married' });
      }

      const b = ensure(spouseId);
      if (!b.spouses.some((rel) => rel.id === member.id)) {
        b.spouses.push({ id: member.id, type: 'married' });
      }
    });
  });

  return Array.from(nodes.values());
}

/**
 * BFS over parent/child/spouse edges, restricted to `candidateIds`, starting
 * at `rootId`. Returns the set of ids reachable from the root — used to keep
 * disconnected/orphaned members out of a calcTree() call (which requires
 * every node to be reachable from its root) without crashing the layout.
 */
export function findReachableIds(members, candidateIds, rootId) {
  const allowed = new Set(candidateIds);
  if (!rootId || !allowed.has(rootId)) return new Set();

  const adjacency = new Map();
  const addEdge = (a, b) => {
    if (!allowed.has(a) || !allowed.has(b)) return;
    if (!adjacency.has(a)) adjacency.set(a, new Set());
    if (!adjacency.has(b)) adjacency.set(b, new Set());
    adjacency.get(a).add(b);
    adjacency.get(b).add(a);
  };

  members.forEach((member) => {
    if (!allowed.has(member.id)) return;
    (member.parentIds || []).forEach((parentId) => addEdge(member.id, parentId));
    (member.spouseIds || []).forEach((spouseId) => addEdge(member.id, spouseId));
  });

  const visited = new Set([rootId]);
  const queue = [rootId];

  while (queue.length > 0) {
    const current = queue.shift();
    const neighbors = adjacency.get(current);
    if (!neighbors) continue;
    neighbors.forEach((neighborId) => {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push(neighborId);
      }
    });
  }

  return visited;
}

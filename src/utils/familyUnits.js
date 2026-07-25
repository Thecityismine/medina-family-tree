import { parseBirthDate } from './birthdays';

/* ==========================================================================
   FAMILY UNITS

   Turns a flat member list into households: a couple (or a single parent)
   plus their children. Reading families instead of disconnected individuals
   is the point — "John & Mary -> Alex, George, Steven" carries the shape of
   a family in a way that three separate cards never can.

   Derived entirely from data that already exists:
     spouseIds: string[]   bidirectional, synced by Add/Edit member forms
     parentIds: string[]   up to 2 per member

   No marriage dates required. A unit is a RELATIONSHIP, not an event.
   ========================================================================== */

/** Stable key for a couple, order-independent, so A+B and B+A collapse. */
const coupleKey = (idA, idB) => [idA, idB].sort().join('~');

/**
 * @param {Array} members
 * @returns {Array} units, oldest generation first
 */
export function buildFamilyUnits(members = []) {
  const byId = new Map(members.map((m) => [m.id, m]));

  // parentId -> child members
  const childrenByParent = new Map();
  members.forEach((member) => {
    const parentIds = Array.isArray(member.parentIds) ? member.parentIds : [];
    parentIds.forEach((parentId) => {
      if (!byId.has(parentId)) return; // orphaned reference
      if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
      childrenByParent.get(parentId).push(member);
    });
  });

  const units = [];
  const seenCouples = new Set();
  // Members already represented as a PARENT somewhere. Used to avoid emitting
  // a duplicate single-parent unit for someone already in a couple.
  const pairedParents = new Set();

  // ---- 1. Couples -------------------------------------------------------
  members.forEach((member) => {
    const spouseIds = Array.isArray(member.spouseIds) ? member.spouseIds : [];
    spouseIds.forEach((spouseId) => {
      const spouse = byId.get(spouseId);
      if (!spouse) return;

      const key = coupleKey(member.id, spouse.id);
      if (seenCouples.has(key)) return;
      seenCouples.add(key);

      pairedParents.add(member.id);
      pairedParents.add(spouse.id);

      // A child of EITHER partner belongs to the household. Using a union
      // (not an intersection) keeps children from a previous relationship
      // visible rather than silently dropping them.
      const childMap = new Map();
      [member.id, spouse.id].forEach((parentId) => {
        (childrenByParent.get(parentId) || []).forEach((child) => {
          childMap.set(child.id, child);
        });
      });

      units.push({
        id: key,
        type: 'couple',
        partners: [member, spouse],
        children: sortByBirth(Array.from(childMap.values()))
      });
    });
  });

  // ---- 2. Single parents ------------------------------------------------
  members.forEach((member) => {
    if (pairedParents.has(member.id)) return;
    const children = childrenByParent.get(member.id);
    if (!children || children.length === 0) return;

    units.push({
      id: 'single~' + member.id,
      type: 'single',
      partners: [member],
      children: sortByBirth(children)
    });
  });

  // Oldest household first, so scrolling the list walks down the generations.
  return units.sort((a, b) => earliestBirth(a) - earliestBirth(b));
}

function sortByBirth(list) {
  return [...list].sort((a, b) => {
    const da = parseBirthDate(a.birthDate);
    const db = parseBirthDate(b.birthDate);
    if (da && db) return da - db;
    if (da) return -1; // dated members first; undated sink to the bottom
    if (db) return 1;
    return (a.name || '').localeCompare(b.name || '');
  });
}

function earliestBirth(unit) {
  const times = unit.partners
    .map((p) => parseBirthDate(p.birthDate))
    .filter(Boolean)
    .map((d) => d.getTime());
  // Undated households sort last rather than jumping to 1970.
  return times.length > 0 ? Math.min(...times) : Number.MAX_SAFE_INTEGER;
}

/**
 * Members who belong to no household at all — neither partner nor child.
 * Surfaced so nobody silently disappears from the Families view.
 */
export function findUnattached(members = [], units = []) {
  const attached = new Set();
  units.forEach((unit) => {
    unit.partners.forEach((p) => attached.add(p.id));
    unit.children.forEach((c) => attached.add(c.id));
  });
  return members.filter((m) => !attached.has(m.id));
}

/** Descendant count for a member, cycle-safe. Powers "12 grandchildren". */
export function countDescendants(memberId, members = []) {
  const childrenByParent = new Map();
  members.forEach((member) => {
    (Array.isArray(member.parentIds) ? member.parentIds : []).forEach((parentId) => {
      if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
      childrenByParent.get(parentId).push(member.id);
    });
  });

  const seen = new Set();
  const walk = (id) => {
    (childrenByParent.get(id) || []).forEach((childId) => {
      if (seen.has(childId)) return; // guards against a parent cycle
      seen.add(childId);
      walk(childId);
    });
  };
  walk(memberId);

  const directChildren = (childrenByParent.get(memberId) || []).length;
  return { children: directChildren, descendants: seen.size };
}

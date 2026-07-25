import { parseBirthDate } from './birthdays';

/* ==========================================================================
   TIMELINE

   A chronological spine for the family, built from the dates that actually
   exist in Firestore: birthDate and passedAwayDate.

   MARRIAGE EVENTS: the model supports a 'union' event type, but no member
   currently carries a marriage date so none are ever emitted. If a
   `marriageDate` field is added later, unions appear automatically with no
   further changes here. Costing nothing now avoids a rewrite then.
   ========================================================================== */

export const EVENT_TYPES = {
  birth: { label: 'Born', icon: 'sparkle', tone: 'gold' },
  union: { label: 'Married', icon: 'heart', tone: 'rose' },
  death: { label: 'Passed away', icon: 'clock', tone: 'muted' }
};

/**
 * @param {Array} members
 * @returns {Array} events sorted oldest -> newest
 */
export function buildTimeline(members = []) {
  const events = [];

  members.forEach((member) => {
    const born = parseBirthDate(member.birthDate);
    if (born) {
      events.push({
        id: member.id + ':birth',
        type: 'birth',
        date: born,
        year: born.getFullYear(),
        member,
        title: member.name,
        detail: member.location || null
      });
    }

    const died = parseBirthDate(member.passedAwayDate);
    if (died) {
      const age = born ? yearsBetween(born, died) : null;
      events.push({
        id: member.id + ':death',
        type: 'death',
        date: died,
        year: died.getFullYear(),
        member,
        title: member.name,
        detail: age !== null ? 'Aged ' + age : null
      });
    }

    // Supported but currently inert — see the note at the top of this file.
    const married = parseBirthDate(member.marriageDate);
    if (married && Array.isArray(member.spouseIds) && member.spouseIds.length > 0) {
      const spouseId = member.spouseIds[0];
      // Emit once per couple, from the partner with the lower id.
      if (member.id < spouseId) {
        const spouse = members.find((m) => m.id === spouseId);
        events.push({
          id: member.id + ':union',
          type: 'union',
          date: married,
          year: married.getFullYear(),
          member,
          title: spouse ? member.name + ' & ' + spouse.name : member.name,
          detail: null
        });
      }
    }
  });

  return events.sort((a, b) => a.date - b.date);
}

/** Group events by decade, so a 6-generation span stays scannable. */
export function groupByDecade(events = []) {
  const groups = new Map();
  events.forEach((event) => {
    const decade = Math.floor(event.year / 10) * 10;
    if (!groups.has(decade)) groups.set(decade, []);
    groups.get(decade).push(event);
  });
  return Array.from(groups.entries())
    .map(([decade, items]) => ({ decade, label: decade + 's', events: items }))
    .sort((a, b) => a.decade - b.decade);
}

/**
 * "On this day" — events sharing today's month/day in any past year.
 * Anniversaries of a death are included and flagged, so the copy can be
 * respectful rather than celebratory.
 */
export function getOnThisDay(members = [], today = new Date()) {
  const month = today.getMonth();
  const day = today.getDate();
  const thisYear = today.getFullYear();

  return buildTimeline(members)
    .filter((event) => event.date.getMonth() === month && event.date.getDate() === day)
    .filter((event) => event.year < thisYear) // an event today isn't an anniversary
    .map((event) => ({
      ...event,
      yearsAgo: thisYear - event.year,
      isMemorial: event.type === 'death'
    }))
    .sort((a, b) => a.year - b.year);
}

/** Headline figures for the dashboard. All derived, no new fields. */
export function getFamilyMilestones(members = []) {
  const living = members.filter((m) => !m.passedAwayDate);

  const withBirth = (list) =>
    list
      .map((m) => ({ member: m, date: parseBirthDate(m.birthDate) }))
      .filter((entry) => entry.date);

  const livingDated = withBirth(living);
  const allDated = withBirth(members);

  // Oldest living = earliest birth date among members with no passedAwayDate.
  const oldestLiving = livingDated.length
    ? livingDated.reduce((a, b) => (a.date < b.date ? a : b))
    : null;

  // Newest arrival = latest birth date overall.
  const newestArrival = allDated.length
    ? allDated.reduce((a, b) => (a.date > b.date ? a : b))
    : null;

  const foundingYear = allDated.length
    ? Math.min(...allDated.map((e) => e.date.getFullYear()))
    : null;

  return {
    oldestLiving: oldestLiving
      ? { member: oldestLiving.member, age: yearsBetween(oldestLiving.date, new Date()) }
      : null,
    newestArrival: newestArrival
      ? { member: newestArrival.member, year: newestArrival.date.getFullYear() }
      : null,
    foundingYear,
    livingCount: living.length,
    rememberedCount: members.length - living.length
  };
}

function yearsBetween(from, to) {
  let years = to.getFullYear() - from.getFullYear();
  const monthDelta = to.getMonth() - from.getMonth();
  // Not yet reached the anniversary this year.
  if (monthDelta < 0 || (monthDelta === 0 && to.getDate() < from.getDate())) {
    years -= 1;
  }
  return years;
}

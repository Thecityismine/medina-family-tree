/* Run with:  npm run test:utils
 *
 * Bundled through esbuild because these modules use extensionless relative
 * imports, which Vite resolves but bare Node does not.
 *
 * Verify the derivation logic against a synthetic family that
   exercises the awkward cases: a couple, a single parent, children from a
   prior relationship, an unlinked member, a missing date, and a parent cycle. */
import { buildFamilyUnits, findUnattached, countDescendants } from '../familyUnits.js';
import { buildTimeline, getOnThisDay, getFamilyMilestones, groupByDecade } from '../timeline.js';

const members = [
  { id: 'g1', name: 'Edilio Lopez',  birthDate: '1925-03-04', passedAwayDate: '1998-11-02', spouseIds: ['g2'] },
  { id: 'g2', name: 'Tulia Vasquez', birthDate: '1928-07-19', spouseIds: ['g1'] },

  { id: 'p1', name: 'Jose Medina',   birthDate: '1950-01-15', spouseIds: ['p2'], parentIds: ['g1', 'g2'] },
  { id: 'p2', name: 'Ana Rivera',    birthDate: '1952-06-30', spouseIds: ['p1'] },

  // Child of the p1/p2 couple.
  { id: 'c1', name: 'Georgie Medina', birthDate: '1968-08-05', parentIds: ['p1', 'p2'] },
  // Child of p1 only (prior relationship) — must still appear in the household.
  { id: 'c2', name: 'Half Sibling',   birthDate: '1966-02-11', parentIds: ['p1'] },
  // Undated child — must sort last, not to 1970.
  { id: 'c3', name: 'Undated Child',  parentIds: ['p1', 'p2'] },

  // Single parent, no spouse.
  { id: 's1', name: 'Solo Parent',   birthDate: '1955-09-09' },
  { id: 's2', name: 'Solo Child',    birthDate: '1980-04-04', parentIds: ['s1'] },

  // Grandchild, for descendant counting.
  { id: 'gc', name: 'Skylar',        birthDate: '2020-12-01', parentIds: ['c1'] },

  // Completely unlinked.
  { id: 'x1', name: 'Unlinked Cousin', birthDate: '1975-05-05' },

  // Orphaned parent reference — parent id does not exist.
  { id: 'x2', name: 'Bad Ref', birthDate: '1990-01-01', parentIds: ['DOES_NOT_EXIST'] }
];

let pass = 0, fail = 0;
const check = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log((ok ? '  PASS  ' : '  FAIL  ') + label + (ok ? '' : `\n          got ${JSON.stringify(actual)} want ${JSON.stringify(expected)}`));
  ok ? pass++ : fail++;
};

console.log('\n--- buildFamilyUnits ---');
const units = buildFamilyUnits(members);
check('unit count (2 couples + 2 single parents)', units.length, 4);
check('oldest household first', units[0].partners.map(p => p.id), ['g1', 'g2']);
check('couple dedupes A+B / B+A', units.filter(u => u.id === 'g1~g2').length, 1);

const jose = units.find(u => u.id === 'p1~p2');
check('household includes half-sibling (union not intersection)',
  jose.children.map(c => c.id).sort(), ['c1', 'c2', 'c3']);
check('children sorted by birth, undated last',
  jose.children.map(c => c.id), ['c2', 'c1', 'c3']);

const solo = units.find(u => u.partners[0].id === 's1');
check('single parent unit', [solo.partners.length, solo.children[0].id], [1, 's2']);
check('paired parents never get a single-unit too',
  units.filter(u => u.type === 'single').map(u => u.partners[0].id).sort(), ['c1', 's1']);

console.log('\n--- findUnattached ---');
const unattached = findUnattached(members, units);
check('unlinked members surfaced', unattached.map(m => m.id).sort(), ['x1', 'x2']);

console.log('\n--- countDescendants ---');
check('g1 descendants (p1,c1,c2,c3,gc)', countDescendants('g1', members), { children: 1, descendants: 5 });
check('c1 has 1 child 1 descendant', countDescendants('c1', members), { children: 1, descendants: 1 });
check('leaf has none', countDescendants('gc', members), { children: 0, descendants: 0 });

console.log('\n--- cycle safety ---');
const cyclic = [
  { id: 'a', name: 'A', parentIds: ['b'] },
  { id: 'b', name: 'B', parentIds: ['a'] }
];
try {
  const r = countDescendants('a', cyclic);
  check('parent cycle terminates', r.descendants <= 2, true);
} catch (e) {
  check('parent cycle terminates', 'threw: ' + e.message, true);
}

console.log('\n--- buildTimeline ---');
const events = buildTimeline(members);
const births = events.filter(e => e.type === 'birth').length;
const deaths = events.filter(e => e.type === 'death').length;
const unions = events.filter(e => e.type === 'union').length;
check('births = members with a birthDate', births, 11);
check('one death event', deaths, 1);
check('NO union events (no marriageDate in data)', unions, 0);
check('sorted oldest first', events[0].year, 1925);
check('death carries age at passing', events.find(e => e.type === 'death').detail, 'Aged 73');

console.log('\n--- groupByDecade ---');
const decades = groupByDecade(events);
check('decades ascending', decades.map(d => d.decade).slice(0, 3), [1920, 1950, 1960]);
check('decade label format', decades[0].label, '1920s');

console.log('\n--- getOnThisDay ---');
// 5 Aug: Georgie born 1968.
const otd = getOnThisDay(members, new Date(2026, 7, 5));
check('matches month/day across years', otd.map(e => e.member.id), ['c1']);
check('yearsAgo computed', otd[0].yearsAgo, 58);
check('birth is not a memorial', otd[0].isMemorial, false);
// 2 Nov: Edilio died 1998.
const otdDeath = getOnThisDay(members, new Date(2026, 10, 2));
check('memorial flagged', [otdDeath.length, otdDeath[0].isMemorial], [1, true]);
check('quiet day returns nothing', getOnThisDay(members, new Date(2026, 0, 23)).length, 0);

console.log('\n--- getFamilyMilestones ---');
const ms = getFamilyMilestones(members);
check('oldest LIVING skips the deceased', ms.oldestLiving.member.id, 'g2');
check('newest arrival', ms.newestArrival.member.id, 'gc');
check('founding year', ms.foundingYear, 1925);
check('living / remembered split', [ms.livingCount, ms.rememberedCount], [11, 1]);

console.log('\n--- empty input ---');
check('units on []', buildFamilyUnits([]).length, 0);
check('timeline on []', buildTimeline([]).length, 0);
check('milestones on []', getFamilyMilestones([]).oldestLiving, null);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail > 0 ? 1 : 0);

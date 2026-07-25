import React from 'react';

/* ==========================================================================
   ICON SET
   Inline stroke SVGs, 24x24, currentColor. No dependency, no icon font.

   Deliberately NOT emoji. Emoji render differently per-OS, can't inherit
   colour or stroke weight, and are the single fastest visual tell of an
   unfinished app. HomeDashboard had icon slots filled with the literal words
   "Members" / "Birthdays" / "Tree" / "Locations" — these fill them.
   ========================================================================== */

const PATHS = {
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M9.5 21v-6h5v6" /></>,
  tree: (
    <>
      <circle cx="12" cy="4.5" r="2.5" />
      <circle cx="5" cy="19.5" r="2.5" />
      <circle cx="19" cy="19.5" r="2.5" />
      <path d="M12 7v4M5 17v-2a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M17.5 20a6.4 6.4 0 0 0-2-4.6" />
    </>
  ),
  cake: (
    <>
      <path d="M4 20h16" />
      <path d="M4 20v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5" />
      <path d="M12 13V9" />
      <path d="M12 6.5c.9-.8.6-2-.5-3 .6 1.3-.4 2.2.5 3Z" />
      <path d="M8 13v-2M16 13v-2" />
    </>
  ),
  pin: <><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" /><circle cx="12" cy="10" r="2.6" /></>,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  heart: <path d="M12 20s-7-4.4-7-9.5A3.9 3.9 0 0 1 12 7.6a3.9 3.9 0 0 1 7 2.9C19 15.6 12 20 12 20Z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3.2 2" /></>,
  sparkle: <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />,
  image: <><rect x="3" y="4" width="18" height="16" rx="2.5" /><circle cx="8.5" cy="9.5" r="1.6" /><path d="m4 17 4.5-4.2L13 17" /><path d="m13 15 2.8-2.6L20 16" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 4.5 4.5" /></>,
  grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.6" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.6" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.6" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.6" /></>,
  signOut: <><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 8 6 12l4 4M6 12h9" /></>,
  signIn: <><path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" /><path d="m15 8 4 4-4 4M19 12h-9" /></>
};

/**
 * @param {string} name   - key of PATHS
 * @param {number} size   - px, default 20 (inherits stroke weight visually)
 * @param {number} stroke - stroke width
 */
function Icon({ name, size = 20, stroke = 1.75, className = '', ...rest }) {
  const path = PATHS[name];
  if (!path) return null;

  return (
    <svg
      className={['icon', className].filter(Boolean).join(' ')}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      /* Decorative by default — the adjacent text label is the accessible
         name. Icon-only buttons must supply their own aria-label. */
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {path}
    </svg>
  );
}

export default Icon;

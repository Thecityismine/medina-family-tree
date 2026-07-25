import React from 'react';

/**
 * A single metric. Left-aligned by default — centred stat cards in a wide
 * grid are the clearest "admin template" tell, and the old ones wrapped a
 * lone number in 24px of padding on all sides, reading as an empty void.
 *
 * @param {string} value  - the number/short string
 * @param {string} label  - uppercase label beneath
 * @param {string} delta  - optional trend line ("+3 this month")
 * @param {string} tone   - gold | ink | success  (numeral colour)
 * @param {string} align  - start | center
 */
function Stat({
  value,
  label,
  delta,
  deltaTone = 'success',
  tone = 'gold',
  align = 'start',
  size = 'md',
  className = '',
  ...rest
}) {
  const classes = ['stat', `stat--${align}`, `stat--${size}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...rest}>
      <div className={`stat__value t-numeral stat__value--${tone}`}>{value}</div>
      <div className="stat__label t-label">{label}</div>
      {delta && <div className={`stat__delta stat__delta--${deltaTone}`}>{delta}</div>}
    </div>
  );
}

export default Stat;

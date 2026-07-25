import React from 'react';

/**
 * The one container. Depth comes from a surface step + elevation, not from a
 * visible border — which is what let the old UI nest three boxes deep.
 *
 * @param {string}  as        - element tag (article, li, section...)
 * @param {string}  surface   - 1 | 2 | 3 (which ramp step to sit on)
 * @param {string}  elevation - 0 | 1 | 2 | 3
 * @param {string}  pad       - none | sm | md | lg
 * @param {boolean} interactive - adds hover/press affordance + pointer
 * @param {boolean} selected  - gold wash + gold hairline
 * @param {boolean} flush     - NO background/border at all. This is the
 *                              nesting escape hatch: a group that needs
 *                              spacing but not another visible box.
 */
function Card({
  as: Tag = 'div',
  surface = '1',
  elevation = '1',
  pad = 'md',
  interactive = false,
  selected = false,
  flush = false,
  className = '',
  children,
  ...rest
}) {
  const classes = [
    flush ? 'card card--flush' : 'card',
    !flush && `card--s${surface}`,
    !flush && `card--e${elevation}`,
    `card--pad-${pad}`,
    interactive && 'card--interactive',
    selected && 'is-selected',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}

export default Card;

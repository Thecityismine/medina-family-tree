import React from 'react';

/**
 * Loading placeholder. Data currently pops in with no intermediate state,
 * which reads as jank; a shimmer does more for perceived quality than almost
 * any other single change.
 *
 * @param {string} variant - text | title | avatar | card | thumb
 * @param {number} lines   - for variant="text"
 */
function Skeleton({ variant = 'text', lines = 1, width, height, className = '', ...rest }) {
  if (variant === 'text' && lines > 1) {
    return (
      <div className="skeleton-group" aria-hidden="true" {...rest}>
        {Array.from({ length: lines }).map((_, i) => (
          <span
            key={i}
            className="skeleton skeleton--text"
            /* Last line short, so it reads as a paragraph rather than a bar. */
            style={{ width: i === lines - 1 ? '62%' : '100%' }}
          />
        ))}
      </div>
    );
  }

  return (
    <span
      className={['skeleton', `skeleton--${variant}`, className].filter(Boolean).join(' ')}
      style={{ width, height }}
      aria-hidden="true"
      {...rest}
    />
  );
}

/* Composed placeholder matching the shape of a real member card, so the
   layout does not shift when data arrives. */
export function SkeletonMemberCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <Skeleton variant="avatar" />
      <div className="skeleton-card__body">
        <Skeleton variant="title" />
        <Skeleton variant="text" />
      </div>
    </div>
  );
}

export default Skeleton;

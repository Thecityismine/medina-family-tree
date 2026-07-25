import React from 'react';

/**
 * Small status pill.
 * @param {string} tone - neutral | gold | solid | success | warning | danger
 * @param {boolean} dot - leading status dot
 */
function Badge({ tone = 'neutral', dot = false, className = '', children, ...rest }) {
  const classes = ['badge', `badge--${tone}`, className].filter(Boolean).join(' ');

  return (
    <span className={classes} {...rest}>
      {dot && <span className="badge__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

export default Badge;

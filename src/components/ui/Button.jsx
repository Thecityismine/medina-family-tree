import React from 'react';

/**
 * @param {string}  variant - primary | secondary | ghost | danger
 * @param {string}  size    - sm | md | lg
 * @param {boolean} iconOnly - square; REQUIRES an aria-label
 * @param {boolean} loading  - shows spinner, blocks clicks
 */
function Button({
  as: Tag = 'button',
  variant = 'secondary',
  size = 'md',
  iconOnly = false,
  loading = false,
  full = false,
  className = '',
  children,
  disabled,
  ...rest
}) {
  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    iconOnly && 'btn--icon',
    full && 'btn--full',
    loading && 'is-loading',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag
      className={classes}
      disabled={Tag === 'button' ? disabled || loading : undefined}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="btn__spinner" aria-hidden="true" />}
      <span className="btn__label">{children}</span>
    </Tag>
  );
}

export default Button;

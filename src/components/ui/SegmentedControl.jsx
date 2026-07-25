import React from 'react';

/**
 * Replaces the two free-floating pills used for List/Canvas, which had no
 * shared track and so read as two unrelated buttons.
 *
 * A single thumb slides between options via transform — the movement is what
 * communicates "these are alternatives", and it's the detail that makes the
 * control feel native rather than templated.
 *
 * @param {Array}  options  - [{ value, label, icon? }]
 * @param {string} value    - active value
 * @param {Function} onChange
 */
function SegmentedControl({
  options = [],
  value,
  onChange,
  size = 'md',
  ariaLabel = 'View',
  className = ''
}) {
  const activeIndex = Math.max(0, options.findIndex((o) => o.value === value));
  const count = options.length || 1;

  const handleKeyDown = (event) => {
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    // Wrap around, so keyboard traversal never dead-ends.
    const next = (activeIndex + delta + count) % count;
    onChange?.(options[next].value);
  };

  return (
    <div
      className={['segmented', `segmented--${size}`, className].filter(Boolean).join(' ')}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      style={{ '--seg-count': count, '--seg-index': activeIndex }}
    >
      <span className="segmented__thumb" aria-hidden="true" />
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            /* Only the active tab is in the tab order; arrows move within.
               This is the correct roving-tabindex pattern for a tablist. */
            tabIndex={isActive ? 0 : -1}
            className={isActive ? 'segmented__option is-active' : 'segmented__option'}
            onClick={() => onChange?.(option.value)}
          >
            {option.icon && <span className="segmented__icon" aria-hidden="true">{option.icon}</span>}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;

import React, { useState } from 'react';

/* Deterministic warm gradient per person, so a photo-less relative still gets
   a stable identity instead of everyone sharing one gold->sage ramp. Kept
   inside the warm palette on purpose — this must not become a rainbow. */
const FALLBACKS = [
  'linear-gradient(140deg, #C6A26B 0%, #7A5E3E 100%)',
  'linear-gradient(140deg, #6E8B75 0%, #4A5D4F 100%)',
  'linear-gradient(140deg, #D4B57E 0%, #A07D52 100%)',
  'linear-gradient(140deg, #C98A96 0%, #8B5A66 100%)',
  'linear-gradient(140deg, #9A8C6F 0%, #5C5240 100%)'
];

function hashString(value = '') {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/* "Georgie Medina Matos" -> "GM". Two initials read as a designed monogram;
   the old single `charAt(0)` read as placeholder debris. */
export function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * The single avatar implementation for the whole app.
 * Replaces 9 hand-rolled copies across BirthdayCalendar, FamilyTree,
 * FamilyTreeCanvasNode, HomeDashboard, LocationMap, MemberDetailModal.
 *
 * @param {object}  member   - Firestore member ({ name, photoURL, ... })
 * @param {string}  size     - xs | sm | md | lg | xl
 * @param {boolean} ring     - hairline ring, to sit avatars on busy surfaces
 * @param {boolean} deceased - desaturates slightly, marks a memorial portrait
 */
function Avatar({
  member,
  name: nameProp,
  photoURL: photoProp,
  size = 'md',
  ring = false,
  deceased = false,
  className = '',
  ...rest
}) {
  const [failed, setFailed] = useState(false);

  const name = nameProp ?? member?.name ?? '';
  const photoURL = photoProp ?? member?.photoURL ?? null;
  const isMemorial = deceased || Boolean(member?.passedAwayDate);
  const showPhoto = Boolean(photoURL) && !failed;

  const classes = [
    'avatar',
    `avatar--${size}`,
    ring && 'avatar--ring',
    isMemorial && 'avatar--memorial',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      /* Only paint the gradient when no photo will cover it — otherwise it
         bleeds through a transparent PNG. */
      style={showPhoto ? undefined : { backgroundImage: FALLBACKS[hashString(name) % FALLBACKS.length] }}
      {...rest}
    >
      {showPhoto ? (
        <img
          src={photoURL}
          alt={name}
          loading="lazy"
          decoding="async"
          /* A 404'd photoURL used to render the browser's broken-image glyph.
             Now it degrades to the monogram. */
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="avatar__initials" aria-hidden="true">
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}

export default Avatar;

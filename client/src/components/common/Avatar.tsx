import React, { useState } from 'react';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  showStatus?: boolean;
  className?: string;
}

const SIZES = {
  sm: { box: 34, font: 13, dot: 9 },
  md: { box: 46, font: 16, dot: 12 },
  lg: { box: 56, font: 20, dot: 14 },
  xl: { box: 84, font: 30, dot: 18 }
} as const;

/** Iniziali del contatto su gradiente brand — fallback elegante senza asset esterni. */
const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || '?';

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  isOnline = false,
  showStatus = false,
  className = ''
}) => {
  const [imgError, setImgError] = useState(false);
  const current = SIZES[size];
  const showImage = Boolean(src) && !imgError;

  return (
    <div
      style={{
        position: 'relative',
        width: current.box,
        height: current.box,
        flexShrink: 0
      }}
      className={className}
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          onError={() => setImgError(true)}
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'cover',
            backgroundColor: 'var(--panel-active)',
            display: 'block'
          }}
        />
      ) : (
        <div
          aria-label={name}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: 'var(--brand-gradient)',
            color: '#f2fff9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: current.font,
            fontWeight: 700,
            letterSpacing: '0.3px'
          }}
        >
          {initialsOf(name)}
        </div>
      )}
      {showStatus && isOnline && (
        <span
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: current.dot,
            height: current.dot,
            borderRadius: '50%',
            backgroundColor: 'var(--brand-mint)',
            border: '2px solid var(--bg-sidebar)',
            boxShadow: '0 0 6px rgba(60, 224, 164, 0.55)'
          }}
        />
      )}
    </div>
  );
};

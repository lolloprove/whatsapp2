import React from 'react';

interface LogoProps {
  size?: number;
  glow?: boolean;
  style?: React.CSSProperties;
}

/**
 * Logo ufficiale WhatsApp 2 — il volto dell'Onorevole Lisi.
 * Emblema nero/verde/oro, si integra con le superfici scure dell'app.
 */
export const Logo: React.FC<LogoProps> = ({ size = 40, glow = false, style }) => (
  <img
    src="/logo.png"
    alt="WhatsApp 2 — Onorevole Lisi"
    draggable={false}
    style={{
      width: size,
      height: size,
      borderRadius: Math.round(size * 0.28),
      boxShadow: glow ? 'var(--gold-glow)' : '0 2px 10px rgba(0, 0, 0, 0.35)',
      flexShrink: 0,
      ...style
    }}
  />
);

interface WordmarkProps {
  fontSize?: number;
}

/** Scritta "WhatsApp 2" con il 2 in menta accento. */
export const Wordmark: React.FC<WordmarkProps> = ({ fontSize = 21 }) => (
  <span className="wordmark" style={{ fontSize }}>
    WhatsApp <span className="wordmark-2">2</span>
  </span>
);

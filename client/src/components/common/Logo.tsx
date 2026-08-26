import React from 'react';

interface LogoProps {
  size?: number;
  glow?: boolean;
  style?: React.CSSProperties;
}

/**
 * Logo ufficiale WhatsApp 2 — la bolla verde del brand.
 * Renderizzata come app-icon squircle, si integra con le superfici scure.
 */
export const Logo: React.FC<LogoProps> = ({ size = 40, glow = false, style }) => (
  <img
    src="/logo.png"
    alt="WhatsApp 2"
    draggable={false}
    style={{
      width: size,
      height: size,
      borderRadius: Math.round(size * 0.28),
      boxShadow: glow ? 'var(--brand-glow)' : '0 2px 10px rgba(0, 0, 0, 0.35)',
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

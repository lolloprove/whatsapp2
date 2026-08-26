import React from 'react';

interface BadgeProps {
  count?: number;
  label?: string;
  variant?: 'unread' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({ count, label, variant = 'neutral' }) => {
  if (variant === 'unread' && count && count > 0) {
    return (
      <span
        style={{
          background: 'var(--brand-mint)',
          color: '#052015',
          fontSize: '11px',
          fontWeight: 800,
          minWidth: '19px',
          height: '19px',
          borderRadius: '10px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 5px',
          boxShadow: '0 2px 6px rgba(60, 224, 164, 0.35)'
        }}
      >
        {count > 99 ? '99+' : count}
      </span>
    );
  }

  return (
    <span
      style={{
        background: 'var(--panel-active)',
        color: 'var(--text-secondary)',
        fontSize: '11px',
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: 'var(--radius-full)'
      }}
    >
      {label}
    </span>
  );
};

import React from 'react';

export interface BadgeProps {
  variant?: 'primary' | 'accent' | 'neutral' | 'success' | 'warning';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  icon,
}) => {
  const stylesByVariant: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--color-primary-soft)',
      color: 'var(--color-primary)',
      border: '1px solid rgba(36, 92, 79, 0.2)',
    },
    accent: {
      backgroundColor: 'var(--color-accent-soft)',
      color: '#7D4F1E',
      border: '1px solid rgba(247, 232, 215, 0.8)',
    },
    neutral: {
      backgroundColor: '#EFF3F0',
      color: 'var(--color-text-muted)',
      border: '1px solid var(--color-border)',
    },
    success: {
      backgroundColor: 'var(--color-success-soft)',
      color: 'var(--color-success)',
      border: '1px solid rgba(30, 107, 67, 0.2)',
    },
    warning: {
      backgroundColor: '#FEF3C7',
      color: '#92400E',
      border: '1px solid #FDE68A',
    },
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 10px',
        borderRadius: 'var(--radius-badge)',
        fontSize: 'var(--font-size-xs)',
        fontWeight: 500,
        lineHeight: 1.4,
        ...stylesByVariant[variant],
      }}
    >
      {icon && <span style={{ display: 'inline-flex', fontSize: '12px' }}>{icon}</span>}
      {children}
    </span>
  );
};

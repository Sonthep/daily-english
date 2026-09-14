import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'accent' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  children,
  style,
  className = '',
  ...props
}) => {
  const paddingMap = {
    none: '0',
    sm: 'var(--space-md)',
    md: 'var(--space-lg)',
    lg: 'var(--space-xl)',
  };

  const baseStyles: React.CSSProperties = {
    backgroundColor: variant === 'accent' ? 'var(--color-primary-soft)' : 'var(--color-surface)',
    border: variant === 'accent' ? '1px solid rgba(36, 92, 79, 0.15)' : '1px solid var(--color-border)',
    borderRadius: 'var(--radius-card)',
    padding: paddingMap[padding],
    boxShadow: variant === 'elevated' ? 'var(--shadow-elevated)' : 'var(--shadow-subtle)',
    transition: 'transform var(--transition-smooth), box-shadow var(--transition-smooth)',
    ...style,
  };

  return (
    <div style={baseStyles} className={`custom-card ${className}`} {...props}>
      {children}
    </div>
  );
};

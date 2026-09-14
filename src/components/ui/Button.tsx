import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      disabled = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    // Style configurations based on tokens
    const baseStyles: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontFamily: 'inherit',
      fontWeight: 500,
      borderRadius: 'var(--radius-control)',
      border: '1px solid transparent',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.55 : 1,
      minHeight: 'var(--touch-target-min)',
      padding:
        size === 'sm'
          ? '8px 14px'
          : size === 'lg'
          ? '14px 24px'
          : '10px 18px',
      fontSize: size === 'sm' ? 'var(--font-size-sm)' : size === 'lg' ? 'var(--font-size-md)' : 'var(--font-size-base)',
      width: fullWidth ? '100%' : 'auto',
      transition: 'background-color var(--transition-smooth), border-color var(--transition-smooth), transform var(--transition-smooth)',
      userSelect: 'none',
      textDecoration: 'none',
    };

    const variantStyles: Record<string, React.CSSProperties> = {
      primary: {
        backgroundColor: 'var(--color-primary)',
        color: '#FFFFFF',
        borderColor: 'var(--color-primary)',
        boxShadow: '0 2px 6px rgba(36, 92, 79, 0.2)',
      },
      secondary: {
        backgroundColor: 'var(--color-primary-soft)',
        color: 'var(--color-primary)',
        borderColor: 'transparent',
      },
      outline: {
        backgroundColor: 'transparent',
        color: 'var(--color-text)',
        borderColor: 'var(--color-border)',
      },
      ghost: {
        backgroundColor: 'transparent',
        color: 'var(--color-text-muted)',
        borderColor: 'transparent',
      },
      danger: {
        backgroundColor: 'var(--color-error-soft)',
        color: 'var(--color-error)',
        borderColor: 'transparent',
      },
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        style={{ ...baseStyles, ...variantStyles[variant] }}
        className={`custom-btn ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

import React from 'react';
import { Button } from './Button';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastProps {
  message: string;
  action?: ToastAction;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, action, onClose }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        backgroundColor: '#182A25',
        color: '#F8F9F5',
        padding: '12px 20px',
        borderRadius: 'var(--radius-control)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        maxWidth: '90vw',
        fontSize: 'var(--font-size-sm)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <span>{message}</span>
      {action && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            action.onClick();
            onClose();
          }}
          style={{
            padding: '4px 10px',
            minHeight: '32px',
            fontSize: 'var(--font-size-xs)',
            backgroundColor: '#E7F0EA',
            color: '#245C4F',
          }}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};

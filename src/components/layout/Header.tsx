import React from 'react';
import { Settings, User } from 'lucide-react';
import { AppRoute, Profile } from '../../types';

export interface HeaderProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  profile: Profile | null;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, profile }) => {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-md) var(--space-base)',
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 80,
      }}
    >
      <div
        onClick={() => onNavigate({ path: 'today' })}
        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
      >
        <img src="/logo.svg" alt="Daily English" style={{ width: '28px', height: '28px' }} />
        <span style={{ fontWeight: 700, fontSize: 'var(--font-size-md)', color: 'var(--color-text)' }}>
          Daily English
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => onNavigate({ path: 'settings' })}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: '1px solid var(--color-border)',
            backgroundColor: '#FAFCFA',
            padding: '6px 12px',
            borderRadius: 'var(--radius-control)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text)',
            cursor: 'pointer',
            minHeight: '38px',
          }}
          aria-label="การตั้งค่าและโปรไฟล์"
        >
          <User size={15} color="var(--color-primary)" />
          <span>{profile?.displayName || 'โปรไฟล์'}</span>
          <Settings size={14} color="var(--color-text-muted)" />
        </button>
      </div>
    </header>
  );
};

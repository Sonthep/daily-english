import React from 'react';
import { Settings, User, Smartphone } from 'lucide-react';
import { AppRoute, Profile } from '../../types';
import { usePwaInstall } from '../../lib/pwa/usePwaInstall';

export interface HeaderProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  profile: Profile | null;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, profile }) => {
  const { canInstall, promptInstall } = usePwaInstall();

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
      <button className="brand-button"
        onClick={() => onNavigate({ path: 'today' })}
        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
      >
        <img src="/logo.svg" alt="Daily English" style={{ width: '28px', height: '28px' }} />
        <span style={{ fontWeight: 700, fontSize: 'var(--font-size-md)', color: 'var(--color-text)' }}>
          Daily English
        </span>
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {canInstall && (
          <button
            onClick={() => promptInstall()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid var(--color-primary)',
              backgroundColor: '#E7F0EA',
              padding: '6px 12px',
              borderRadius: 'var(--radius-control)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-primary)',
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: 'var(--touch-target-min)',
            }}
            aria-label="ติดตั้งแอป Daily English"
            title="ติดตั้งลงเครื่องเพื่อใช้งานแบบออฟไลน์และเปิดได้ทันที"
          >
            <Smartphone size={15} />
            <span>ติดตั้งแอป</span>
          </button>
        )}
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
            minHeight: 'var(--touch-target-min)',
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

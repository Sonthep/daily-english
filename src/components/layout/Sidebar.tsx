import React from 'react';
import { Calendar, BookOpen, Bookmark, BarChart3, Settings, User, Video } from 'lucide-react';
import { AppRoute, Profile } from '../../types';

export interface SidebarProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  profile: Profile | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  profile,
}) => {
  const navItems = [
    { id: 'today', label: 'Today', icon: Calendar },
    { id: 'practice', label: 'Practice', icon: BookOpen },
    { id: 'resources', label: 'Resources', icon: Video },
    { id: 'phrases', label: 'My Phrases', icon: Bookmark },
    { id: 'progress', label: 'Progress', icon: BarChart3 },
  ];

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        backgroundColor: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'var(--space-lg) var(--space-md)',
        height: '100vh',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
      }}
    >
      {/* Top brand */}
      <div>
        <div
          onClick={() => onNavigate({ path: 'today' })}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 12px',
            marginBottom: 'var(--space-xl)',
            cursor: 'pointer',
          }}
        >
          <img src="/logo.svg" alt="Daily English Logo" style={{ width: '32px', height: '32px' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 'var(--font-size-md)', color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
              Daily English
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              ฝึกวันละ 5 หรือ 15 นาที
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav aria-label="เมนูหลัก" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute.path === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate({ path: item.id as any })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-control)',
                  border: 'none',
                  backgroundColor: isActive ? 'var(--color-primary-soft)' : 'transparent',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: 'var(--font-size-base)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all var(--transition-smooth)',
                  minHeight: 'var(--touch-target-min)',
                }}
              >
                <Icon size={19} color={isActive ? 'var(--color-primary)' : 'var(--color-text-muted)'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Profile & Settings area at bottom */}
      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-md)' }}>
        <button
          onClick={() => onNavigate({ path: 'settings' })}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '10px 12px',
            borderRadius: 'var(--radius-control)',
            border: currentRoute.path === 'settings' ? '1px solid var(--color-primary)' : '1px solid transparent',
            backgroundColor: currentRoute.path === 'settings' ? 'var(--color-primary-soft)' : '#FAFCFA',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-soft)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <User size={16} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {profile?.displayName || 'คุณปุ๊ก'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                {profile?.dailyMinutes || 5} นาที / วัน
              </div>
            </div>
          </div>
          <Settings size={16} color="var(--color-text-muted)" />
        </button>
      </div>
    </aside>
  );
};

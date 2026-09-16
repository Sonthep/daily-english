import React from 'react';
import { Calendar, BookOpen, Video, Bookmark, BarChart3 } from 'lucide-react';
import { AppRoute } from '../../types';

export interface BottomNavProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentRoute, onNavigate }) => {
  const navItems = [
    { id: 'today', label: 'วันนี้', icon: Calendar },
    { id: 'practice', label: 'บทเรียน', icon: BookOpen },
    { id: 'resources', label: 'สื่อฝึก', icon: Video },
    { id: 'phrases', label: 'คลังวลี', icon: Bookmark },
    { id: 'progress', label: 'ความก้าวหน้า', icon: BarChart3 },
  ];

  return (
    <nav
      aria-label="เมนูหลักสำหรับมือถือ"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 90,
        backgroundColor: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingTop: '6px',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.04)',
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentRoute.path === item.id;
        return (
          <button
            key={item.id}
                aria-current={isActive ? 'page' : undefined}
                className="nav-item"
            onClick={() => onNavigate({ path: item.id as any })}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              border: 'none',
              backgroundColor: 'transparent',
              color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: '6px 12px',
              minWidth: '56px',
              minHeight: 'var(--touch-target-min)',
              transition: 'color var(--transition-smooth)',
            }}
          >
            <Icon size={20} strokeWidth={isActive ? 2.3 : 1.8} />
            <span style={{ fontSize: '11px', fontWeight: isActive ? 600 : 400 }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

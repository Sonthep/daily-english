import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Header } from './Header';
import { AppRoute, Profile } from '../../types';

export interface AppShellProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  profile: Profile | null;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentRoute,
  onNavigate,
  profile,
  children,
}) => {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isDesktop = windowWidth >= 1024;
  const isMobile = windowWidth < 1024;

  // Onboarding, active lesson, and resource study have minimal shell (no sidebar or bottom nav to keep focus)
  const isFocusedMode =
    currentRoute.path === 'lesson' ||
    currentRoute.path === 'resource-study' ||
    currentRoute.path === 'onboarding';

  if (isFocusedMode) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--color-bg)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <main style={{ flex: 1, width: '100%' }}>{children}</main>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg)',
        overflowX: 'hidden',
      }}
    >
      <button className="skip-link" onClick={() => document.getElementById('main-content')?.focus()}>ข้ามไปเนื้อหา</button>
      {/* Desktop Sidebar (>= 1024px) */}
      {isDesktop && (
        <Sidebar
          currentRoute={currentRoute}
          onNavigate={onNavigate}
          profile={profile}
        />
      )}

      {/* Main Container */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          position: 'relative',
        }}
      >
        {/* Header for Tablet & Mobile (< 1024px) */}
        {!isDesktop && (
          <Header
            currentRoute={currentRoute}
            onNavigate={onNavigate}
            profile={profile}
          />
        )}

        {/* Scrollable Content Area */}
        <main id="main-content" tabIndex={-1}
          style={{
            flex: 1,
            width: '100%',
            maxWidth: 'var(--content-max-width)',
            margin: '0 auto',
            padding: isMobile
              ? 'var(--space-lg) var(--space-base) calc(var(--space-2xl) + var(--space-2xl) + env(safe-area-inset-bottom, 0px))'
              : 'var(--space-2xl) var(--space-xl)',
            boxSizing: 'border-box',
          }}
        >
          {children}
        </main>

        {/* Mobile and tablet navigation (< 1024px) */}
        {isMobile && (
          <BottomNav currentRoute={currentRoute} onNavigate={onNavigate} />
        )}
      </div>
    </div>
  );
};

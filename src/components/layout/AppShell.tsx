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
  const isMobile = windowWidth < 768;

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
        <main
          style={{
            flex: 1,
            width: '100%',
            maxWidth: 'var(--content-max-width)',
            margin: '0 auto',
            padding: isMobile
              ? 'var(--space-base) var(--space-base) calc(var(--space-2xl) + 40px)'
              : 'var(--space-xl) var(--space-lg)',
            boxSizing: 'border-box',
          }}
        >
          {children}
        </main>

        {/* Mobile Bottom Navigation (< 768px) */}
        {isMobile && (
          <BottomNav currentRoute={currentRoute} onNavigate={onNavigate} />
        )}
      </div>
    </div>
  );
};

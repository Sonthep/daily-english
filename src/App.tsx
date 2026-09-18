import React, { useState, useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { OnboardingScreen } from './features/onboarding/OnboardingScreen';
import { TodayScreen } from './features/today/TodayScreen';
import { PracticeScreen } from './features/practice/PracticeScreen';
import { LessonScreen } from './features/lesson/LessonScreen';
import { ResourcesScreen } from './features/resources/ResourcesScreen';
import { ResourceStudyScreen } from './features/resources/ResourceStudyScreen';
import { PhrasesScreen } from './features/phrases/PhrasesScreen';
import { ProgressScreen } from './features/progress/ProgressScreen';
import { SettingsScreen } from './features/settings/SettingsScreen';
import { AppRoute, Profile, Lesson, LearningResource } from './types';
import { profileRepo, lessonRepo, resourceRepo } from './lib/storage/repositories';

export const App: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentRoute, setCurrentRoute] = useState<AppRoute>({ path: 'today' });
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [currentResource, setCurrentResource] = useState<LearningResource | null>(null);
  const [lessonModeMinutes, setLessonModeMinutes] = useState<5 | 15>(5);
  const [isInitializing, setIsInitializing] = useState(true);

  // Parse URL hash on mount or hash change
  const parseRouteFromUrl = (): AppRoute => {
    const hash = window.location.hash.replace(/^#\/?/, '');
    if (!hash || hash === 'today') return { path: 'today' };
    if (hash === 'onboarding') return { path: 'onboarding' };
    if (hash === 'practice') return { path: 'practice' };
    if (hash === 'resources') return { path: 'resources' };
    if (hash === 'phrases') return { path: 'phrases' };
    if (hash === 'progress') return { path: 'progress' };
    if (hash === 'settings') return { path: 'settings' };
    if (hash.startsWith('lesson/')) {
      const id = hash.replace('lesson/', '');
      return { path: 'lesson', lessonId: id };
    }
    if (hash.startsWith('resource-study/')) {
      const id = hash.replace('resource-study/', '');
      return { path: 'resource-study', resourceId: id };
    }
    return { path: 'today' };
  };

  const navigateTo = (route: AppRoute) => {
    setCurrentRoute(route);
    let hash = `#/${route.path}`;
    if (route.path === 'lesson') {
      hash = `#/lesson/${route.lessonId}`;
    } else if (route.path === 'resource-study') {
      hash = `#/resource-study/${route.resourceId}`;
    }
    window.location.hash = hash;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadLesson = async (lessonId: string) => {
    const lesson = await lessonRepo.getLessonById(lessonId);
    if (lesson) {
      setCurrentLesson(lesson);
    }
  };

  const loadResource = async (resourceId: string) => {
    const res = await resourceRepo.getResourceById(resourceId);
    if (res) {
      setCurrentResource(res);
    }
  };

  useEffect(() => {
    const initApp = async () => {
      try {
        await lessonRepo.seedLessonsIfEmpty();
        await resourceRepo.seedResourcesIfEmpty();
        let p = await profileRepo.getProfile();
        if (!p) {
          p = await profileRepo.initDefaultProfile();
        }
        setProfile(p);

        const initialRoute = parseRouteFromUrl();
        if (!p.onboardingCompleted && initialRoute.path !== 'onboarding') {
          navigateTo({ path: 'onboarding' });
        } else {
          setCurrentRoute(initialRoute);
          if (initialRoute.path === 'lesson') {
            await loadLesson(initialRoute.lessonId);
            setLessonModeMinutes(p.dailyMinutes || 5);
          } else if (initialRoute.path === 'resource-study') {
            await loadResource(initialRoute.resourceId);
          }
        }
      } finally {
        setIsInitializing(false);
      }
    };

    initApp();

    const handleHashChange = async () => {
      const route = parseRouteFromUrl();
      setCurrentRoute(route);
      if (route.path === 'lesson') {
        await loadLesson(route.lessonId);
      } else if (route.path === 'resource-study') {
        await loadResource(route.resourceId);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleStartLesson = async (lessonId: string, durationMinutes: 5 | 15) => {
    await loadLesson(lessonId);
    setLessonModeMinutes(durationMinutes);
    navigateTo({ path: 'lesson', lessonId });
  };

  const handleStudyResource = async (resourceId: string) => {
    await loadResource(resourceId);
    navigateTo({ path: 'resource-study', resourceId });
  };

  const handleProfileRefresh = async () => {
    const p = await profileRepo.getProfile();
    setProfile(p);
  };

  if (isInitializing) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-primary)',
          fontSize: 'var(--font-size-md)',
          fontWeight: 500,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.svg" alt="Logo" style={{ width: '36px', height: '36px' }} />
          <span>กำลังเปิด Daily English...</span>
        </div>
      </div>
    );
  }

  // Render Screens
  return (
    <AppShell
      currentRoute={currentRoute}
      onNavigate={navigateTo}
      profile={profile}
    >
      {currentRoute.path === 'onboarding' && (
        <OnboardingScreen
          onComplete={(firstLessonId) => {
            handleProfileRefresh();
            handleStartLesson(firstLessonId, profile?.dailyMinutes || 5);
          }}
          onSkip={() => {
            handleProfileRefresh();
            navigateTo({ path: 'today' });
          }}
        />
      )}

      {currentRoute.path === 'today' && (
        <TodayScreen
          onNavigate={navigateTo}
          onStartLesson={handleStartLesson}
        />
      )}

      {currentRoute.path === 'practice' && (
        <PracticeScreen onStartLesson={handleStartLesson} />
      )}

      {currentRoute.path === 'resources' && (
        <ResourcesScreen onStudyResource={handleStudyResource} />
      )}

      {currentRoute.path === 'resource-study' && currentResource && (
        <ResourceStudyScreen
          resource={currentResource}
          onExit={() => navigateTo({ path: 'resources' })}
          onStartLesson={handleStartLesson}
          onResourceUpdated={(updated) => setCurrentResource(updated)}
        />
      )}

      {currentRoute.path === 'lesson' && currentLesson && (
        <LessonScreen
          lesson={currentLesson}
          initialModeMinutes={lessonModeMinutes}
          onExit={() => navigateTo({ path: 'today' })}
        />
      )}

      {currentRoute.path === 'phrases' && <PhrasesScreen />}

      {currentRoute.path === 'progress' && (
        <ProgressScreen onNavigate={navigateTo} />
      )}

      {currentRoute.path === 'settings' && (
        <SettingsScreen onProfileUpdated={handleProfileRefresh} />
      )}
    </AppShell>
  );
};

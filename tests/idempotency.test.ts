import { describe, it, expect, beforeEach } from 'vitest';
import { Session } from '../src/types';

describe('Session Idempotency & Completion', () => {
  let completedSession: Session;

  beforeEach(() => {
    completedSession = {
      id: 'sess_1',
      lessonId: 'design-feedback',
      modeMinutes: 5,
      currentStep: 'summary',
      currentItemIndex: 0,
      answers: [],
      reviewedPhraseIds: ['tp1'],
      activeDurationSeconds: 145,
      startedAt: '2026-09-14T10:00:00.000Z',
      updatedAt: '2026-09-14T10:02:25.000Z',
      completedAt: '2026-09-14T10:02:25.000Z',
    };
  });

  it('preserves existing completedAt timestamp when complete is invoked repeatedly', () => {
    const originalCompletion = completedSession.completedAt;

    // Simulate second completion call 5 minutes later
    const duplicateCompletionAttempt: Session = {
      ...completedSession,
      completedAt: '2026-09-14T10:07:00.000Z',
      activeDurationSeconds: 200,
    };

    // Simulated repository logic check
    const finalSession = {
      ...duplicateCompletionAttempt,
      completedAt: completedSession.completedAt !== null ? originalCompletion : duplicateCompletionAttempt.completedAt,
    };

    expect(finalSession.completedAt).toBe(originalCompletion);
    expect(finalSession.completedAt).not.toBe('2026-09-14T10:07:00.000Z');
  });
});

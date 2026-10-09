import { describe, expect, it } from 'vitest';
import { Session } from '../src/types';
import {
  buildSessionAnswers,
  createSessionProgressSnapshot,
} from '../src/lib/session/sessionSnapshot';

const BASE_SESSION: Session = {
  id: 'session-1',
  lessonId: 'lesson-1',
  modeMinutes: 5,
  currentStep: 'listen',
  currentItemIndex: 0,
  answers: [
    {
      promptId: 'prompt-1',
      answerText: 'Original answer',
      answeredAt: '2026-10-09T01:00:00.000Z',
    },
  ],
  reviewedPhraseIds: [],
  activeDurationSeconds: 10,
  startedAt: '2026-10-09T00:59:00.000Z',
  updatedAt: '2026-10-09T01:00:00.000Z',
  completedAt: null,
};

describe('session progress snapshots', () => {
  it('keeps answeredAt stable while an answer is unchanged', () => {
    const answers = buildSessionAnswers(
      { 'prompt-1': 'Original answer' },
      BASE_SESSION.answers,
      '2026-10-09T02:00:00.000Z'
    );

    expect(answers[0].answeredAt).toBe('2026-10-09T01:00:00.000Z');
  });

  it('updates answeredAt only when the answer text changes', () => {
    const answers = buildSessionAnswers(
      { 'prompt-1': 'Improved answer' },
      BASE_SESSION.answers,
      '2026-10-09T02:00:00.000Z'
    );

    expect(answers[0]).toEqual({
      promptId: 'prompt-1',
      answerText: 'Improved answer',
      answeredAt: '2026-10-09T02:00:00.000Z',
    });
  });

  it('creates a completion-ready snapshot with current answers and reviews', () => {
    const snapshot = createSessionProgressSnapshot(
      BASE_SESSION,
      {
        currentStep: 'summary',
        currentItemIndex: 0,
        userAnswers: { 'prompt-1': 'Improved answer' },
        reviewedPhraseIds: ['phrase-1', 'phrase-1', 'phrase-2'],
        activeDurationSeconds: 42,
      },
      '2026-10-09T02:00:00.000Z'
    );

    expect(snapshot.currentStep).toBe('summary');
    expect(snapshot.answers[0].answerText).toBe('Improved answer');
    expect(snapshot.reviewedPhraseIds).toEqual(['phrase-1', 'phrase-2']);
    expect(snapshot.activeDurationSeconds).toBe(42);
  });
});

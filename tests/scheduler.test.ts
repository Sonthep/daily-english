import { describe, it, expect } from 'vitest';
import {
  calculateNextReview,
  sortPhrasesByDue,
  getDuePhrases,
  createNewPhrase,
  AGAIN_INTERVAL_MINUTES,
} from '../src/lib/review/scheduler';
import { Phrase } from '../src/types';

describe('Spaced Repetition Scheduler', () => {
  const fixedNow = new Date('2026-09-14T10:00:00.000Z');

  it('correctly advances through stages 0 to 5 upon "remembered"', () => {
    // Stage 0 -> 1 (+1 day)
    const res0 = calculateNextReview(0, 'remembered', fixedNow);
    expect(res0.nextStage).toBe(1);
    const expectedTime0 = fixedNow.getTime() + 1 * 24 * 60 * 60 * 1000;
    expect(new Date(res0.dueAt).getTime()).toBe(expectedTime0);

    // Stage 1 -> 2 (+3 days)
    const res1 = calculateNextReview(1, 'remembered', fixedNow);
    expect(res1.nextStage).toBe(2);
    const expectedTime1 = fixedNow.getTime() + 3 * 24 * 60 * 60 * 1000;
    expect(new Date(res1.dueAt).getTime()).toBe(expectedTime1);

    // Stage 2 -> 3 (+7 days)
    const res2 = calculateNextReview(2, 'remembered', fixedNow);
    expect(res2.nextStage).toBe(3);
    const expectedTime2 = fixedNow.getTime() + 7 * 24 * 60 * 60 * 1000;
    expect(new Date(res2.dueAt).getTime()).toBe(expectedTime2);

    // Stage 3 -> 4 (+14 days)
    const res3 = calculateNextReview(3, 'remembered', fixedNow);
    expect(res3.nextStage).toBe(4);
    const expectedTime3 = fixedNow.getTime() + 14 * 24 * 60 * 60 * 1000;
    expect(new Date(res3.dueAt).getTime()).toBe(expectedTime3);

    // Stage 4 -> 5 (+30 days)
    const res4 = calculateNextReview(4, 'remembered', fixedNow);
    expect(res4.nextStage).toBe(5);
    const expectedTime4 = fixedNow.getTime() + 30 * 24 * 60 * 60 * 1000;
    expect(new Date(res4.dueAt).getTime()).toBe(expectedTime4);

    // Stage 5 -> stays 5 (+30 days)
    const res5 = calculateNextReview(5, 'remembered', fixedNow);
    expect(res5.nextStage).toBe(5);
    expect(new Date(res5.dueAt).getTime()).toBe(expectedTime4);
  });

  it('resets to stage 0 and schedules in 10 minutes upon "again"', () => {
    const res = calculateNextReview(4, 'again', fixedNow);
    expect(res.nextStage).toBe(0);
    const expectedTime = fixedNow.getTime() + AGAIN_INTERVAL_MINUTES * 60 * 1000;
    expect(new Date(res.dueAt).getTime()).toBe(expectedTime);
  });

  it('creates new phrase with stage 0 and due immediately', () => {
    const p = createNewPhrase('Hello', 'สวัสดี', 'Hello world', 'General', null, fixedNow);
    expect(p.reviewStage).toBe(0);
    expect(p.dueAt).toBe(fixedNow.toISOString());
    expect(p.en).toBe('Hello');
    expect(p.th).toBe('สวัสดี');
  });

  it('sorts phrases by oldest due date first', () => {
    const p1: Phrase = {
      id: '1',
      en: 'A',
      th: 'ก',
      example: '',
      category: 'General',
      sourceLessonId: null,
      reviewStage: 1,
      dueAt: '2026-09-14T12:00:00.000Z',
      createdAt: '',
      updatedAt: '',
    };
    const p2: Phrase = {
      id: '2',
      en: 'B',
      th: 'ข',
      example: '',
      category: 'General',
      sourceLessonId: null,
      reviewStage: 1,
      dueAt: '2026-09-14T08:00:00.000Z', // earlier
      createdAt: '',
      updatedAt: '',
    };

    const sorted = sortPhrasesByDue([p1, p2]);
    expect(sorted[0].id).toBe('2');
    expect(sorted[1].id).toBe('1');
  });

  it('filters only phrases that are due at or before the given time', () => {
    const pastPhrase: Phrase = {
      id: '1',
      en: 'A',
      th: 'ก',
      example: '',
      category: 'General',
      sourceLessonId: null,
      reviewStage: 0,
      dueAt: '2026-09-14T09:00:00.000Z',
      createdAt: '',
      updatedAt: '',
    };
    const futurePhrase: Phrase = {
      id: '2',
      en: 'B',
      th: 'ข',
      example: '',
      category: 'General',
      sourceLessonId: null,
      reviewStage: 0,
      dueAt: '2026-09-14T11:00:00.000Z',
      createdAt: '',
      updatedAt: '',
    };

    const due = getDuePhrases([pastPhrase, futurePhrase], fixedNow);
    expect(due.length).toBe(1);
    expect(due[0].id).toBe('1');
  });
});

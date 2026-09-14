import { describe, it, expect } from 'vitest';
import {
  formatDurationThai,
  getDayKeyInTimezone,
  getPast7DaysActivity,
} from '../src/lib/review/dateUtils';
import { Session } from '../src/types';

describe('Date & Duration Utilities', () => {
  it('formats duration in seconds into friendly Thai strings', () => {
    expect(formatDurationThai(30)).toBe('30 วินาที');
    expect(formatDurationThai(60)).toBe('1 นาที');
    expect(formatDurationThai(125)).toBe('2 นาที 5 วินาที');
    expect(formatDurationThai(0)).toBe('1 วินาที'); // clamped minimum for clarity
  });

  it('converts UTC timestamp to YYYY-MM-DD in user timezone', () => {
    // 2026-09-14T20:00:00Z is 2026-09-15 03:00 in Asia/Bangkok (UTC+7)
    const keyBangkok = getDayKeyInTimezone('2026-09-14T20:00:00.000Z', 'Asia/Bangkok');
    expect(keyBangkok).toBe('2026-09-15');

    // In UTC, it is 2026-09-14
    const keyUtc = getDayKeyInTimezone('2026-09-14T20:00:00.000Z', 'UTC');
    expect(keyUtc).toBe('2026-09-14');
  });

  it('generates exactly 7 days of activity with today flagged', () => {
    const fixedNow = new Date('2026-09-14T10:00:00.000Z');
    const mockSessions: Session[] = [
      {
        id: 's1',
        lessonId: 'l1',
        modeMinutes: 5,
        currentStep: 'summary',
        currentItemIndex: 0,
        answers: [],
        reviewedPhraseIds: [],
        activeDurationSeconds: 180,
        startedAt: '2026-09-14T09:00:00.000Z',
        updatedAt: '2026-09-14T09:05:00.000Z',
        completedAt: '2026-09-14T09:05:00.000Z',
      },
    ];

    const activity = getPast7DaysActivity(mockSessions, 'Asia/Bangkok', fixedNow);
    expect(activity.length).toBe(7);

    // Last element should be today
    const lastDay = activity[6];
    expect(lastDay.isToday).toBe(true);
    expect(lastDay.completedSessions).toBe(1);
    expect(lastDay.totalActiveSeconds).toBe(180);
  });
});

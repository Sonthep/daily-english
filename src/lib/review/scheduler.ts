import { Phrase, ReviewEvent } from '../../types';

export const STAGE_INTERVALS_DAYS = [1, 3, 7, 14, 30] as const;
export const AGAIN_INTERVAL_MINUTES = 10;

export interface ReviewCalculationResult {
  nextStage: number;
  dueAt: string; // ISO UTC
}

/**
 * Calculates the next stage and due date according to the Spaced Repetition Heuristic:
 * - Again: stage resets to 0, due in 10 minutes.
 * - Remembered:
 *    stage 0 -> stage 1 (+1 day)
 *    stage 1 -> stage 2 (+3 days)
 *    stage 2 -> stage 3 (+7 days)
 *    stage 3 -> stage 4 (+14 days)
 *    stage 4+ -> stage 5 (+30 days)
 */
export function calculateNextReview(
  currentStage: number,
  result: 'again' | 'remembered',
  now: Date = new Date()
): ReviewCalculationResult {
  const baseTime = now.getTime();

  if (result === 'again') {
    const dueTime = baseTime + AGAIN_INTERVAL_MINUTES * 60 * 1000;
    return {
      nextStage: 0,
      dueAt: new Date(dueTime).toISOString(),
    };
  }

  // Remembered
  const nextStage = Math.min(currentStage + 1, 5);
  // Interval index is capped at STAGE_INTERVALS_DAYS.length - 1 (30 days)
  const intervalIndex = Math.min(currentStage, STAGE_INTERVALS_DAYS.length - 1);
  const daysToAdd = STAGE_INTERVALS_DAYS[intervalIndex];
  const dueTime = baseTime + daysToAdd * 24 * 60 * 60 * 1000;

  return {
    nextStage,
    dueAt: new Date(dueTime).toISOString(),
  };
}

/**
 * Sorts phrases so that the oldest due date comes first.
 */
export function sortPhrasesByDue(phrases: Phrase[]): Phrase[] {
  return [...phrases].sort((a, b) => {
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  });
}

/**
 * Filters phrases that are due at or before nowUtc.
 */
export function getDuePhrases(phrases: Phrase[], now: Date = new Date()): Phrase[] {
  const nowTime = now.getTime();
  const due = phrases.filter((p) => new Date(p.dueAt).getTime() <= nowTime);
  return sortPhrasesByDue(due);
}

/**
 * Helper to create a new phrase with initial review stage 0 and due immediately.
 */
export function createNewPhrase(
  en: string,
  th: string,
  example: string,
  category: string,
  sourceLessonId: string | null = null,
  now: Date = new Date()
): Phrase {
  const isoNow = now.toISOString();
  return {
    id: `phrase_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    en: en.trim(),
    th: th.trim(),
    example: example.trim(),
    category,
    sourceLessonId,
    reviewStage: 0,
    dueAt: isoNow,
    createdAt: isoNow,
    updatedAt: isoNow,
  };
}

/**
 * Helper to generate a ReviewEvent record.
 */
export function createReviewEvent(
  phraseId: string,
  result: 'again' | 'remembered',
  previousStage: number,
  nextStage: number,
  now: Date = new Date()
): ReviewEvent {
  return {
    id: `re_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    phraseId,
    result,
    reviewedAt: now.toISOString(),
    previousStage,
    nextStage,
  };
}

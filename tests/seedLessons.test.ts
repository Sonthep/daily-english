import { describe, it, expect } from 'vitest';
import { SEED_LESSONS } from '../src/data/lessons';

describe('Seed Lessons', () => {
  it('contains at least 3 seed lessons', () => {
    expect(SEED_LESSONS.length).toBeGreaterThanOrEqual(3);
  });

  it('contains required categories: Design & Marketing, Daily Life, Gaming', () => {
    const categories = SEED_LESSONS.map((l) => l.category);
    expect(categories).toContain('Design & Marketing');
    expect(categories).toContain('Daily Life');
    expect(categories).toContain('Gaming');
  });

  it('verifies Lesson 1 (Design feedback) content against specification', () => {
    const lesson1 = SEED_LESSONS.find((l) => l.id === 'design-feedback');
    expect(lesson1).toBeDefined();
    expect(lesson1?.sentences.some((s) => s.en.includes('make the logo a little bigger'))).toBe(true);
    expect(lesson1?.sentences.some((s) => s.en.includes('revised version'))).toBe(true);
    expect(lesson1?.sentences.some((s) => s.en.includes('clarify what you\'d like me to change'))).toBe(true);

    expect(lesson1?.prompts.some((p) => p.questionEn.includes('What did you design today?'))).toBe(true);
    expect(lesson1?.prompts.some((p) => p.questionEn.includes('change a background'))).toBe(true);
  });

  it('verifies Lesson 2 (Daily life) content against specification', () => {
    const lesson2 = SEED_LESSONS.find((l) => l.id === 'daily-life');
    expect(lesson2).toBeDefined();
    expect(lesson2?.sentences.some((s) => s.en.includes('start work at nine'))).toBe(true);
    expect(lesson2?.sentences.some((s) => s.en.includes('made dinner at home'))).toBe(true);
    expect(lesson2?.sentences.some((s) => s.en.includes('get some rest'))).toBe(true);
  });

  it('verifies Lesson 3 (Gaming) content against specification', () => {
    const lesson3 = SEED_LESSONS.find((l) => l.id === 'gaming');
    expect(lesson3).toBeDefined();
    expect(lesson3?.sentences.some((s) => s.en.includes('Where should we go next?'))).toBe(true);
    expect(lesson3?.sentences.some((s) => s.en.includes('moment to recover'))).toBe(true);
    expect(lesson3?.sentences.some((s) => s.en.includes('stay together'))).toBe(true);
  });
});

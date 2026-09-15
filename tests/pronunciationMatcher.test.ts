import { describe, it, expect } from 'vitest';
import {
  evaluatePronunciation,
  cleanEnglishText,
  levenshteinDistance,
  wordSimilarity,
} from '../src/lib/audio/pronunciationMatcher';

describe('pronunciationMatcher - Text Normalization & Distances', () => {
  it('cleans punctuation, accents, and case differences', () => {
    const raw = '“Hello, World! How’s it going?”';
    const cleaned = cleanEnglishText(raw);
    expect(cleaned).toContain('hello');
    expect(cleaned).toContain('world');
    expect(cleaned).not.toContain('“');
    expect(cleaned).not.toContain('!');
    expect(cleaned).not.toContain('?');
  });

  it('calculates Levenshtein distance accurately', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
    expect(levenshteinDistance('design', 'design')).toBe(0);
    expect(levenshteinDistance('cat', 'hat')).toBe(1);
    expect(levenshteinDistance('', 'test')).toBe(4);
  });

  it('calculates word similarity correctly', () => {
    expect(wordSimilarity('design', 'design')).toBe(1);
    expect(wordSimilarity('designed', 'design')).toBeGreaterThan(0.7);
    expect(wordSimilarity('apple', 'banana')).toBeLessThan(0.3);
  });
});

describe('pronunciationMatcher - evaluatePronunciation', () => {
  it('gives 100% score and excellent rating for exact match', () => {
    const target = 'I designed a new button today.';
    const spoken = 'I designed a new button today';
    const res = evaluatePronunciation(target, spoken);

    expect(res.score).toBe(100);
    expect(res.rating).toBe('excellent');
    expect(res.matchedCount).toBe(6);
    expect(res.totalTargetCount).toBe(6);
    expect(res.problemWords.length).toBe(0);
    expect(res.tokens.every((t) => t.status === 'matched')).toBe(true);
  });

  it('handles case-insensitivity and punctuation gracefully', () => {
    const target = 'Could we make this font a bit larger?';
    const spoken = 'could we make this font a bit larger';
    const res = evaluatePronunciation(target, spoken);

    expect(res.score).toBe(100);
    expect(res.rating).toBe('excellent');
  });

  it('correctly detects missing words and flags problem words', () => {
    const target = 'I worked on the user interface and fixed several bugs.';
    const spoken = 'I worked on user interface and fixed bugs';
    const res = evaluatePronunciation(target, spoken);

    expect(res.score).toBeLessThan(100);
    expect(res.score).toBeGreaterThan(60);
    expect(res.problemWords).toContain('the');
    expect(res.problemWords).toContain('several');

    const theToken = res.tokens.find((t) => t.cleanWord === 'the');
    expect(theToken?.status).toBe('missing');
  });

  it('recognizes near matches for slight pronunciation deviations', () => {
    const target = 'I designed three mockups';
    const spoken = 'I design three mockup';
    const res = evaluatePronunciation(target, spoken);

    expect(res.score).toBeGreaterThanOrEqual(70);
    const nearTokens = res.tokens.filter((t) => t.status === 'near');
    expect(nearTokens.length).toBeGreaterThan(0);
  });

  it('returns 0 score and retry rating when no speech is detected', () => {
    const target = 'Good morning everyone.';
    const spoken = '';
    const res = evaluatePronunciation(target, spoken);

    expect(res.score).toBe(0);
    expect(res.rating).toBe('retry');
    expect(res.tokens.every((t) => t.status === 'missing')).toBe(true);
    expect(res.statusLabel).toContain('ตรวจไม่พบ');
  });

  it('applies mild penalty if user speaks excessive unrelated extra words', () => {
    const target = 'Thank you';
    const spoken = 'Thank you very very very much indeed alright okay yes';
    const res = evaluatePronunciation(target, spoken);

    expect(res.score).toBeLessThan(100);
  });
});

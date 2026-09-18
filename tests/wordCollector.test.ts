import { describe, it, expect, beforeEach, vi } from 'vitest';
import { lookupWordWithGemini } from '../src/lib/ai/geminiProvider';
import { createNewPhrase, calculateNextReview } from '../src/lib/review/scheduler';
import { phraseRepo } from '../src/lib/storage/repositories';

describe('Word Collector & Flashcard Feature', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('lookupWordWithGemini', () => {
    it('returns empty fallback if word is empty or whitespace', async () => {
      const res = await lookupWordWithGemini('');
      expect(res.th).toBe('');
      expect(res.example).toBe('');
    });

    it('cleans punctuation around words and falls back gracefully when offline/no mock', async () => {
      // Mock fetch failure to test graceful fallback
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network offline'));
      const res = await lookupWordWithGemini('"opportunity!"', 'We must seize every opportunity.');
      expect(res.th).toBeDefined();
      expect(res.example).toContain('opportunity');
    });

    it('parses valid AI JSON response when Gemini returns word details', async () => {
      const mockGeminiResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    th: 'โอกาส, จังหวะที่เหมาะสม',
                    partOfSpeech: 'noun',
                    phonetic: '/ˌɑː.pɚˈtuː.nə.t̬i/',
                    example: 'This represents a huge opportunity for our team.',
                  }),
                },
              ],
            },
          },
        ],
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeminiResponse,
      } as unknown as Response);

      const res = await lookupWordWithGemini('opportunity', 'This represents a huge opportunity for our team.');
      expect(res.th).toBe('โอกาส, จังหวะที่เหมาะสม');
      expect(res.partOfSpeech).toBe('noun');
      expect(res.phonetic).toBe('/ˌɑː.pɚˈtuː.nə.t̬i/');
      expect(res.example).toBe('This represents a huge opportunity for our team.');
    });
  });

  describe('Flashcard creation and Spaced Repetition integration', () => {
    it('creates and saves collected word phrase into phraseRepo with stage 0', async () => {
      const storedPhrases: any[] = [];
      vi.spyOn(phraseRepo, 'savePhrase').mockImplementation(async (p) => {
        storedPhrases.push(p);
      });
      vi.spyOn(phraseRepo, 'getAllPhrases').mockImplementation(async () => storedPhrases);

      const now = new Date('2026-09-18T12:00:00.000Z');
      const phrase = createNewPhrase(
        'perseverance',
        'ความเพียรพยายาม, ความมุ่งมั่นไม่ยอมแพ้',
        'Through hard work and perseverance, you will succeed.',
        'Vocabulary',
        'jack-ma-resource',
        now
      );

      expect(phrase.en).toBe('perseverance');
      expect(phrase.th).toBe('ความเพียรพยายาม, ความมุ่งมั่นไม่ยอมแพ้');
      expect(phrase.reviewStage).toBe(0);
      expect(phrase.dueAt).toBe(now.toISOString());
      expect(phrase.sourceLessonId).toBe('jack-ma-resource');

      // Save to repository
      await phraseRepo.savePhrase(phrase);

      const all = await phraseRepo.getAllPhrases();
      expect(all).toHaveLength(1);
      expect(all[0].en).toBe('perseverance');
      expect(all[0].th).toBe('ความเพียรพยายาม, ความมุ่งมั่นไม่ยอมแพ้');
    });

    it('transitions newly collected flashcard from Stage 0 to Stage 1 when remembered', () => {
      const now = new Date('2026-09-18T12:00:00.000Z');
      const calc = calculateNextReview(0, 'remembered', now);
      expect(calc.nextStage).toBe(1);
      expect(new Date(calc.dueAt).getTime()).toBe(now.getTime() + 24 * 60 * 60 * 1000);
    });
  });
});

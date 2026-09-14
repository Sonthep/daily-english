import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getStoredGeminiApiKey,
  setStoredGeminiApiKey,
  clearStoredGeminiApiKey,
  parseGeminiFeedbackResponse,
  GeminiTutorProvider,
} from '../src/lib/ai/geminiProvider';
import {
  getActiveTutorProvider,
  ExampleTutorProvider,
} from '../src/lib/ai/provider';

describe('AI Coach & Gemini BYOK Provider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('API Key Storage Helpers', () => {
    it('stores, retrieves, and clears API key in localStorage', () => {
      expect(getStoredGeminiApiKey()).toBeNull();

      setStoredGeminiApiKey('AIzaSyFakeKey12345');
      expect(getStoredGeminiApiKey()).toBe('AIzaSyFakeKey12345');

      clearStoredGeminiApiKey();
      expect(getStoredGeminiApiKey()).toBeNull();
    });

    it('trims whitespace and ignores empty string key', () => {
      setStoredGeminiApiKey('   ');
      expect(getStoredGeminiApiKey()).toBeNull();

      setStoredGeminiApiKey('  validKeyWithSpaces  ');
      expect(getStoredGeminiApiKey()).toBe('validKeyWithSpaces');
    });
  });

  describe('Provider Factory (getActiveTutorProvider)', () => {
    it('returns ExampleTutorProvider when no key is set', () => {
      clearStoredGeminiApiKey();
      const provider = getActiveTutorProvider();
      expect(provider).toBeInstanceOf(ExampleTutorProvider);
    });

    it('returns GeminiTutorProvider when key is saved', () => {
      setStoredGeminiApiKey('AIzaSyActiveKey');
      const provider = getActiveTutorProvider();
      expect(provider).toBeInstanceOf(GeminiTutorProvider);
    });
  });

  describe('parseGeminiFeedbackResponse', () => {
    const sample = 'I designed a mobile checkout screen today.';

    it('parses pure JSON output correctly', () => {
      const jsonText = JSON.stringify({
        meaningUnderstood: true,
        correctedSentence: 'Today, I worked on the mobile checkout flow.',
        explanationTh: 'เป็นธรรมชาติขึ้นและกระชับ',
        corrections: [
          {
            original: 'designed a mobile checkout',
            improved: 'worked on the mobile checkout flow',
            reasonTh: 'ฟังดูเป็นธรรมชาติในบริบทการทำงาน',
          },
        ],
        suggestedRetry: 'Today, I worked on the mobile checkout flow.',
      });

      const parsed = parseGeminiFeedbackResponse(jsonText, sample);
      expect(parsed.source).toBe('ai');
      expect(parsed.meaningUnderstood).toBe(true);
      expect(parsed.correctedSentence).toBe('Today, I worked on the mobile checkout flow.');
      expect(parsed.explanationTh).toBe('เป็นธรรมชาติขึ้นและกระชับ');
      expect(parsed.corrections).toHaveLength(1);
      expect(parsed.corrections[0].improved).toBe('worked on the mobile checkout flow');
    });

    it('strips markdown code blocks (```json ... ```)', () => {
      const wrapped = '```json\n{"meaningUnderstood": true, "correctedSentence": "It is nice.", "explanationTh": "ดีมาก", "corrections": [], "suggestedRetry": "It is nice."}\n```';
      const parsed = parseGeminiFeedbackResponse(wrapped, sample);
      expect(parsed.correctedSentence).toBe('It is nice.');
      expect(parsed.explanationTh).toBe('ดีมาก');
    });

    it('falls back gracefully to sample answer on malformed JSON', () => {
      const invalid = 'Not a JSON text at all, just model gibberish!';
      const parsed = parseGeminiFeedbackResponse(invalid, sample);
      expect(parsed.source).toBe('ai');
      expect(parsed.correctedSentence).toBe(sample);
      expect(parsed.explanationTh).toBeDefined();
    });
  });

  describe('GeminiTutorProvider Behavior', () => {
    it('handles empty user answers without calling network', async () => {
      const provider = new GeminiTutorProvider('fakeKey');
      const feedback = await provider.getFeedback(
        'What did you design today?',
        'วันนี้คุณออกแบบอะไร?',
        '   ',
        'I designed a logo.'
      );

      expect(feedback.source).toBe('example');
      expect(feedback.meaningUnderstood).toBeNull();
      expect(feedback.correctedSentence).toBe('I designed a logo.');
    });

    it('ExampleTutorProvider returns non-judgmental guidance', async () => {
      const provider = new ExampleTutorProvider();
      const feedback = await provider.getFeedback(
        'How do you practice English?',
        'คุณฝึกภาษาอังกฤษอย่างไร?',
        'I speak everyday',
        'I practice speaking English every day.'
      );

      expect(feedback.source).toBe('example');
      expect(feedback.meaningUnderstood).toBeNull();
      expect(feedback.correctedSentence).toBe('I practice speaking English every day.');
      expect(feedback.suggestedRetry).toContain('I speak everyday');
    });
  });
});

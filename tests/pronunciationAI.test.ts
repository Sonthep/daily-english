import { describe, it, expect } from 'vitest';
import { parseGeminiPronunciationResponse } from '../src/lib/ai/geminiProvider';
import { ExamplePronunciationProvider } from '../src/lib/ai/provider';

describe('pronunciationAI - parseGeminiPronunciationResponse', () => {
  it('parses valid JSON response from Gemini', () => {
    const rawJson = JSON.stringify({
      overallRating: 'ชัดเจนดีมาก',
      pacingAndIntonationTh: 'จังหวะการพูดเป็นธรรมชาติดี เชื่อมเสียงได้เนียน',
      problemWordsTips: [
        {
          word: 'designed',
          phoneticGuideTh: 'ดี-ไซนด์ (เน้นเสียง /d/ ท้ายคำ)',
          tipTh: 'อย่าลืมออกเสียง /d/ เพื่อสื่อว่าทำเสร็จแล้ว',
        },
      ],
      practiceSentence: 'I designed a new button.',
    });

    const parsed = parseGeminiPronunciationResponse(
      rawJson,
      'I designed a new button today.',
      ['designed']
    );

    expect(parsed.source).toBe('ai');
    expect(parsed.overallRating).toBe('ชัดเจนดีมาก');
    expect(parsed.pacingAndIntonationTh).toContain('จังหวะการพูดเป็นธรรมชาติ');
    expect(parsed.problemWordsTips.length).toBe(1);
    expect(parsed.problemWordsTips[0].word).toBe('designed');
    expect(parsed.practiceSentence).toBe('I designed a new button.');
  });

  it('strips markdown code blocks correctly', () => {
    const raw = '```json\n{"overallRating": "ยอดเยี่ยม", "pacingAndIntonationTh": "ดีมาก", "problemWordsTips": [], "practiceSentence": "Hello"}\n```';
    const parsed = parseGeminiPronunciationResponse(raw, 'Hello', []);

    expect(parsed.overallRating).toBe('ยอดเยี่ยม');
    expect(parsed.practiceSentence).toBe('Hello');
  });

  it('provides safe fallback when JSON is malformed', () => {
    const badRaw = 'Sorry, as an AI I could not format this as JSON properly.';
    const parsed = parseGeminiPronunciationResponse(
      badRaw,
      'Could you repeat that?',
      ['repeat']
    );

    expect(parsed.source).toBe('ai');
    expect(parsed.overallRating).toBeDefined();
    expect(parsed.practiceSentence).toBe('Could you repeat that?');
    expect(parsed.problemWordsTips[0].word).toBe('repeat');
  });
});

describe('pronunciationAI - ExamplePronunciationProvider', () => {
  it('returns structured offline heuristic feedback', async () => {
    const provider = new ExamplePronunciationProvider();
    const res = await provider.getPronunciationFeedback(
      'We need to discuss this tomorrow.',
      'We discuss tomorrow',
      ['need', 'to']
    );

    expect(res.source).toBe('example');
    expect(res.overallRating).toBeDefined();
    expect(res.pacingAndIntonationTh).toContain('Stress');
    expect(res.problemWordsTips.length).toBe(2);
    expect(res.problemWordsTips[0].word).toBe('need');
    expect(res.practiceSentence).toBe('We need to discuss this tomorrow.');
  });
});

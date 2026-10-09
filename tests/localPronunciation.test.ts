import { describe, expect, it, vi } from 'vitest';
import { ExamplePronunciationProvider, getActivePronunciationProvider } from '../src/lib/ai/provider';

describe('Local pronunciation feedback', () => {
  it('returns structured practice guidance without making a network request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const provider = getActivePronunciationProvider();
    const feedback = await provider.getPronunciationFeedback(
      'We need to discuss this tomorrow.',
      'We discuss tomorrow',
      ['need', 'to']
    );

    expect(provider).toBeInstanceOf(ExamplePronunciationProvider);
    expect(feedback.source).toBe('example');
    expect(feedback.problemWordsTips.map((tip) => tip.word)).toEqual(['need', 'to']);
    expect(feedback.practiceSentence).toBe('We need to discuss this tomorrow.');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
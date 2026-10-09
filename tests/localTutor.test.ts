import { describe, expect, it, vi } from 'vitest';
import { ExampleTutorProvider, getActiveTutorProvider } from '../src/lib/ai/provider';

describe('Local tutor feedback', () => {
  it('always selects the local example provider, even if an old key exists', () => {
    localStorage.setItem('daily_english_openrouter_key', 'legacy-key');
    expect(getActiveTutorProvider()).toBeInstanceOf(ExampleTutorProvider);
  });

  it('returns transparent self-check guidance without making a network request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const provider = getActiveTutorProvider();
    const feedback = await provider.getFeedback(
      'What did you design?',
      'คุณออกแบบอะไร?',
      'I designed a logo.',
      'I made a logo.'
    );

    expect(feedback.source).toBe('example');
    expect(feedback.meaningUnderstood).toBeNull();
    expect(feedback.correctedSentence).toBe('I made a logo.');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
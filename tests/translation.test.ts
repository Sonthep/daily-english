import { afterEach, describe, expect, it, vi } from 'vitest';
import { translateEnglishToThai } from '../src/lib/translations/myMemory';

describe('MyMemory English-Thai translation', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('translates a short phrase without an API key', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ responseStatus: 200, responseData: { translatedText: 'มุมมอง' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(translateEnglishToThai(' perspective ')).resolves.toBe('มุมมอง');
    expect(String(fetchMock.mock.calls[0][0])).toContain('langpair=en%7Cth');
    expect(String(fetchMock.mock.calls[0][0])).toContain('q=perspective');
  });

  it('rejects empty and oversized text without sending it', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(translateEnglishToThai('  ')).rejects.toThrow('กรอกคำหรือวลีก่อนแปล');
    await expect(translateEnglishToThai('a'.repeat(501))).rejects.toThrow('500 ไบต์');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('surfaces provider errors instead of saving empty translations', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ responseStatus: 404, responseDetails: 'No translation found' }),
    }));

    await expect(translateEnglishToThai('uncommon phrase')).rejects.toThrow('No translation found');
  });
});
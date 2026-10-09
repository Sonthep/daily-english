import { afterEach, describe, it, expect, vi } from 'vitest';
import {
  extractYouTubeId,
  buildYouTubeEmbedUrl,
  getResourceTypeLabel,
  timestampToSeconds,
  secondsToTimestamp,
  groupYouTubeCaptionSegments,
  findActiveWordIndex,
  fetchYouTubeCaptions,
} from '../src/lib/resources/mediaUtils';
import { SEED_RESOURCES } from '../src/data/seedResources';
import { createCaptionsApiResult, normalizeTranscriptOffsets } from '../api/youtube/captionsService';

describe('Custom Learning Resources & Media Utilities', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('extracts YouTube Video ID from various URL formats', () => {
    // Standard watch URL (from user request)
    expect(extractYouTubeId('https://www.youtube.com/watch?v=Ii4EeIIJrIY')).toBe('Ii4EeIIJrIY');

    // Shortened URL
    expect(extractYouTubeId('https://youtu.be/Ii4EeIIJrIY')).toBe('Ii4EeIIJrIY');

    // Embed URL
    expect(extractYouTubeId('https://www.youtube.com/embed/Ii4EeIIJrIY')).toBe('Ii4EeIIJrIY');

    // Shorts URL
    expect(extractYouTubeId('https://www.youtube.com/shorts/Ii4EeIIJrIY')).toBe('Ii4EeIIJrIY');

    // URL with extra query parameters
    expect(extractYouTubeId('https://www.youtube.com/watch?v=Ii4EeIIJrIY&t=45s&feature=shared')).toBe('Ii4EeIIJrIY');

    // Invalid or empty URLs
    expect(extractYouTubeId('')).toBeNull();
    expect(extractYouTubeId('https://example.com/not-a-video')).toBeNull();
  });

  it('builds privacy-friendly YouTube embed URL', () => {
    const embed = buildYouTubeEmbedUrl('Ii4EeIIJrIY');
    expect(embed).toBe('https://www.youtube-nocookie.com/embed/Ii4EeIIJrIY?rel=0');
  });

  it('converts transcript timestamps without an external service', () => {
    expect(timestampToSeconds('01:24')).toBe(84);
    expect(timestampToSeconds('01:05:30')).toBe(3930);
    expect(secondsToTimestamp(84)).toBe('01:24');
    expect(secondsToTimestamp(3930)).toBe('1:05:30');
  });

  it('converts available YouTube captions to timestamped sentences without an API key', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ captions: [
        { text: 'Hello team.', offsetSeconds: 0, durationSeconds: 2 },
        { text: 'Let us get', offsetSeconds: 6.5, durationSeconds: 1.5 },
        { text: 'started.', offsetSeconds: 8, durationSeconds: 1 },
      ] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const sentences = await fetchYouTubeCaptions('https://www.youtube.com/watch?v=Ii4EeIIJrIY');

    expect(sentences).toEqual([
      expect.objectContaining({ en: 'Hello team.', th: '', timestamp: '00:00' }),
      expect.objectContaining({ en: 'Let us get started.', th: '', timestamp: '00:06' }),
    ]);
    expect(String(fetchMock.mock.calls[0][0])).toBe('/api/youtube/captions?videoId=Ii4EeIIJrIY');
  });

  it('reports when a YouTube video has no caption tracks', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: 'YouTube ไม่เปิด English captions สำหรับคลิปนี้' } }),
    }));

    await expect(fetchYouTubeCaptions('https://youtu.be/Ii4EeIIJrIY'))
      .rejects.toThrow('YouTube ไม่เปิด English captions สำหรับคลิปนี้');
  });

  it('groups caption fragments using punctuation and keeps the first timestamp', () => {
    const sentences = groupYouTubeCaptionSegments([
      { text: 'When I was young,', offsetSeconds: 0, durationSeconds: 2 },
      { text: 'I practiced every day.', offsetSeconds: 2, durationSeconds: 3 },
    ]);

    expect(sentences).toEqual([
      expect.objectContaining({
        en: 'When I was young, I practiced every day.',
        timestamp: '00:00',
        wordTimings: expect.arrayContaining([
          expect.objectContaining({ startSeconds: 0, endSeconds: 0.5 }),
          expect.objectContaining({ startSeconds: 2, endSeconds: 2.75 }),
        ]),
      }),
    ]);
  });

  it('finds the caption word active at a playback time', () => {
    const wordTimings = [
      { startSeconds: 0, endSeconds: 0.5 },
      { startSeconds: 0.5, endSeconds: 1 },
      { startSeconds: 1, endSeconds: 1.5 },
    ];

    expect(findActiveWordIndex(wordTimings, 0.75)).toBe(1);
    expect(findActiveWordIndex(wordTimings, 1.5)).toBe(-1);
  });

  it('validates video IDs and normalizes YouTube millisecond offsets on the server', async () => {
    const invalid = await createCaptionsApiResult('bad-id');
    const normalized = normalizeTranscriptOffsets([
      { text: 'Hello.', offset: 320, duration: 6080 },
      { text: 'Welcome.', offset: 6400, duration: 4000 },
    ]);

    expect(invalid.status).toBe(400);
    expect(normalized).toEqual([
      { text: 'Hello.', offsetSeconds: 0.32, durationSeconds: 6.08 },
      { text: 'Welcome.', offsetSeconds: 6.4, durationSeconds: 4 },
    ]);
  });

  it('returns human-readable Thai labels for resource types', () => {
    expect(getResourceTypeLabel('youtube')).toBe('วิดีโอ YouTube');
    expect(getResourceTypeLabel('podcast')).toContain('พอดแคสต์');
    expect(getResourceTypeLabel('song')).toContain('เพลง');
    expect(getResourceTypeLabel('movie')).toContain('หนัง');
    expect(getResourceTypeLabel('article')).toContain('บทความ');
  });

  it('verifies Seed Resource (Jack Ma speech) matches requirements', () => {
    const jackMaResource = SEED_RESOURCES.find((r) => r.id === 'jack-ma-english-fluency');
    expect(jackMaResource).toBeDefined();
    expect(jackMaResource?.type).toBe('youtube');
    expect(jackMaResource?.sourceUrl).toContain('Ii4EeIIJrIY');
    expect(jackMaResource?.embedUrl).toContain('Ii4EeIIJrIY');

    // Sentences
    expect(jackMaResource?.sentences.length).toBeGreaterThanOrEqual(4);
    expect(jackMaResource?.sentences[0].en).toContain('practice every single day');
    expect(jackMaResource?.sentences[0].th).toBeDefined();

    // Target phrases
    expect(jackMaResource?.targetPhrases.length).toBeGreaterThanOrEqual(4);
    expect(jackMaResource?.targetPhrases.some((p) => p.en.includes('practice every single day'))).toBe(true);
    expect(jackMaResource?.targetPhrases.some((p) => p.en.includes('make mistakes'))).toBe(true);

    // Reflection question
    expect(jackMaResource?.reflectionQuestion).toBeDefined();
  });
});

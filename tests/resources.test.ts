import { describe, it, expect } from 'vitest';
import {
  extractYouTubeId,
  buildYouTubeEmbedUrl,
  getResourceTypeLabel,
} from '../src/lib/resources/mediaUtils';
import { SEED_RESOURCES } from '../src/data/seedResources';

describe('Custom Learning Resources & Media Utilities', () => {
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

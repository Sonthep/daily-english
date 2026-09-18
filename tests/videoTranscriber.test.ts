import { describe, it, expect } from 'vitest';
import {
  timestampToSeconds,
  secondsToTimestamp,
  normalizeTimestamp,
  parseYouTubeTranscript,
} from '../src/lib/resources/videoTranscriber';
import { parseBulkTextToSentences } from '../src/lib/resources/bulkParser';

describe('Video Transcriber & YouTube Subtitle Parser', () => {
  describe('Timestamp conversion utilities', () => {
    it('converts mm:ss and hh:mm:ss to seconds correctly', () => {
      expect(timestampToSeconds('00:15')).toBe(15);
      expect(timestampToSeconds('1:24')).toBe(84);
      expect(timestampToSeconds('01:24')).toBe(84);
      expect(timestampToSeconds('01:05:30')).toBe(3930);
      expect(timestampToSeconds('')).toBe(0);
      expect(timestampToSeconds('invalid')).toBe(0);
    });

    it('formats seconds to standard timestamp strings', () => {
      expect(secondsToTimestamp(15)).toBe('00:15');
      expect(secondsToTimestamp(84)).toBe('01:24');
      expect(secondsToTimestamp(3930)).toBe('1:05:30');
      expect(secondsToTimestamp(0)).toBe('00:00');
    });

    it('normalizes various raw timestamp formats', () => {
      expect(normalizeTimestamp('0:5')).toBe('00:05');
      expect(normalizeTimestamp('[01:20]')).toBe('01:20');
      expect(normalizeTimestamp('(2:15)')).toBe('02:15');
    });
  });

  describe('parseYouTubeTranscript', () => {
    it('handles empty input gracefully', () => {
      expect(parseYouTubeTranscript('')).toEqual([]);
      expect(parseYouTubeTranscript('   \n  ')).toEqual([]);
    });

    it('parses typical YouTube multi-line transcript format', () => {
      const ytTranscript = `
0:00
if you want to speak good English
0:04
you have to practice every single day
0:08
and never be afraid of making mistakes
0:15
[Music]
0:17
because mistakes are the best teachers
0:22
you will ever have in your life
      `;

      const sentences = parseYouTubeTranscript(ytTranscript);
      expect(sentences.length).toBeGreaterThanOrEqual(1);

      // Verify the first sentence has the starting timestamp
      expect(sentences[0].timestamp).toBe('00:00');
      expect(sentences[0].en.toLowerCase()).toContain('speak good english');
      // Verify [Music] was excluded from speech
      expect(sentences.some((s) => s.en.includes('[Music]'))).toBe(false);
    });

    it('preserves timestamps when transcript has inline timestamps', () => {
      const inlineText = `
00:10 Hello everyone and welcome.
00:25 Today we discuss how to train your brain.
00:50 Consistency is the secret to fluency.
      `;

      const sentences = parseYouTubeTranscript(inlineText);
      expect(sentences.length).toBe(3);
      expect(sentences[0].timestamp).toBe('00:10');
      expect(sentences[0].en).toBe('Hello everyone and welcome.');
      expect(sentences[1].timestamp).toBe('00:25');
      expect(sentences[1].en).toBe('Today we discuss how to train your brain.');
      expect(sentences[2].timestamp).toBe('00:50');
      expect(sentences[2].en).toBe('Consistency is the secret to fluency.');
    });

    it('merges short fragments into complete sentences ending with punctuation', () => {
      const fragments = `
0:01
when I was young
0:03
nobody taught me
0:06
how to speak English.
0:09
I had to go out
0:12
and find people to talk to.
      `;

      const sentences = parseYouTubeTranscript(fragments);
      expect(sentences.length).toBe(2);
      expect(sentences[0].timestamp).toBe('00:01');
      expect(sentences[0].en).toBe('When I was young nobody taught me how to speak English.');
      expect(sentences[1].timestamp).toBe('00:09');
      expect(sentences[1].en).toBe('I had to go out and find people to talk to.');
    });
  });

  describe('bulkParser standalone timestamp support', () => {
    it('correctly associates standalone timestamps with subsequent lines', () => {
      const text = `
00:15
If you want to speak good English, you have to practice every day.
ถ้าคุณอยากพูดภาษาอังกฤษเก่ง คุณต้องฝึกทุกวัน
00:45
Don't be afraid of making mistakes.
อย่ากลัวที่จะทำผิดพลาด
      `;

      const result = parseBulkTextToSentences(text);
      expect(result.length).toBe(2);
      expect(result[0].timestamp).toBe('00:15');
      expect(result[0].en).toBe('If you want to speak good English, you have to practice every day.');
      expect(result[0].th).toBe('ถ้าคุณอยากพูดภาษาอังกฤษเก่ง คุณต้องฝึกทุกวัน');

      expect(result[1].timestamp).toBe('00:45');
      expect(result[1].en).toBe("Don't be afraid of making mistakes.");
      expect(result[1].th).toBe('อย่ากลัวที่จะทำผิดพลาด');
    });
  });
});

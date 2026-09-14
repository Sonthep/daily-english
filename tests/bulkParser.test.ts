import { describe, it, expect } from 'vitest';
import { parseBulkTextToSentences } from '../src/lib/resources/bulkParser';

describe('Bulk Text & Subtitle Parser (parseBulkTextToSentences)', () => {
  it('handles empty or whitespace-only inputs gracefully', () => {
    expect(parseBulkTextToSentences('')).toEqual([]);
    expect(parseBulkTextToSentences('   \n  \n\t  ')).toEqual([]);
  });

  it('parses alternating English and Thai lines', () => {
    const raw = `
    If you want to speak good English, you have to practice every day.
    ถ้าคุณอยากพูดภาษาอังกฤษเก่ง คุณต้องฝึกทุกวัน
    Don't be afraid of making mistakes.
    อย่ากลัวที่จะทำผิดพลาด
    `;

    const result = parseBulkTextToSentences(raw);
    expect(result).toHaveLength(2);
    expect(result[0].en).toBe('If you want to speak good English, you have to practice every day.');
    expect(result[0].th).toBe('ถ้าคุณอยากพูดภาษาอังกฤษเก่ง คุณต้องฝึกทุกวัน');
    expect(result[1].en).toBe("Don't be afraid of making mistakes.");
    expect(result[1].th).toBe('อย่ากลัวที่จะทำผิดพลาด');
  });

  it('extracts inline timestamps with bracket and dash prefixes', () => {
    const raw = `
    [01:15] Practice makes progress.
    การฝึกฝนทำให้เกิดความก้าวหน้า
    02:30 - Confidence comes from preparation.
    ความมั่นใจมาจากการเตรียมตัว
    `;

    const result = parseBulkTextToSentences(raw);
    expect(result).toHaveLength(2);
    expect(result[0].timestamp).toBe('01:15');
    expect(result[0].en).toBe('Practice makes progress.');
    expect(result[0].th).toBe('การฝึกฝนทำให้เกิดความก้าวหน้า');

    expect(result[1].timestamp).toBe('02:30');
    expect(result[1].en).toBe('Confidence comes from preparation.');
    expect(result[1].th).toBe('ความมั่นใจมาจากการเตรียมตัว');
  });

  it('parses inline bilingual delimiters (slash / and dash -)', () => {
    const raw = `
    00:45 Be curious and never stop learning / มีความอยากรู้อยากเห็นและอย่าหยุดเรียนรู้
    01:10 Success is not final - ความสำเร็จไม่ใช่จุดสิ้นสุด
    `;

    const result = parseBulkTextToSentences(raw);
    expect(result).toHaveLength(2);
    expect(result[0].timestamp).toBe('00:45');
    expect(result[0].en).toBe('Be curious and never stop learning');
    expect(result[0].th).toBe('มีความอยากรู้อยากเห็นและอย่าหยุดเรียนรู้');

    expect(result[1].timestamp).toBe('01:10');
    expect(result[1].en).toBe('Success is not final');
    expect(result[1].th).toBe('ความสำเร็จไม่ใช่จุดสิ้นสุด');
  });

  it('parses SRT subtitle formats with sequence numbers and arrow timestamps', () => {
    const srt = `
1
00:01:24,000 --> 00:01:28,000
When you talk to people, listen carefully.

2
00:01:30,000 --> 00:01:35,000
Try to express your ideas simply and clearly.
    `;

    const result = parseBulkTextToSentences(srt);
    expect(result).toHaveLength(2);
    expect(result[0].timestamp).toBe('01:24');
    expect(result[0].en).toBe('When you talk to people, listen carefully.');
    expect(result[0].th).toBe('');

    expect(result[1].timestamp).toBe('01:30');
    expect(result[1].en).toBe('Try to express your ideas simply and clearly.');
    expect(result[1].th).toBe('');
  });

  it('parses plain standalone English lines (e.g. lyrics)', () => {
    const lyrics = `
    Yesterday all my troubles seemed so far away
    Now it looks as though they're here to stay
    Oh, I believe in yesterday
    `;

    const result = parseBulkTextToSentences(lyrics);
    expect(result).toHaveLength(3);
    expect(result[0].en).toBe('Yesterday all my troubles seemed so far away');
    expect(result[0].th).toBe('');
    expect(result[1].en).toBe("Now it looks as though they're here to stay");
    expect(result[2].en).toBe('Oh, I believe in yesterday');
  });
});

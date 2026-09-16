import { describe, it, expect } from 'vitest';
import {
  generateHeuristicLesson,
  parseGeminiLessonResponse,
} from '../src/lib/ai/lessonGenerator';
import { LearningResource } from '../src/types';

describe('AI Lesson Generator', () => {
  const mockResource: LearningResource = {
    id: 'res-test-1',
    title: 'Steve Jobs Stanford Speech',
    type: 'youtube',
    sourceUrl: 'https://youtube.com/watch?v=UF8uR6Z6KLc',
    notes: 'Stay hungry, stay foolish.',
    sentences: [
      { id: 's1', en: 'Your time is limited, so do not waste it living someone else life.', th: 'เวลาของคุณมีจำกัด อย่าเสียเวลาไปใช้ชีวิตของคนอื่น' },
      { id: 's2', en: 'Don’t let the noise of others’ opinions drown out your own inner voice.', th: 'อย่าปล่อยให้เสียงความคิดเห็นของคนอื่นมากลบเสียงภายในใจของคุณ' },
      { id: 's3', en: 'Have the courage to follow your heart and intuition.', th: 'จงมีความกล้าที่จะทำตามหัวใจและสัญชาตญาณของคุณ' },
      { id: 's4', en: 'Stay hungry. Stay foolish.', th: 'จงกระหาย และจงทำตัวให้โง่เขลาอยู่เสมอ' },
    ],
    targetPhrases: [
      { id: 'p1', en: 'stay hungry', th: 'กระหายที่จะเรียนรู้', example: 'Stay hungry, stay foolish.', category: 'Speech' },
    ],
    createdAt: '2026-09-17T00:00:00.000Z',
    updatedAt: '2026-09-17T00:00:00.000Z',
  };

  describe('generateHeuristicLesson', () => {
    it('generates a valid 5-minute lesson structure offline', () => {
      const lesson = generateHeuristicLesson(mockResource, { targetDurationMinutes: 5 });

      expect(lesson.id).toContain('lesson-ai-');
      expect(lesson.category).toBe('Custom AI');
      expect(lesson.isAiGenerated).toBe(true);
      expect(lesson.sourceResourceId).toBe('res-test-1');
      expect(lesson.sentences.length).toBe(4);
      expect(lesson.prompts.length).toBe(1);
      expect(lesson.prompts[0].questionEn).toBeDefined();
      expect(lesson.targetPhrases.length).toBeGreaterThanOrEqual(1);
    });

    it('generates a valid 15-minute lesson with appropriate limits', () => {
      const lesson = generateHeuristicLesson(mockResource, { targetDurationMinutes: 15 });
      expect(lesson.sentences.length).toBeLessThanOrEqual(6);
      expect(lesson.isAiGenerated).toBe(true);
    });
  });

  describe('parseGeminiLessonResponse', () => {
    it('parses valid JSON response from Gemini into Lesson', () => {
      const rawJson = JSON.stringify({
        titleTh: 'ตามหาหัวใจและความกล้าหาญ',
        titleEn: 'Follow Your Heart and Intuition',
        objectiveTh: 'ฝึกสำนวนการสร้างแรงบันดาลใจและกล้าตัดสินใจ',
        sentences: [
          { en: 'Stay hungry, stay foolish.', th: 'จงกระหายเรียนรู้และทำตัวให้พร้อมรับสิ่งใหม่' },
          { en: 'Follow your heart.', th: 'ทำตามเสียงหัวใจ' },
        ],
        prompts: [
          {
            questionEn: 'How do you follow your heart in your career?',
            questionTh: 'คุณทำตามเสียงหัวใจในการทำงานอย่างไร?',
            sampleAnswer: 'I focus on projects that bring me real joy and growth.',
          },
        ],
        targetPhrases: [
          { en: 'follow your heart', th: 'ทำตามหัวใจ', example: 'Always follow your heart.' },
        ],
      });

      const lesson = parseGeminiLessonResponse(rawJson, mockResource, { targetDurationMinutes: 5 });

      expect(lesson.titleTh).toBe('ตามหาหัวใจและความกล้าหาญ');
      expect(lesson.titleEn).toBe('Follow Your Heart and Intuition');
      expect(lesson.category).toBe('Custom AI');
      expect(lesson.sentences.length).toBe(2);
      expect(lesson.prompts.length).toBe(1);
      expect(lesson.targetPhrases.length).toBe(1);
      expect(lesson.isAiGenerated).toBe(true);
    });

    it('strips markdown code blocks correctly', () => {
      const rawWithMarkdown = '```json\n{"titleTh":"ทดสอบ","titleEn":"Test","objectiveTh":"เป้าหมาย","sentences":[{"en":"Hello","th":"สวัสดี"}],"prompts":[{"questionEn":"Q","questionTh":"คำถาม","sampleAnswer":"A"}],"targetPhrases":[{"en":"Hi","th":"หวัดดี","example":"Hi"}]}\n```';
      const lesson = parseGeminiLessonResponse(rawWithMarkdown, mockResource, { targetDurationMinutes: 5 });

      expect(lesson.titleTh).toBe('ทดสอบ');
      expect(lesson.sentences[0].en).toBe('Hello');
    });

    it('gracefully falls back to heuristic generation on malformed JSON', () => {
      const malformed = 'Not valid JSON at all';
      const lesson = parseGeminiLessonResponse(malformed, mockResource, { targetDurationMinutes: 5 });

      expect(lesson.isAiGenerated).toBe(true);
      expect(lesson.sentences.length).toBe(4);
    });
  });
});

import { describe, it, expect, vi } from 'vitest';
import { LessonRepository, StorageService } from '../src/lib/storage/repositories';
import { Lesson } from '../src/types';

describe('Custom Lessons & Repository Storage', () => {
  const storageService = new StorageService();

  const mockCustomLesson: Lesson = {
    id: 'lesson-custom-test-123',
    titleTh: 'บทเรียนทดสอบสร้างโดย AI',
    titleEn: 'AI Test Lesson',
    category: 'Custom AI',
    objectiveTh: 'ทดสอบการบันทึกและลบบทเรียน',
    sentences: [
      { id: 's1', en: 'Learning English every day is wonderful.', th: 'การเรียนภาษาอังกฤษทุกวันเป็นเรื่องยอดเยี่ยม' },
    ],
    prompts: [
      {
        id: 'p1',
        questionEn: 'How do you practice daily?',
        questionTh: 'คุณฝึกฝนทุกวันอย่างไร?',
        sampleAnswer: 'I practice for 10 minutes every morning.',
      },
    ],
    targetPhrases: [
      { id: 'tp1', en: 'every day', th: 'ทุกๆ วัน', example: 'Every day is a new chance.', category: 'Custom AI' },
    ],
    createdAt: new Date().toISOString(),
    isAiGenerated: true,
  };

  describe('Validation of Database Export with customLessons', () => {
    it('validates and accepts export payload containing customLessons', () => {
      const payload = {
        schemaVersion: 2,
        exportedAt: '2026-09-17T00:00:00.000Z',
        profile: { id: 'default-user', displayName: 'ปุ๊ก' },
        sessions: [],
        phrases: [],
        reviewEvents: [],
        resources: [],
        customLessons: [mockCustomLesson],
      };

      const res = storageService.validateImportData(JSON.stringify(payload));
      expect(res.valid).toBe(true);
      expect(res.data?.customLessons?.length).toBe(1);
      expect(res.data?.customLessons?.[0].titleTh).toBe('บทเรียนทดสอบสร้างโดย AI');
    });

    it('rejects payload if customLessons is not an array', () => {
      const invalid = {
        schemaVersion: 2,
        exportedAt: '2026-09-17T00:00:00.000Z',
        profile: { id: 'default-user', displayName: 'ปุ๊ก' },
        sessions: [],
        phrases: [],
        reviewEvents: [],
        customLessons: 'invalid-string-not-array',
      };

      const res = storageService.validateImportData(JSON.stringify(invalid));
      expect(res.valid).toBe(false);
      expect(res.error).toContain('customLessons');
    });
  });

  describe('LessonRepository logic & protections', () => {
    it('prevents deletion of core seed lessons', async () => {
      const lessonRepo = new LessonRepository();
      // Stub getDatabase
      vi.spyOn(lessonRepo as any, 'seedLessonsIfEmpty').mockResolvedValue(undefined);

      await expect(lessonRepo.deleteCustomLesson('lesson-1')).rejects.toThrow(
        'ไม่สามารถลบบทเรียนหลักของระบบได้'
      );
      await expect(lessonRepo.deleteCustomLesson('lesson-2')).rejects.toThrow(
        'ไม่สามารถลบบทเรียนหลักของระบบได้'
      );
      await expect(lessonRepo.deleteCustomLesson('lesson-3')).rejects.toThrow(
        'ไม่สามารถลบบทเรียนหลักของระบบได้'
      );
    });
  });
});

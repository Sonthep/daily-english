import { getDatabase } from './db';
import {
  IProfileRepository,
  ILessonRepository,
  ISessionRepository,
  IPhraseRepository,
  IReviewRepository,
  IResourceRepository,
  IStorageService,
} from './interfaces';
import {
  Profile,
  Lesson,
  Session,
  Phrase,
  ReviewEvent,
  DatabaseExport,
  LearningResource,
} from '../../types';
import { SEED_LESSONS } from '../../data/lessons';
import { SEED_RESOURCES } from '../../data/seedResources';
import { getDuePhrases } from '../review/scheduler';

export const DEFAULT_PROFILE_ID = 'default-user';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isTimestamp = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(Date.parse(value));

const isValidTimezone = (value: unknown): value is string => {
  if (!isNonEmptyString(value)) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const isTargetPhrase = (value: unknown): boolean =>
  isRecord(value) &&
  isNonEmptyString(value.id) &&
  isNonEmptyString(value.en) &&
  isNonEmptyString(value.th) &&
  typeof value.example === 'string' &&
  isNonEmptyString(value.category);

const isLesson = (value: unknown): boolean =>
  isRecord(value) &&
  isNonEmptyString(value.id) &&
  isNonEmptyString(value.titleTh) &&
  isNonEmptyString(value.titleEn) &&
  ['Design & Marketing', 'Daily Life', 'Gaming', 'Custom', 'Custom AI'].includes(String(value.category)) &&
  typeof value.objectiveTh === 'string' &&
  Array.isArray(value.sentences) &&
  value.sentences.every(
    (sentence) =>
      isRecord(sentence) &&
      isNonEmptyString(sentence.id) &&
      isNonEmptyString(sentence.en) &&
      typeof sentence.th === 'string'
  ) &&
  Array.isArray(value.prompts) &&
  value.prompts.every(
    (prompt) =>
      isRecord(prompt) &&
      isNonEmptyString(prompt.id) &&
      isNonEmptyString(prompt.questionEn) &&
      typeof prompt.questionTh === 'string' &&
      isNonEmptyString(prompt.sampleAnswer)
  ) &&
  Array.isArray(value.targetPhrases) &&
  value.targetPhrases.every(isTargetPhrase) &&
  isTimestamp(value.createdAt) &&
  (value.isAiGenerated === undefined || typeof value.isAiGenerated === 'boolean') &&
  (value.isCustom === undefined || typeof value.isCustom === 'boolean') &&
  (value.sourceResourceId === undefined || typeof value.sourceResourceId === 'string');

const isProfile = (value: unknown): boolean =>
  isRecord(value) &&
  value.id === DEFAULT_PROFILE_ID &&
  typeof value.displayName === 'string' &&
  isStringArray(value.goals) &&
  (value.dailyMinutes === 5 || value.dailyMinutes === 15) &&
  ['beginner', 'intermediate', 'advancing'].includes(String(value.confidence)) &&
  isValidTimezone(value.timezone) &&
  typeof value.onboardingCompleted === 'boolean' &&
  isTimestamp(value.createdAt) &&
  isTimestamp(value.updatedAt);

const isSession = (value: unknown): boolean =>
  isRecord(value) &&
  isNonEmptyString(value.id) &&
  isNonEmptyString(value.lessonId) &&
  (value.modeMinutes === 5 || value.modeMinutes === 15) &&
  ['listen', 'repeat', 'use_it', 'review', 'summary'].includes(String(value.currentStep)) &&
  Number.isInteger(value.currentItemIndex) &&
  Number(value.currentItemIndex) >= 0 &&
  Array.isArray(value.answers) &&
  value.answers.every(
    (answer) =>
      isRecord(answer) &&
      isNonEmptyString(answer.promptId) &&
      typeof answer.answerText === 'string' &&
      isTimestamp(answer.answeredAt)
  ) &&
  isStringArray(value.reviewedPhraseIds) &&
  Number.isFinite(value.activeDurationSeconds) &&
  Number(value.activeDurationSeconds) >= 0 &&
  isTimestamp(value.startedAt) &&
  isTimestamp(value.updatedAt) &&
  (value.completedAt === null || isTimestamp(value.completedAt));

const isPhrase = (value: unknown): boolean =>
  isRecord(value) &&
  isNonEmptyString(value.id) &&
  isNonEmptyString(value.en) &&
  isNonEmptyString(value.th) &&
  typeof value.example === 'string' &&
  isNonEmptyString(value.category) &&
  (value.tags === undefined || (Array.isArray(value.tags) && value.tags.every(isNonEmptyString))) &&
  (value.sourceLessonId === null || typeof value.sourceLessonId === 'string') &&
  Number.isInteger(value.reviewStage) &&
  Number(value.reviewStage) >= 0 &&
  isTimestamp(value.dueAt) &&
  isTimestamp(value.createdAt) &&
  isTimestamp(value.updatedAt);

const isReviewEvent = (value: unknown): boolean =>
  isRecord(value) &&
  isNonEmptyString(value.id) &&
  isNonEmptyString(value.phraseId) &&
  (value.result === 'again' || value.result === 'remembered') &&
  isTimestamp(value.reviewedAt) &&
  Number.isInteger(value.previousStage) &&
  Number(value.previousStage) >= 0 &&
  Number.isInteger(value.nextStage) &&
  Number(value.nextStage) >= 0;

const isResource = (value: unknown): boolean =>
  isRecord(value) &&
  isNonEmptyString(value.id) &&
  isNonEmptyString(value.title) &&
  ['youtube', 'podcast', 'song', 'movie', 'article'].includes(String(value.type)) &&
  (value.sourceUrl === undefined || typeof value.sourceUrl === 'string') &&
  (value.embedUrl === undefined || typeof value.embedUrl === 'string') &&
  (value.notes === undefined || typeof value.notes === 'string') &&
  Array.isArray(value.sentences) &&
  value.sentences.every(
    (sentence) =>
      isRecord(sentence) &&
      isNonEmptyString(sentence.id) &&
      isNonEmptyString(sentence.en) &&
      typeof sentence.th === 'string' &&
      (sentence.timestamp === undefined || typeof sentence.timestamp === 'string') &&
      (sentence.wordTimings === undefined ||
        (Array.isArray(sentence.wordTimings) && sentence.wordTimings.every((timing) =>
          isRecord(timing) &&
          typeof timing.startSeconds === 'number' && Number.isFinite(timing.startSeconds) &&
          typeof timing.endSeconds === 'number' && Number.isFinite(timing.endSeconds) &&
          timing.endSeconds >= timing.startSeconds
        )))
  ) &&
  Array.isArray(value.targetPhrases) &&
  value.targetPhrases.every(isTargetPhrase) &&
  (value.reflectionQuestion === undefined || typeof value.reflectionQuestion === 'string') &&
  isTimestamp(value.createdAt) &&
  isTimestamp(value.updatedAt);

export class ProfileRepository implements IProfileRepository {
  async getProfile(): Promise<Profile | null> {
    const db = await getDatabase();
    const profile = await db.get('profiles', DEFAULT_PROFILE_ID);
    return profile || null;
  }

  async saveProfile(profile: Profile): Promise<Profile> {
    const db = await getDatabase();
    const updated: Profile = {
      ...profile,
      id: DEFAULT_PROFILE_ID,
      updatedAt: new Date().toISOString(),
    };
    await db.put('profiles', updated);
    return updated;
  }

  async initDefaultProfile(): Promise<Profile> {
    const existing = await this.getProfile();
    if (existing) return existing;

    const now = new Date().toISOString();
    const defaultProfile: Profile = {
      id: DEFAULT_PROFILE_ID,
      displayName: '',
      goals: ['daily'],
      dailyMinutes: 5,
      confidence: 'beginner',
      timezone: 'Asia/Bangkok',
      onboardingCompleted: true,
      createdAt: now,
      updatedAt: now,
    };
    return this.saveProfile(defaultProfile);
  }
}

export class LessonRepository implements ILessonRepository {
  async getAllLessons(): Promise<Lesson[]> {
    const db = await getDatabase();
    await this.seedLessonsIfEmpty();
    return db.getAll('lessons');
  }

  async getLessonById(id: string): Promise<Lesson | null> {
    const db = await getDatabase();
    await this.seedLessonsIfEmpty();
    const lesson = await db.get('lessons', id);
    return lesson || null;
  }

  async saveLesson(lesson: Lesson): Promise<void> {
    const db = await getDatabase();
    await db.put('lessons', lesson);
  }

  async deleteCustomLesson(id: string): Promise<void> {
    const seedIds = ['lesson-1', 'lesson-2', 'lesson-3'];
    if (seedIds.includes(id)) {
      throw new Error('ไม่สามารถลบบทเรียนหลักของระบบได้');
    }
    const db = await getDatabase();
    await db.delete('lessons', id);
  }

  async seedLessonsIfEmpty(): Promise<void> {
    const db = await getDatabase();
    const count = await db.count('lessons');
    if (count === 0) {
      const tx = db.transaction('lessons', 'readwrite');
      for (const lesson of SEED_LESSONS) {
        await tx.store.put(lesson);
      }
      await tx.done;
    }
  }
}

export class SessionRepository implements ISessionRepository {
  async getActiveSession(lessonId: string): Promise<Session | null> {
    const db = await getDatabase();
    const sessions = await db.getAllFromIndex('sessions', 'by-lessonId', lessonId);
    // Return the latest incomplete session
    const active = sessions.filter((s) => s.completedAt === null);
    if (active.length === 0) return null;
    active.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return active[0];
  }

  async getMostRecentActiveSession(): Promise<Session | null> {
    const db = await getDatabase();
    const all = await db.getAll('sessions');
    const active = all.filter((s) => s.completedAt === null);
    if (active.length === 0) return null;
    active.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return active[0];
  }

  async saveSession(session: Session): Promise<void> {
    const db = await getDatabase();
    const updated: Session = {
      ...session,
      updatedAt: new Date().toISOString(),
    };
    await db.put('sessions', updated);
  }

  /**
   * Idempotent Session completion.
   * If session was already completed, it does not overwrite completedAt or duplicate stats.
   */
  async completeSession(session: Session): Promise<void> {
    const db = await getDatabase();
    const existing = await db.get('sessions', session.id);
    if (existing && existing.completedAt !== null) {
      // Already completed, preserve existing completion time
      return;
    }

    const now = new Date().toISOString();
    const completed: Session = {
      ...session,
      completedAt: session.completedAt || now,
      updatedAt: now,
    };
    await db.put('sessions', completed);
  }

  async getAllSessions(): Promise<Session[]> {
    const db = await getDatabase();
    return db.getAll('sessions');
  }

  async getCompletedSessions(): Promise<Session[]> {
    const db = await getDatabase();
    const all = await db.getAll('sessions');
    return all.filter((s) => s.completedAt !== null);
  }
}

export class PhraseRepository implements IPhraseRepository {
  async getAllPhrases(): Promise<Phrase[]> {
    const db = await getDatabase();
    return db.getAll('phrases');
  }

  async getDuePhrases(): Promise<Phrase[]> {
    const all = await this.getAllPhrases();
    return getDuePhrases(all);
  }

  async getPhraseById(id: string): Promise<Phrase | null> {
    const db = await getDatabase();
    const phrase = await db.get('phrases', id);
    return phrase || null;
  }

  async savePhrase(phrase: Phrase): Promise<void> {
    const db = await getDatabase();
    await db.put('phrases', {
      ...phrase,
      updatedAt: new Date().toISOString(),
    });
  }

  async savePhrases(phrases: Phrase[]): Promise<void> {
    const db = await getDatabase();
    const tx = db.transaction('phrases', 'readwrite');
    for (const p of phrases) {
      await tx.store.put({
        ...p,
        updatedAt: new Date().toISOString(),
      });
    }
    await tx.done;
  }

  async deletePhrase(id: string): Promise<void> {
    const db = await getDatabase();
    await db.delete('phrases', id);
  }
}

export class ReviewRepository implements IReviewRepository {
  async recordReviewEvent(event: ReviewEvent): Promise<void> {
    const db = await getDatabase();
    await db.put('review_events', event);
  }

  async getAllReviewEvents(): Promise<ReviewEvent[]> {
    const db = await getDatabase();
    return db.getAll('review_events');
  }
}

export class ResourceRepository implements IResourceRepository {
  async getAllResources(): Promise<LearningResource[]> {
    const db = await getDatabase();
    return db.getAll('resources');
  }

  async getResourceById(id: string): Promise<LearningResource | null> {
    const db = await getDatabase();
    const res = await db.get('resources', id);
    return res || null;
  }

  async saveResource(resource: LearningResource): Promise<void> {
    const db = await getDatabase();
    await db.put('resources', {
      ...resource,
      updatedAt: new Date().toISOString(),
    });
  }

  async deleteResource(id: string): Promise<void> {
    const db = await getDatabase();
    await db.delete('resources', id);
  }

  async seedResourcesIfEmpty(): Promise<void> {
    const db = await getDatabase();
    const count = await db.count('resources');
    if (count === 0) {
      const tx = db.transaction('resources', 'readwrite');
      for (const res of SEED_RESOURCES) {
        await tx.store.put(res);
      }
      await tx.done;
    }
  }
}

export class StorageService implements IStorageService {
  private profileRepo = new ProfileRepository();
  private lessonRepo = new LessonRepository();
  private sessionRepo = new SessionRepository();
  private phraseRepo = new PhraseRepository();
  private reviewRepo = new ReviewRepository();
  private resourceRepo = new ResourceRepository();

  async exportDatabase(): Promise<DatabaseExport> {
    const profile = (await this.profileRepo.getProfile()) || (await this.profileRepo.initDefaultProfile());
    const sessions = await this.sessionRepo.getAllSessions();
    const phrases = await this.phraseRepo.getAllPhrases();
    const reviewEvents = await this.reviewRepo.getAllReviewEvents();
    const resources = await this.resourceRepo.getAllResources();
    const allLessons = await this.lessonRepo.getAllLessons();
    const customLessons = allLessons.filter((lesson) => lesson.isCustom || lesson.isAiGenerated);

    return {
      schemaVersion: 2,
      exportedAt: new Date().toISOString(),
      profile,
      sessions,
      phrases,
      reviewEvents,
      resources,
      customLessons,
    };
  }

  validateImportData(jsonString: string): { valid: boolean; error?: string; data?: DatabaseExport } {
    try {
      const parsed = JSON.parse(jsonString);

      if (!isRecord(parsed)) {
        return { valid: false, error: 'รูปแบบไฟล์ไม่ใช่ JSON Object ที่ถูกต้อง' };
      }

      if (parsed.schemaVersion !== 1 && parsed.schemaVersion !== 2) {
        return { valid: false, error: 'ไม่รองรับ schemaVersion ของไฟล์นี้' };
      }

      if (!isTimestamp(parsed.exportedAt)) {
        return { valid: false, error: 'วันที่ส่งออกข้อมูลไม่ถูกต้อง' };
      }

      if (!isProfile(parsed.profile)) {
        return { valid: false, error: 'ข้อมูล Profile ภายในไฟล์ไม่ครบถ้วนหรือไม่สมบูรณ์' };
      }

      if (!Array.isArray(parsed.sessions) || !parsed.sessions.every(isSession)) {
        return { valid: false, error: 'ข้อมูล sessions มีรูปแบบไม่ถูกต้อง' };
      }

      if (!Array.isArray(parsed.phrases) || !parsed.phrases.every(isPhrase)) {
        return { valid: false, error: 'ข้อมูล phrases มีรูปแบบไม่ถูกต้อง' };
      }

      if (!Array.isArray(parsed.reviewEvents) || !parsed.reviewEvents.every(isReviewEvent)) {
        return { valid: false, error: 'ข้อมูล reviewEvents มีรูปแบบไม่ถูกต้อง' };
      }

      if (parsed.schemaVersion === 2 && (!Array.isArray(parsed.resources) || !Array.isArray(parsed.customLessons))) {
        return { valid: false, error: 'ไฟล์ schemaVersion 2 ต้องมี resources และ customLessons' };
      }

      if (parsed.resources !== undefined && (!Array.isArray(parsed.resources) || !parsed.resources.every(isResource))) {
        return { valid: false, error: 'ข้อมูล resources มีรูปแบบไม่ถูกต้อง' };
      }

      if (
        parsed.customLessons !== undefined &&
        (!Array.isArray(parsed.customLessons) ||
          !parsed.customLessons.every((lesson: unknown) =>
            isLesson(lesson) && isRecord(lesson) && (lesson.isCustom === true || lesson.isAiGenerated === true)
          ))
      ) {
        return { valid: false, error: 'ข้อมูล customLessons มีรูปแบบไม่ถูกต้อง' };
      }

      return { valid: true, data: parsed as unknown as DatabaseExport };
    } catch (err: unknown) {
      return {
        valid: false,
        error: `ไม่สามารถอ่านไฟล์ JSON ได้: ${(err as Error).message}`,
      };
    }
  }

  async importDatabase(data: DatabaseExport): Promise<void> {
    let serializedData: string;
    try {
      serializedData = JSON.stringify(data);
    } catch {
      throw new Error('ข้อมูลนำเข้าไม่สามารถแปลงเป็น JSON ได้');
    }

    const validation = this.validateImportData(serializedData);
    if (!validation.valid || !validation.data) {
      throw new Error(validation.error || 'ข้อมูลนำเข้าไม่ถูกต้อง');
    }
    const validatedData = validation.data;

    const db = await getDatabase();

    // Perform atomic transaction
    const tx = db.transaction(
      ['profiles', 'sessions', 'phrases', 'review_events', 'resources', 'lessons'],
      'readwrite'
    );

    await tx.objectStore('profiles').clear();
    await tx.objectStore('sessions').clear();
    await tx.objectStore('phrases').clear();
    await tx.objectStore('review_events').clear();
    await tx.objectStore('resources').clear();
    await tx.objectStore('lessons').clear();

    await tx.objectStore('profiles').put(validatedData.profile);
    for (const session of validatedData.sessions) {
      await tx.objectStore('sessions').put(session);
    }
    for (const phrase of validatedData.phrases) {
      await tx.objectStore('phrases').put(phrase);
    }
    for (const event of validatedData.reviewEvents) {
      await tx.objectStore('review_events').put(event);
    }
    for (const res of validatedData.resources || []) {
      await tx.objectStore('resources').put(res);
    }
    for (const seed of SEED_LESSONS) {
      await tx.objectStore('lessons').put(seed);
    }
    for (const custom of validatedData.customLessons || []) {
      await tx.objectStore('lessons').put(custom);
    }

    await tx.done;
  }

  async resetDatabase(): Promise<void> {
    const db = await getDatabase();
    const tx = db.transaction(
      ['profiles', 'sessions', 'phrases', 'review_events', 'resources', 'lessons'],
      'readwrite'
    );

    await tx.objectStore('profiles').clear();
    await tx.objectStore('sessions').clear();
    await tx.objectStore('phrases').clear();
    await tx.objectStore('review_events').clear();
    await tx.objectStore('resources').clear();
    await tx.objectStore('lessons').clear();

    for (const seed of SEED_LESSONS) {
      await tx.objectStore('lessons').put(seed);
    }

    await tx.done;

    // Re-initialize default profile and seed resources
    await this.profileRepo.initDefaultProfile();
    await this.resourceRepo.seedResourcesIfEmpty();
  }
}

// Singletons for application usage
export const profileRepo = new ProfileRepository();
export const lessonRepo = new LessonRepository();
export const sessionRepo = new SessionRepository();
export const phraseRepo = new PhraseRepository();
export const reviewRepo = new ReviewRepository();
export const resourceRepo = new ResourceRepository();
export const storageService = new StorageService();

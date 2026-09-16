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
      displayName: 'ปุ๊ก',
      goals: ['work', 'daily'],
      dailyMinutes: 5,
      confidence: 'intermediate',
      timezone: 'Asia/Bangkok',
      onboardingCompleted: false,
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
    await this.seedResourcesIfEmpty();
    return db.getAll('resources');
  }

  async getResourceById(id: string): Promise<LearningResource | null> {
    const db = await getDatabase();
    await this.seedResourcesIfEmpty();
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
    const customLessons = allLessons.filter((l) => l.isAiGenerated);

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

      if (!parsed || typeof parsed !== 'object') {
        return { valid: false, error: 'รูปแบบไฟล์ไม่ใช่ JSON Object ที่ถูกต้อง' };
      }

      if (typeof parsed.schemaVersion !== 'number') {
        return { valid: false, error: 'ไฟล์ไม่มีหมายเลข schemaVersion หรือไม่ถูกต้อง' };
      }

      if (!parsed.profile || typeof parsed.profile !== 'object' || !parsed.profile.displayName) {
        return { valid: false, error: 'ข้อมูล Profile ภายในไฟล์ไม่ครบถ้วนหรือไม่สมบูรณ์' };
      }

      if (!Array.isArray(parsed.sessions)) {
        return { valid: false, error: 'ข้อมูล sessions ต้องอยู่ในรูปแบบ Array' };
      }

      if (!Array.isArray(parsed.phrases)) {
        return { valid: false, error: 'ข้อมูล phrases ต้องอยู่ในรูปแบบ Array' };
      }

      if (!Array.isArray(parsed.reviewEvents)) {
        return { valid: false, error: 'ข้อมูล reviewEvents ต้องอยู่ในรูปแบบ Array' };
      }

      if (parsed.resources && !Array.isArray(parsed.resources)) {
        return { valid: false, error: 'ข้อมูล resources ต้องอยู่ในรูปแบบ Array' };
      }

      if (parsed.customLessons && !Array.isArray(parsed.customLessons)) {
        return { valid: false, error: 'ข้อมูล customLessons ต้องอยู่ในรูปแบบ Array' };
      }

      return { valid: true, data: parsed as DatabaseExport };
    } catch (err: unknown) {
      return {
        valid: false,
        error: `ไม่สามารถอ่านไฟล์ JSON ได้: ${(err as Error).message}`,
      };
    }
  }

  async importDatabase(data: DatabaseExport): Promise<void> {
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

    if (data.profile) {
      await tx.objectStore('profiles').put(data.profile);
    }
    for (const session of data.sessions || []) {
      await tx.objectStore('sessions').put(session);
    }
    for (const phrase of data.phrases || []) {
      await tx.objectStore('phrases').put(phrase);
    }
    for (const event of data.reviewEvents || []) {
      await tx.objectStore('review_events').put(event);
    }
    for (const res of data.resources || []) {
      await tx.objectStore('resources').put(res);
    }
    for (const seed of SEED_LESSONS) {
      await tx.objectStore('lessons').put(seed);
    }
    for (const custom of data.customLessons || []) {
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

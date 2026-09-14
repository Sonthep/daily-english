import {
  Profile,
  Lesson,
  Session,
  Phrase,
  ReviewEvent,
  DatabaseExport,
  LearningResource,
} from '../../types';

export interface IProfileRepository {
  getProfile(): Promise<Profile | null>;
  saveProfile(profile: Profile): Promise<Profile>;
  initDefaultProfile(): Promise<Profile>;
}

export interface ILessonRepository {
  getAllLessons(): Promise<Lesson[]>;
  getLessonById(id: string): Promise<Lesson | null>;
  seedLessonsIfEmpty(): Promise<void>;
}

export interface ISessionRepository {
  getActiveSession(lessonId: string): Promise<Session | null>;
  getMostRecentActiveSession(): Promise<Session | null>;
  saveSession(session: Session): Promise<void>;
  completeSession(session: Session): Promise<void>;
  getAllSessions(): Promise<Session[]>;
  getCompletedSessions(): Promise<Session[]>;
}

export interface IPhraseRepository {
  getAllPhrases(): Promise<Phrase[]>;
  getDuePhrases(): Promise<Phrase[]>;
  getPhraseById(id: string): Promise<Phrase | null>;
  savePhrase(phrase: Phrase): Promise<void>;
  savePhrases(phrases: Phrase[]): Promise<void>;
  deletePhrase(id: string): Promise<void>;
}

export interface IReviewRepository {
  recordReviewEvent(event: ReviewEvent): Promise<void>;
  getAllReviewEvents(): Promise<ReviewEvent[]>;
}

export interface IResourceRepository {
  getAllResources(): Promise<LearningResource[]>;
  getResourceById(id: string): Promise<LearningResource | null>;
  saveResource(resource: LearningResource): Promise<void>;
  deleteResource(id: string): Promise<void>;
  seedResourcesIfEmpty(): Promise<void>;
}

export interface IStorageService {
  exportDatabase(): Promise<DatabaseExport>;
  validateImportData(jsonString: string): { valid: boolean; error?: string; data?: DatabaseExport };
  importDatabase(data: DatabaseExport): Promise<void>;
  resetDatabase(): Promise<void>;
}

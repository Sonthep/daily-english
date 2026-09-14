import { openDB, DBSchema, IDBPDatabase } from 'idb';
import {
  Profile,
  Lesson,
  Session,
  Phrase,
  ReviewEvent,
  LearningResource,
} from '../../types';

export const DB_NAME = 'daily_english_db';
export const DB_VERSION = 2;

export interface DailyEnglishDBSchema extends DBSchema {
  profiles: {
    key: string;
    value: Profile;
  };
  lessons: {
    key: string;
    value: Lesson;
    indexes: {
      'by-category': string;
    };
  };
  sessions: {
    key: string;
    value: Session;
    indexes: {
      'by-lessonId': string;
      'by-completedAt': string;
      'by-updatedAt': string;
    };
  };
  phrases: {
    key: string;
    value: Phrase;
    indexes: {
      'by-dueAt': string;
      'by-category': string;
    };
  };
  review_events: {
    key: string;
    value: ReviewEvent;
    indexes: {
      'by-phraseId': string;
      'by-reviewedAt': string;
    };
  };
  resources: {
    key: string;
    value: LearningResource;
    indexes: {
      'by-type': string;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<DailyEnglishDBSchema>> | null = null;

export function getDatabase(): Promise<IDBPDatabase<DailyEnglishDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<DailyEnglishDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Profiles
        if (!db.objectStoreNames.contains('profiles')) {
          db.createObjectStore('profiles', { keyPath: 'id' });
        }

        // Lessons
        if (!db.objectStoreNames.contains('lessons')) {
          const lessonStore = db.createObjectStore('lessons', { keyPath: 'id' });
          lessonStore.createIndex('by-category', 'category');
        }

        // Sessions
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionStore.createIndex('by-lessonId', 'lessonId');
          sessionStore.createIndex('by-completedAt', 'completedAt');
          sessionStore.createIndex('by-updatedAt', 'updatedAt');
        }

        // Phrases
        if (!db.objectStoreNames.contains('phrases')) {
          const phraseStore = db.createObjectStore('phrases', { keyPath: 'id' });
          phraseStore.createIndex('by-dueAt', 'dueAt');
          phraseStore.createIndex('by-category', 'category');
        }

        // Review Events
        if (!db.objectStoreNames.contains('review_events')) {
          const reviewStore = db.createObjectStore('review_events', { keyPath: 'id' });
          reviewStore.createIndex('by-phraseId', 'phraseId');
          reviewStore.createIndex('by-reviewedAt', 'reviewedAt');
        }

        // Resources (New in Version 2)
        if (!db.objectStoreNames.contains('resources')) {
          const resourceStore = db.createObjectStore('resources', { keyPath: 'id' });
          resourceStore.createIndex('by-type', 'type');
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Resets dbPromise in case of db deletion / recreation.
 */
export function resetDBPromise() {
  dbPromise = null;
}

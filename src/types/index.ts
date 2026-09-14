export type LessonCategory = 'Design & Marketing' | 'Daily Life' | 'Gaming';

export type LessonStep = 'listen' | 'repeat' | 'use_it' | 'review' | 'summary';

export type ResourceType = 'youtube' | 'podcast' | 'song' | 'movie' | 'article';

export interface Profile {
  id: string;
  displayName: string;
  goals: string[];
  dailyMinutes: 5 | 15;
  confidence: 'beginner' | 'intermediate' | 'advancing';
  timezone: string;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LessonSentence {
  id: string;
  en: string;
  th: string;
}

export interface LessonPrompt {
  id: string;
  questionEn: string;
  questionTh: string;
  sampleAnswer: string;
}

export interface TargetPhrase {
  id: string;
  en: string;
  th: string;
  example: string;
  category: string;
}

export interface Lesson {
  id: string;
  titleTh: string;
  titleEn: string;
  category: LessonCategory;
  objectiveTh: string;
  sentences: LessonSentence[];
  prompts: LessonPrompt[];
  targetPhrases: TargetPhrase[];
  createdAt: string;
}

export interface UserAnswer {
  promptId: string;
  answerText: string;
  answeredAt: string;
}

export interface Session {
  id: string;
  lessonId: string;
  modeMinutes: 5 | 15;
  currentStep: LessonStep;
  currentItemIndex: number;
  answers: UserAnswer[];
  reviewedPhraseIds: string[];
  activeDurationSeconds: number;
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface Phrase {
  id: string;
  en: string;
  th: string;
  example: string;
  category: string;
  sourceLessonId: string | null;
  reviewStage: number; // 0, 1, 2, 3, 4, 5+
  dueAt: string; // ISO 8601 UTC
  createdAt: string;
  updatedAt: string;
}

export interface ReviewEvent {
  id: string;
  phraseId: string;
  result: 'again' | 'remembered';
  reviewedAt: string;
  previousStage: number;
  nextStage: number;
}

export interface ResourceSentence {
  id: string;
  en: string;
  th: string;
  timestamp?: string; // e.g. "01:15"
}

export interface LearningResource {
  id: string;
  title: string;
  type: ResourceType;
  sourceUrl?: string;
  embedUrl?: string;
  notes?: string;
  sentences: ResourceSentence[];
  targetPhrases: TargetPhrase[];
  reflectionQuestion?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseExport {
  schemaVersion: number;
  exportedAt: string;
  profile: Profile;
  sessions: Session[];
  phrases: Phrase[];
  reviewEvents: ReviewEvent[];
  resources?: LearningResource[];
}

export type AppRoute =
  | { path: 'today' }
  | { path: 'onboarding' }
  | { path: 'practice' }
  | { path: 'lesson'; lessonId: string }
  | { path: 'resources' }
  | { path: 'resource-study'; resourceId: string }
  | { path: 'phrases' }
  | { path: 'progress' }
  | { path: 'settings' };

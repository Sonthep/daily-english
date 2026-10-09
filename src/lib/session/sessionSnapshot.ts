import { LessonStep, Session, UserAnswer } from '../../types';

export interface SessionProgressState {
  currentStep: LessonStep;
  currentItemIndex: number;
  userAnswers: Record<string, string>;
  reviewedPhraseIds: string[];
  activeDurationSeconds: number;
}

export function buildSessionAnswers(
  userAnswers: Record<string, string>,
  previousAnswers: UserAnswer[],
  nowIso: string
): UserAnswer[] {
  const previousByPrompt = new Map(previousAnswers.map((answer) => [answer.promptId, answer]));

  return Object.entries(userAnswers).map(([promptId, answerText]) => {
    const previous = previousByPrompt.get(promptId);
    return {
      promptId,
      answerText,
      answeredAt:
        previous?.answerText === answerText
          ? previous.answeredAt
          : nowIso,
    };
  });
}

export function createSessionProgressSnapshot(
  session: Session,
  progress: SessionProgressState,
  nowIso: string = new Date().toISOString()
): Session {
  return {
    ...session,
    currentStep: progress.currentStep,
    currentItemIndex: progress.currentItemIndex,
    answers: buildSessionAnswers(progress.userAnswers, session.answers, nowIso),
    reviewedPhraseIds: [...new Set(progress.reviewedPhraseIds)],
    activeDurationSeconds: Math.max(0, progress.activeDurationSeconds),
    updatedAt: nowIso,
  };
}

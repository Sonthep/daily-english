export interface FeedbackCorrection {
  original: string;
  improved: string;
  reasonTh: string;
}

export interface TextFeedbackResponse {
  source: 'example' | 'ai';
  meaningUnderstood: boolean | null;
  correctedSentence: string | null;
  explanationTh: string;
  corrections: FeedbackCorrection[];
  suggestedRetry: string | null;
}

export interface ITutorProvider {
  getFeedback(
    questionEn: string,
    questionTh: string,
    userAnswer: string,
    sampleAnswer: string
  ): Promise<TextFeedbackResponse>;
}

export interface PronunciationProblemWordTip {
  word: string;
  phoneticGuideTh: string;
  tipTh: string;
}

export interface PronunciationCoachingResponse {
  source: 'example' | 'ai';
  overallRating: string;
  pacingAndIntonationTh: string;
  problemWordsTips: PronunciationProblemWordTip[];
  practiceSentence: string;
}

export interface IPronunciationProvider {
  getPronunciationFeedback(
    targetSentence: string,
    spokenTranscript: string,
    problemWords: string[]
  ): Promise<PronunciationCoachingResponse>;
}

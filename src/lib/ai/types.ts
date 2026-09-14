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

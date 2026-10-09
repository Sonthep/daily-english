import {
  ITutorProvider,
  TextFeedbackResponse,
  IPronunciationProvider,
  PronunciationCoachingResponse,
} from './types';

/**
 * Phase 1 Local Tutor Provider.
 * Returns reference examples and self-check guidelines.
 * Does NOT pretend to be a real AI evaluator or grammar checker.
 */
export class ExampleTutorProvider implements ITutorProvider {
  async getFeedback(
    _questionEn: string,
    _questionTh: string,
    userAnswer: string,
    sampleAnswer: string
  ): Promise<TextFeedbackResponse> {
    const trimmed = userAnswer.trim();

    return {
      source: 'example',
      meaningUnderstood: null, // Indicates self-check mode
      correctedSentence: sampleAnswer,
      explanationTh:
        'คำตอบตัวอย่างนี้จัดทำขึ้นเพื่อให้คุณใช้เปรียบเทียบโครงสร้างประโยคและการเลือกใช้คำศัพท์ ไม่ใช่การตรวจประเมินคะแนน',
      corrections: [],
      suggestedRetry:
        trimmed.length > 0
          ? `ลองฝึกพูดคำตอบของคุณ: "${trimmed}" แล้วลองเทียบกับตัวอย่างด้านบน`
          : sampleAnswer,
    };
  }
}

/**
 * Local pronunciation practice guidance.
 */
export class ExamplePronunciationProvider implements IPronunciationProvider {
  async getPronunciationFeedback(
    targetSentence: string,
    _spokenTranscript: string,
    problemWords: string[]
  ): Promise<PronunciationCoachingResponse> {
    return {
      source: 'example',
      overallRating:
        problemWords.length === 0
          ? 'ออกเสียงได้ชัดเจนครบถ้วน'
          : 'คำแนะนำการฝึกออกเสียงตามเกณฑ์สัทศาสตร์',
      pacingAndIntonationTh:
        'คำภาษาอังกฤษที่มีหลายพยางค์ ให้เน้นเสียงหนัก (Stress) ที่พยางค์หลัก และเชื่อมเสียงพยัญชนะท้ายคำกับสระถัดไปเสมอ',
      problemWordsTips: problemWords.slice(0, 3).map((w) => ({
        word: w,
        phoneticGuideTh: w,
        tipTh: 'ฝึกฟังเสียงต้นแบบด้วยความเร็ว 0.75x และสังเกตการเปิดปากและรูปฟัน',
      })),
      practiceSentence: targetSentence,
    };
  }
}

export const defaultTutorProvider: ITutorProvider = new ExampleTutorProvider();
export const defaultPronunciationProvider: IPronunciationProvider =
  new ExamplePronunciationProvider();

export function getActiveTutorProvider(): ITutorProvider {
  return defaultTutorProvider;
}

export function getActivePronunciationProvider(): IPronunciationProvider {
  return defaultPronunciationProvider;
}

export * from './types';

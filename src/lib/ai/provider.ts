import { ITutorProvider, TextFeedbackResponse } from './types';
import { GeminiTutorProvider, getStoredGeminiApiKey } from './geminiProvider';

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

export const defaultTutorProvider: ITutorProvider = new ExampleTutorProvider();

/**
 * Returns GeminiTutorProvider if an API key is saved in localStorage,
 * otherwise falls back seamlessly to ExampleTutorProvider.
 */
export function getActiveTutorProvider(): ITutorProvider {
  const apiKey = getStoredGeminiApiKey();
  if (apiKey) {
    return new GeminiTutorProvider(apiKey);
  }
  return defaultTutorProvider;
}

export { GeminiTutorProvider };
export * from './types';
export * from './geminiProvider';

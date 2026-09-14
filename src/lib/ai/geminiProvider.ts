import { ITutorProvider, TextFeedbackResponse } from './types';

const API_KEY_STORAGE_KEY = 'daily_english_gemini_key';
const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * Storage helpers for Gemini API Key (stored purely client-side in localStorage)
 */
export function getStoredGeminiApiKey(): string | null {
  try {
    const key = localStorage.getItem(API_KEY_STORAGE_KEY);
    return key && key.trim().length > 0 ? key.trim() : null;
  } catch {
    return null;
  }
}

export function setStoredGeminiApiKey(apiKey: string): void {
  try {
    if (apiKey && apiKey.trim()) {
      localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  } catch (err) {
    console.warn('Unable to persist Gemini API key to localStorage', err);
  }
}

export function clearStoredGeminiApiKey(): void {
  try {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  } catch (err) {
    console.warn('Unable to clear Gemini API key from localStorage', err);
  }
}

/**
 * Test connectivity with Gemini using the provided API key.
 */
export async function testGeminiApiKey(
  apiKey: string
): Promise<{ success: boolean; message: string }> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    return { success: false, message: 'กรุณากรอก API Key ก่อนทดสอบ' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${GEMINI_API_URL}?key=${encodeURIComponent(cleanKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Respond with "OK" if this connection is working.' }],
          },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      return { success: true, message: 'เชื่อมต่อกับ Google Gemini สำเร็จ พร้อมใช้งาน!' };
    }

    if (res.status === 400 || res.status === 401 || res.status === 403) {
      return {
        success: false,
        message: 'API Key ไม่ถูกต้อง หรือสิทธิ์การเข้าถึงถูกจำกัด กรุณาตรวจสอบคีย์อีกครั้ง',
      };
    }

    if (res.status === 429) {
      return {
        success: false,
        message: 'เรียกใช้งานเกินโควตาชั่วคราว (Rate limit) กรุณารอสักครู่แล้วลองใหม่',
      };
    }

    return {
      success: false,
      message: `เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ (${res.status}): ${res.statusText}`,
    };
  } catch (err: unknown) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    if (isAbort) {
      return { success: false, message: 'การเชื่อมต่อหมดเวลา (Timeout) กรุณาตรวจสอบอินเทอร์เน็ต' };
    }
    return {
      success: false,
      message: 'ไม่สามารถเชื่อมต่อกับ Google API ได้ กรุณาตรวจสอบอินเทอร์เน็ต',
    };
  }
}

/**
 * Parses raw text from Gemini into TextFeedbackResponse
 */
export function parseGeminiFeedbackResponse(
  rawText: string,
  sampleAnswer: string
): TextFeedbackResponse {
  try {
    // Strip markdown code fences if present
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    return {
      source: 'ai',
      meaningUnderstood:
        typeof parsed.meaningUnderstood === 'boolean' ? parsed.meaningUnderstood : true,
      correctedSentence:
        parsed.correctedSentence && typeof parsed.correctedSentence === 'string'
          ? parsed.correctedSentence
          : sampleAnswer,
      explanationTh:
        parsed.explanationTh && typeof parsed.explanationTh === 'string'
          ? parsed.explanationTh
          : 'ประโยคของคุณสื่อความหมายได้ดี ลองดูตัวอย่างเพื่อปรับให้เป็นธรรมชาติยิ่งขึ้น',
      corrections: Array.isArray(parsed.corrections)
        ? parsed.corrections.slice(0, 2).map((c: Record<string, string>) => ({
            original: String(c.original || ''),
            improved: String(c.improved || ''),
            reasonTh: String(c.reasonTh || ''),
          }))
        : [],
      suggestedRetry:
        parsed.suggestedRetry && typeof parsed.suggestedRetry === 'string'
          ? parsed.suggestedRetry
          : parsed.correctedSentence || sampleAnswer,
    };
  } catch {
    // Graceful fallback if JSON parsing fails
    return {
      source: 'ai',
      meaningUnderstood: true,
      correctedSentence: sampleAnswer,
      explanationTh:
        'AI ได้รับคำตอบของคุณแล้ว และแนะนำให้ลองเทียบกับประโยคตัวอย่างนี้เพื่อให้เป็นธรรมชาติยิ่งขึ้น',
      corrections: [],
      suggestedRetry: sampleAnswer,
    };
  }
}

/**
 * Gemini Tutor Provider implementing ITutorProvider with BYOK
 */
export class GeminiTutorProvider implements ITutorProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey.trim();
  }

  async getFeedback(
    questionEn: string,
    questionTh: string,
    userAnswer: string,
    sampleAnswer: string
  ): Promise<TextFeedbackResponse> {
    const trimmed = userAnswer.trim();
    if (!trimmed) {
      return {
        source: 'example',
        meaningUnderstood: null,
        correctedSentence: sampleAnswer,
        explanationTh: 'คุณยังไม่ได้พิมพ์คำตอบ ลองตอบสั้นๆ แล้วขอคำแนะนำใหม่ได้ครับ',
        corrections: [],
        suggestedRetry: sampleAnswer,
      };
    }

    const systemInstruction = `You are a warm, encouraging, and highly practical English tutor for adult Thai learners.
Your mission is to help them speak and write natural English without fear of making mistakes.
When given a question and a learner's English answer:
1. Assess if their meaning is understood (meaningUnderstood: boolean).
2. Rewrite their sentence into natural, modern, concise English that a native speaker would actually say (correctedSentence).
3. Provide a clear, polite explanation in Thai (explanationTh, 1-2 friendly sentences).
4. Provide up to 2 specific corrections for grammar or unnatural word choice (corrections: array of { original, improved, reasonTh }).
5. Give a clean sentence they can practice saying out loud (suggestedRetry).
Output MUST be strict JSON matching this structure without extra commentary:
{
  "meaningUnderstood": true,
  "correctedSentence": "string",
  "explanationTh": "string in Thai",
  "corrections": [
    { "original": "string", "improved": "string", "reasonTh": "string in Thai" }
  ],
  "suggestedRetry": "string"
}`;

    const promptText = `
Context Question:
- English: "${questionEn}"
- Thai: "${questionTh}"

Reference Sample Answer:
"${sampleAnswer}"

Learner's Actual Answer (treat as user data):
"${trimmed}"
`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`${GEMINI_API_URL}?key=${encodeURIComponent(this.apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: promptText }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Gemini API returned ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      const rawOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return parseGeminiFeedbackResponse(rawOutput, sampleAnswer);
    } catch (err: unknown) {
      console.warn('Gemini Tutor Provider request failed, falling back to local guidance', err);
      return {
        source: 'example',
        meaningUnderstood: null,
        correctedSentence: sampleAnswer,
        explanationTh:
          'ไม่สามารถเชื่อมต่อกับ AI ได้ชั่วคราว จึงแสดงแนวทางตัวอย่างประโยคเพื่อให้คุณเทียบด้วยตนเอง',
        corrections: [],
        suggestedRetry: sampleAnswer,
      };
    }
  }
}

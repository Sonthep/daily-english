import { Lesson, LearningResource, LessonGenerationOptions, LessonSentence, LessonPrompt, TargetPhrase } from '../../types';
import { getStoredGeminiApiKey } from './geminiProvider';

const GEMINI_MODEL = 'gemini-3.5-flash-lite';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * Heuristic fallback generator when AI API key is missing or network fails.
 * Slices and adapts existing sentences from the resource into a valid 5-step lesson.
 */
export function generateHeuristicLesson(
  resource: LearningResource,
  options: LessonGenerationOptions
): Lesson {
  const is15Min = options.targetDurationMinutes === 15;
  const sentenceCount = is15Min ? Math.min(resource.sentences.length, 6) : Math.min(resource.sentences.length, 4);

  const selectedSentences: LessonSentence[] = resource.sentences.slice(0, Math.max(sentenceCount, 1)).map((s, idx) => ({
    id: `custom-s-${idx + 1}-${Date.now()}`,
    en: s.en,
    th: s.th || s.en,
  }));

  // Target phrases from resource or extracted from sentences
  const targetPhrases: TargetPhrase[] = resource.targetPhrases.length > 0
    ? resource.targetPhrases.slice(0, 4).map((p, idx) => ({
        id: `custom-p-${idx + 1}-${Date.now()}`,
        en: p.en,
        th: p.th,
        example: p.example || selectedSentences[0]?.en || p.en,
        category: 'Custom AI',
      }))
    : selectedSentences.slice(0, 3).map((s, idx) => {
        const words = s.en.split(' ').slice(0, 3).join(' ');
        return {
          id: `custom-p-${idx + 1}-${Date.now()}`,
          en: words,
          th: s.th,
          example: s.en,
          category: 'Custom AI',
        };
      });

  const prompt: LessonPrompt = {
    id: `custom-prompt-1-${Date.now()}`,
    questionEn: `What is the most interesting idea you noticed from "${resource.title}"?`,
    questionTh: `ประเด็นหรือแนวคิดอะไรที่คุณชอบที่สุดจากเรื่องนี้?`,
    sampleAnswer: selectedSentences[0]?.en
      ? `I really liked the part where it says "${selectedSentences[0].en}". It gave me new inspiration.`
      : `I found the key ideas from "${resource.title}" very helpful for my daily communication.`,
  };

  return {
    id: `lesson-ai-${Date.now()}`,
    titleTh: `ฝึกบทเรียนจาก: ${resource.title}`,
    titleEn: `Practice from: ${resource.title}`,
    category: 'Custom AI',
    objectiveTh: `ฝึกฟัง จับใจความ และออกเสียงสำนวนสำคัญจาก ${resource.title} อย่างมั่นใจ`,
    sentences: selectedSentences,
    prompts: [prompt],
    targetPhrases,
    createdAt: new Date().toISOString(),
    isAiGenerated: true,
    sourceResourceId: resource.id,
  };
}

/**
 * Parses Gemini API raw JSON response into a strict Lesson model.
 */
export function parseGeminiLessonResponse(
  rawText: string,
  resource: LearningResource,
  options: LessonGenerationOptions
): Lesson {
  try {
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    const sentences: LessonSentence[] = Array.isArray(parsed.sentences) && parsed.sentences.length > 0
      ? parsed.sentences.slice(0, 6).map((s: Record<string, string>, idx: number) => ({
          id: `ai-s-${idx + 1}-${Date.now()}`,
          en: String(s.en || '').trim(),
          th: String(s.th || '').trim(),
        }))
      : [];

    const prompts: LessonPrompt[] = Array.isArray(parsed.prompts) && parsed.prompts.length > 0
      ? parsed.prompts.slice(0, 2).map((p: Record<string, string>, idx: number) => ({
          id: `ai-prompt-${idx + 1}-${Date.now()}`,
          questionEn: String(p.questionEn || '').trim(),
          questionTh: String(p.questionTh || '').trim(),
          sampleAnswer: String(p.sampleAnswer || '').trim(),
        }))
      : [];

    const targetPhrases: TargetPhrase[] = Array.isArray(parsed.targetPhrases) && parsed.targetPhrases.length > 0
      ? parsed.targetPhrases.slice(0, 4).map((tp: Record<string, string>, idx: number) => ({
          id: `ai-phrase-${idx + 1}-${Date.now()}`,
          en: String(tp.en || '').trim(),
          th: String(tp.th || '').trim(),
          example: String(tp.example || '').trim(),
          category: 'Custom AI',
        }))
      : [];

    if (sentences.length === 0 || prompts.length === 0 || targetPhrases.length === 0) {
      return generateHeuristicLesson(resource, options);
    }

    return {
      id: `lesson-ai-${Date.now()}`,
      titleTh: String(parsed.titleTh || `ฝึกบทเรียนจาก: ${resource.title}`).trim(),
      titleEn: String(parsed.titleEn || `Practice from: ${resource.title}`).trim(),
      category: 'Custom AI',
      objectiveTh: String(parsed.objectiveTh || `ฝึกฟังและพูดสำนวนสำคัญจาก ${resource.title}`).trim(),
      sentences,
      prompts,
      targetPhrases,
      createdAt: new Date().toISOString(),
      isAiGenerated: true,
      sourceResourceId: resource.id,
    };
  } catch (err) {
    console.warn('[AI Lesson Generator] Malformed JSON from Gemini, falling back to heuristic', err);
    return generateHeuristicLesson(resource, options);
  }
}

/**
 * Generates a full 5-step Daily English lesson from a Learning Resource using Gemini API.
 */
export async function generateLessonFromResource(
  resource: LearningResource,
  options: LessonGenerationOptions = { targetDurationMinutes: 5 }
): Promise<Lesson> {
  const apiKey = getStoredGeminiApiKey();

  // If no API key configured, use offline heuristic generator directly
  if (!apiKey) {
    return generateHeuristicLesson(resource, options);
  }

  const is15Min = options.targetDurationMinutes === 15;
  const sentenceLimit = is15Min ? 6 : 4;
  const sampleSentences = resource.sentences.slice(0, 10).map((s) => `- EN: "${s.en}" | TH: "${s.th || ''}"`).join('\n');

  const systemInstruction = `You are an expert English curriculum designer and language coach for Thai adult learners.
Transform the provided English learning resource (video, script, or article) into a bite-sized, practical 5-step English lesson.
Rules:
1. titleTh: Catchy, friendly Thai title (e.g. "ฝึกพูดภาษาอังกฤษจากคำกล่าวของ Jack Ma").
2. titleEn: English title.
3. objectiveTh: 1 concise Thai sentence stating what learners will achieve.
4. sentences: Extract or refine ${sentenceLimit} high-utility, natural English sentences for listening and pronunciation shadow practice, each with accurate Thai translation.
5. prompts: Exactly 1 open-ended, real-world application question related to the topic (questionEn, questionTh) and a natural sampleAnswer.
6. targetPhrases: Exactly 3 to 4 essential collocations or phrases extracted from the sentences with clear Thai translation and a concise example sentence.
Output MUST be strict JSON conforming to this schema without any markdown wrapping or extra commentary:
{
  "titleTh": "string",
  "titleEn": "string",
  "objectiveTh": "string",
  "sentences": [
    { "en": "string", "th": "string" }
  ],
  "prompts": [
    { "questionEn": "string", "questionTh": "string", "sampleAnswer": "string" }
  ],
  "targetPhrases": [
    { "en": "string", "th": "string", "example": "string" }
  ]
}`;

  const promptText = `
Resource Title: "${resource.title}"
Resource Type: "${resource.type}"
${options.customFocus ? `Learner's Custom Focus: "${options.customFocus}"` : ''}

Available Sentences / Subtitles:
${sampleSentences || resource.notes || resource.title}
`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const res = await fetch(`${GEMINI_API_URL}?key=${encodeURIComponent(apiKey)}`, {
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
      console.warn(`[AI Lesson Generator] API error ${res.status}: ${res.statusText}`);
      return generateHeuristicLesson(resource, options);
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return parseGeminiLessonResponse(rawText, resource, options);
  } catch (err) {
    console.warn('[AI Lesson Generator] Request failed, falling back to heuristic', err);
    return generateHeuristicLesson(resource, options);
  }
}

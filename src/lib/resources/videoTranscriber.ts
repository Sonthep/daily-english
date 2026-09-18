import { ResourceSentence, TargetPhrase } from '../../types';
import { getStoredGeminiApiKey } from '../ai/geminiProvider';
import { extractYouTubeId } from './mediaUtils';

const CANDIDATE_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash'];

function formatGeminiError(errText: string, status?: number): string {
  try {
    const parsed = JSON.parse(errText);
    if (parsed?.error?.message) {
      return parsed.error.message;
    }
  } catch {
    // ignore
  }
  return errText || (status ? `Status ${status}` : 'Unknown error');
}

/**
 * Calls Gemini generateContent endpoint, trying candidate models in order if 404 (model deprecated) occurs.
 */
async function callGeminiGenerateContent(
  apiKey: string,
  body: Record<string, unknown>,
  signal?: AbortSignal
): Promise<Response> {
  let lastResponse: Response | null = null;
  let lastErrorText = '';

  for (const model of CANDIDATE_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal,
      });

      if (res.ok) {
        return res;
      }

      // If 404 Not Found (model not available or deprecated), try next model
      if (res.status === 404) {
        lastResponse = res;
        lastErrorText = await res.text();
        console.warn(`Gemini model ${model} returned 404, trying next fallback model...`);
        continue;
      }

      // If other status (e.g. 400, 401, 429, 500), return immediately
      return res;
    } catch (err) {
      if (signal?.aborted) throw err;
      throw err;
    }
  }

  if (lastResponse) {
    const friendly = formatGeminiError(lastErrorText, 404);
    throw new Error(`Gemini API error (404): ${friendly}`);
  }

  throw new Error('ไม่สามารถเชื่อมต่อกับ Google Gemini ได้ กรุณาตรวจสอบอินเทอร์เน็ตหรือ API Key');
}

/**
 * Converts timestamp string (e.g. "01:24", "1:24", "01:24:05") into total seconds.
 */
export function timestampToSeconds(ts: string): number {
  if (!ts) return 0;
  const parts = ts.trim().split(':').map((p) => parseInt(p, 10));
  if (parts.some((n) => isNaN(n))) return 0;

  if (parts.length === 3) {
    // hh:mm:ss
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // mm:ss
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }
  return 0;
}

/**
 * Formats total seconds into standard "mm:ss" or "hh:mm:ss" format.
 */
export function secondsToTimestamp(totalSeconds: number): string {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;

  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');

  if (h > 0) {
    return `${h}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/**
 * Normalizes any timestamp string into standardized "mm:ss".
 * e.g. "0:5" -> "00:05", "1:24" -> "01:24", "[02:15]" -> "02:15"
 */
export function normalizeTimestamp(raw: string): string {
  if (!raw) return '';
  const cleaned = raw.replace(/[\[\]\(\)]/g, '').trim();
  const sec = timestampToSeconds(cleaned);
  return secondsToTimestamp(sec);
}

export interface YouTubeTranscriptItem {
  timestamp: string;
  text: string;
}

/**
 * Parses raw copied YouTube transcript or subtitle text.
 * YouTube transcripts typically appear as:
 *   0:00
 *   Hi everyone welcome back to English in Flow
 *   0:04
 *   Today we are going to learn how to think in English
 *
 * This function handles multi-line timestamps and smartly merges short 3-word fragments
 * into natural, cohesive sentences suitable for English shadowing practice.
 */
export function parseYouTubeTranscript(
  rawText: string,
  options?: {
    minWordsPerSentence?: number;
    maxWordsPerSentence?: number;
  }
): ResourceSentence[] {
  if (!rawText || !rawText.trim()) return [];

  const maxWords = options?.maxWordsPerSentence ?? 22;

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const timestampLineRegex = /^(?:\[|\()?(\d{1,2}:\d{2}(?::\d{2})?)(?:\]|\))?$/;
  const inlineTimestampRegex = /(?:\[|\()?(\d{1,2}:\d{2}(?::\d{2})?)(?:\]|\))?/;
  const srtArrowRegex = /(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})/;

  const rawChunks: YouTubeTranscriptItem[] = [];
  let pendingTimestamp: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip standalone sequence numbers (SRT format e.g. "1", "2")
    if (/^\d+$/.test(line)) {
      continue;
    }

    // Check for SRT/VTT arrow timestamp line
    const srtMatch = line.match(srtArrowRegex);
    if (srtMatch) {
      pendingTimestamp = srtMatch[1].slice(3, 8); // e.g. "01:24"
      continue;
    }

    // Check for standalone timestamp line (YouTube transcript standard)
    const standaloneMatch = line.match(timestampLineRegex);
    if (standaloneMatch) {
      pendingTimestamp = normalizeTimestamp(standaloneMatch[1]);
      continue;
    }

    // Check for inline timestamp at beginning of line
    let textLine = line;
    let currentTs = pendingTimestamp;
    const inlineMatch = textLine.match(inlineTimestampRegex);
    if (inlineMatch && textLine.indexOf(inlineMatch[0]) < 5) {
      currentTs = normalizeTimestamp(inlineMatch[1]);
      textLine = textLine.replace(inlineMatch[0], '').replace(/^[\s\-–—:]+/, '').trim();
    }

    if (!textLine) continue;

    // Filter out common YouTube metadata labels e.g. "[Music]", "[Applause]", "(Laughter)"
    if (/^(\[|\()(Music|Applause|Laughter|Cheering|Audio|Sound)(\]|\))$/i.test(textLine)) {
      continue;
    }

    rawChunks.push({
      timestamp: currentTs || '00:00',
      text: textLine,
    });

    pendingTimestamp = null;
  }

  if (rawChunks.length === 0) return [];

  // Group fragments into coherent sentences
  const sentences: ResourceSentence[] = [];
  let currentGroupText: string[] = [];
  let currentStartTimestamp = rawChunks[0]?.timestamp || '00:00';

  const flushSentence = () => {
    if (currentGroupText.length === 0) return;
    let fullText = currentGroupText.join(' ').replace(/\s+/g, ' ').trim();
    if (!fullText) return;

    // Capitalize first character
    fullText = fullText.charAt(0).toUpperCase() + fullText.slice(1);
    // Ensure terminal punctuation if missing
    if (!/[.!?]$/.test(fullText)) {
      fullText += '.';
    }

    sentences.push({
      id: `trans_${Date.now()}_${sentences.length + 1}`,
      en: fullText,
      th: '', // Can be translated via AI
      timestamp: currentStartTimestamp,
    });

    currentGroupText = [];
  };

  for (let i = 0; i < rawChunks.length; i++) {
    const chunk = rawChunks[i];
    if (currentGroupText.length === 0) {
      currentStartTimestamp = chunk.timestamp;
    }

    currentGroupText.push(chunk.text);
    const combined = currentGroupText.join(' ');
    const wordCount = combined.split(/\s+/).filter(Boolean).length;

    // Boundary signals: ends with terminal punctuation (. ? !) or reached max words
    const hasPunctuationEnd =
      /[.!?]$/.test(chunk.text.trim()) &&
      !/(?:Mr|Mrs|Ms|Dr|vs|etc|U\.S)\.$/i.test(chunk.text.trim());

    if (hasPunctuationEnd || wordCount >= maxWords) {
      flushSentence();
    }
  }

  flushSentence();
  return sentences;
}

export interface VideoTranscribeOptions {
  videoUrl?: string;
  videoTitle: string;
  notes?: string;
  count?: number;
  focus?: 'practical' | 'beginner' | 'full';
  apiKey?: string;
}

export interface TranscribeResult {
  sentences: ResourceSentence[];
  targetPhrases?: TargetPhrase[];
}

/**
 * Transcribes and extracts key spoken English sentences from a video using Google Gemini.
 * Uses multimodal understanding for YouTube videos or deep reasoning with video title/context.
 */
export async function transcribeVideoWithGemini(
  options: VideoTranscribeOptions
): Promise<TranscribeResult> {
  const apiKey = (options.apiKey || getStoredGeminiApiKey() || '').trim();
  if (!apiKey) {
    throw new Error('กรุณาระบุ Google Gemini API Key เพื่อถอดประโยคด้วย AI');
  }

  const sentenceCount = options.count || 8;
  const ytId = options.videoUrl ? extractYouTubeId(options.videoUrl) : null;
  const canonicalYtUrl = ytId ? `https://www.youtube.com/watch?v=${ytId}` : options.videoUrl || '';

  const systemInstruction = `You are an expert English language coach and professional speech transcriber.
Your task is to transcribe and extract key spoken English sentences from a video for Shadowing practice.

Guidelines:
1. Extract ${sentenceCount} natural, clear, highly practical spoken English sentences that the speaker says in the video.
2. For each sentence:
   - "en": Exact or clear spoken English sentence (1-2 clauses, natural rhythm for shadowing).
   - "th": Accurate, natural, idiomatic Thai translation.
   - "timestamp": The approximate timestamp in the video where this is spoken (format "mm:ss" e.g. "00:25", "01:14").
3. Also extract 3-4 useful target idioms/phrases ("targetPhrases") from the sentences that learners should save.

You MUST respond strictly with valid JSON conforming to this schema without markdown code blocks:
{
  "sentences": [
    { "en": "string", "th": "string", "timestamp": "mm:ss" }
  ],
  "targetPhrases": [
    { "en": "string", "th": "string", "example": "string", "category": "Speaking" }
  ]
}`;

  const promptText = `
Video Details:
- Title: "${options.videoTitle}"
${canonicalYtUrl ? `- YouTube Video URL: ${canonicalYtUrl}` : ''}
${options.notes ? `- Context / Description: "${options.notes}"` : ''}
- Training Focus: ${options.focus || 'practical shadowing sentences with real conversational cadence'}
- Requested sentence count: ${sentenceCount}

Please analyze the speech in this video and extract the best sentences for shadowing practice.
Ensure every sentence has an accurate timestamp (mm:ss) and natural Thai translation.
`;

  // Prepare request body with multimodal video support if YouTube URL is present
  const parts: Array<Record<string, unknown>> = [];

  if (canonicalYtUrl) {
    parts.push({
      fileData: {
        fileUri: canonicalYtUrl,
        mimeType: 'video/mp4',
      },
    });
  }

  parts.push({ text: promptText });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  let res: Response;
  try {
    res = await callGeminiGenerateContent(
      apiKey,
      {
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: [
          {
            role: 'user',
            parts: parts,
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      },
      controller.signal
    );
  } catch (err) {
    clearTimeout(timeoutId);
    // If multimodal fileData failed, try fallback with text prompt only
    if (canonicalYtUrl) {
      return transcribeWithTextPromptFallback(options, apiKey);
    }
    throw err;
  }

  clearTimeout(timeoutId);

  if (!res.ok) {
    // If YouTube fileData rejected by endpoint, fallback gracefully to prompt-based extraction
    if (canonicalYtUrl && (res.status === 400 || res.status === 404)) {
      return transcribeWithTextPromptFallback(options, apiKey);
    }
    const errBody = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${formatGeminiError(errBody, res.status)}`);
  }

  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return parseTranscribeApiResponse(rawText, options.videoTitle);
}

/**
 * Fallback when direct YouTube fileData is not accessible to the model.
 * Uses video metadata, title, and topic to reconstruct the speaker's key sentences.
 */
async function transcribeWithTextPromptFallback(
  options: VideoTranscribeOptions,
  apiKey: string
): Promise<TranscribeResult> {
  const sentenceCount = options.count || 8;
  const promptText = `You are an expert English speech coach.
The learner wants to shadow key spoken English sentences from the video:
- Title: "${options.videoTitle}"
${options.videoUrl ? `- URL: ${options.videoUrl}` : ''}
${options.notes ? `- Context: "${options.notes}"` : ''}

Generate ${sentenceCount} of the most famous, representative, or characteristic spoken English sentences and ideas spoken in this speech/video for shadowing practice.
For each sentence, provide:
1. "en": The spoken English sentence.
2. "th": Natural Thai translation.
3. "timestamp": Reasonable estimated sequential timestamps in "mm:ss" format (e.g. 00:15, 00:45, 01:20, 02:05...).
And 3-4 key phrases in "targetPhrases".

Output MUST be strict JSON:
{
  "sentences": [
    { "en": "string", "th": "string", "timestamp": "mm:ss" }
  ],
  "targetPhrases": [
    { "en": "string", "th": "string", "example": "string", "category": "Speaking" }
  ]
}`;

  const res = await callGeminiGenerateContent(apiKey, {
    contents: [{ role: 'user', parts: [{ text: promptText }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json',
    },
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini error (${res.status}): ${formatGeminiError(errBody, res.status)}`);
  }

  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return parseTranscribeApiResponse(rawText, options.videoTitle);
}

/**
 * Parses Gemini API JSON output into valid ResourceSentence and TargetPhrase items.
 */
function parseTranscribeApiResponse(rawText: string, _videoTitle: string): TranscribeResult {
  try {
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    const sentences: ResourceSentence[] = Array.isArray(parsed.sentences)
      ? parsed.sentences
          .filter((s: Record<string, string>) => s.en && s.en.trim().length > 0)
          .map((s: Record<string, string>, idx: number) => ({
            id: `ai_st_${Date.now()}_${idx + 1}`,
            en: String(s.en).trim(),
            th: String(s.th || '').trim(),
            timestamp: s.timestamp ? normalizeTimestamp(String(s.timestamp)) : secondsToTimestamp(idx * 30),
          }))
      : [];

    const targetPhrases: TargetPhrase[] = Array.isArray(parsed.targetPhrases)
      ? parsed.targetPhrases
          .filter((p: Record<string, string>) => p.en && p.en.trim().length > 0)
          .map((p: Record<string, string>, idx: number) => ({
            id: `ai_tp_${Date.now()}_${idx + 1}`,
            en: String(p.en).trim(),
            th: String(p.th || '').trim(),
            example: String(p.example || sentences[0]?.en || p.en).trim(),
            category: String(p.category || 'Speaking').trim(),
          }))
      : [];

    return { sentences, targetPhrases };
  } catch (err) {
    console.error('Failed to parse Gemini transcribe output', err, rawText);
    throw new Error('ไม่สามารถแปลงข้อมูลที่ได้จาก AI กรุณาลองใหม่อีกครั้ง');
  }
}

/**
 * Translates English sentences to Thai in batch using Gemini API.
 */
export async function translateSentencesWithGemini(
  sentences: ResourceSentence[],
  apiKey?: string
): Promise<ResourceSentence[]> {
  const cleanKey = (apiKey || getStoredGeminiApiKey() || '').trim();
  if (!cleanKey) {
    throw new Error('กรุณาระบุ Google Gemini API Key เพื่อแปลภาษา');
  }

  const untranslated = sentences.filter((s) => !s.th || !s.th.trim());
  if (untranslated.length === 0) return sentences;

  const promptText = `Translate the following English sentences into natural, idiomatic Thai:
${JSON.stringify(
  untranslated.map((s) => ({ id: s.id, en: s.en })),
  null,
  2
)}

Output JSON array strictly:
[
  { "id": "string", "th": "คำแปลภาษาไทยที่เป็นธรรมชาติ" }
]`;

  const res = await callGeminiGenerateContent(cleanKey, {
    contents: [{ role: 'user', parts: [{ text: promptText }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini translation error (${res.status}): ${formatGeminiError(errBody, res.status)}`);
  }

  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const parsed = JSON.parse(
    rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim()
  );

  const translationMap = new Map<string, string>();
  if (Array.isArray(parsed)) {
    for (const item of parsed) {
      if (item.id && item.th) {
        translationMap.set(String(item.id), String(item.th));
      }
    }
  }

  return sentences.map((s) => ({
    ...s,
    th: translationMap.get(s.id) || s.th,
  }));
}

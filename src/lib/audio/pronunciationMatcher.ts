/**
 * Pronunciation Matching & Evaluation Engine for Daily English
 * Compares target sentence against spoken transcript offline using sequence alignment,
 * token normalization, contraction handling, and Levenshtein distance.
 */

export type WordMatchStatus = 'matched' | 'near' | 'missing' | 'extra';

export interface EvaluatedWordToken {
  /** Original word as formatted in target or spoken text */
  word: string;
  /** Normalized lowercase word without punctuation */
  cleanWord: string;
  /** Evaluation status */
  status: WordMatchStatus;
  /** The spoken word matched against this target token (if applicable) */
  spokenWord?: string;
  /** Similarity ratio between 0 and 1 */
  similarity: number;
}

export type PronunciationRating = 'excellent' | 'good' | 'fair' | 'retry';

export interface PronunciationScoreResult {
  score: number; // 0 to 100
  rating: PronunciationRating;
  statusLabel: string;
  matchedCount: number;
  totalTargetCount: number;
  tokens: EvaluatedWordToken[];
  problemWords: string[];
  spokenTranscript: string;
  targetSentence: string;
}

/**
 * Common English contractions mapping for normalization
 */
const CONTRACTIONS_MAP: Record<string, string> = {
  "can't": 'cannot',
  "won't": 'will not',
  "n't": ' not',
  "'m": ' am',
  "'re": ' are',
  "'ve": ' have',
  "'ll": ' will',
  "'d": ' would',
  "it's": 'it is',
  "that's": 'that is',
  "what's": 'what is',
  "there's": 'there is',
  "here's": 'here is',
  "he's": 'he is',
  "she's": 'she is',
  "let's": 'let us',
};

/**
 * Clean and normalize an English word or sentence
 */
export function cleanEnglishText(text: string): string {
  if (!text) return '';
  let cleaned = text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .trim();

  // Replace common contractions with standard equivalents if beneficial
  for (const [key, replacement] of Object.entries(CONTRACTIONS_MAP)) {
    cleaned = cleaned.replace(new RegExp(key, 'gi'), replacement);
  }

  // Remove punctuation except apostrophes in words
  cleaned = cleaned.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'–—]/g, ' ');
  return cleaned.replace(/\s+/g, ' ').trim();
}

/**
 * Calculate Levenshtein edit distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix: number[][] = [];

  for (let i = 0; i <= bn; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= an; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[bn][an];
}

/**
 * Calculate similarity between 0 and 1
 */
export function wordSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = levenshteinDistance(a, b);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Split sentence into clean word tokens while preserving original display text
 */
function extractTokens(sentence: string): Array<{ raw: string; clean: string }> {
  if (!sentence) return [];
  const rawWords = sentence.trim().split(/\s+/);
  return rawWords
    .map((w) => {
      const clean = cleanEnglishText(w);
      return { raw: w, clean };
    })
    .filter((t) => t.clean.length > 0);
}

/**
 * Evaluate pronunciation by comparing target sentence against spoken transcript
 */
export function evaluatePronunciation(
  targetSentence: string,
  spokenTranscript: string
): PronunciationScoreResult {
  const targetTokens = extractTokens(targetSentence);
  const spokenTokens = extractTokens(spokenTranscript);

  if (targetTokens.length === 0) {
    return {
      score: 0,
      rating: 'retry',
      statusLabel: 'ไม่พบประโยคเป้าหมาย',
      matchedCount: 0,
      totalTargetCount: 0,
      tokens: [],
      problemWords: [],
      spokenTranscript,
      targetSentence,
    };
  }

  if (spokenTokens.length === 0) {
    return {
      score: 0,
      rating: 'retry',
      statusLabel: 'ยังตรวจไม่พบเสียงพูด ลองกดอัดเสียงแล้วพูดตามประโยคอีกครั้งครับ',
      matchedCount: 0,
      totalTargetCount: targetTokens.length,
      tokens: targetTokens.map((t) => ({
        word: t.raw,
        cleanWord: t.clean,
        status: 'missing',
        similarity: 0,
      })),
      problemWords: targetTokens.map((t) => t.clean),
      spokenTranscript,
      targetSentence,
    };
  }

  const resultTokens: EvaluatedWordToken[] = [];
  let spokenIndex = 0;
  let matchedCount = 0;
  let weightedPoints = 0;

  // Windowed sequence matching
  for (let i = 0; i < targetTokens.length; i++) {
    const target = targetTokens[i];
    let bestMatchIndex = -1;
    let bestSimilarity = 0;

    // Look ahead in spoken tokens within a flexible window (up to +4 tokens)
    const windowEnd = Math.min(spokenTokens.length, spokenIndex + 5);
    for (let j = spokenIndex; j < windowEnd; j++) {
      const sim = wordSimilarity(target.clean, spokenTokens[j].clean);
      if (sim > bestSimilarity) {
        bestSimilarity = sim;
        bestMatchIndex = j;
      }
      if (sim === 1) break; // Exact match found
    }

    if (bestSimilarity === 1) {
      // Exact Match
      resultTokens.push({
        word: target.raw,
        cleanWord: target.clean,
        status: 'matched',
        spokenWord: spokenTokens[bestMatchIndex].clean,
        similarity: 1,
      });
      matchedCount++;
      weightedPoints += 1.0;
      spokenIndex = bestMatchIndex + 1;
    } else if (bestSimilarity >= 0.70 || (target.clean.length >= 4 && bestSimilarity >= 0.65)) {
      // Near Match (slight pronunciation blur, suffix difference, or tense variation)
      resultTokens.push({
        word: target.raw,
        cleanWord: target.clean,
        status: 'near',
        spokenWord: spokenTokens[bestMatchIndex].clean,
        similarity: bestSimilarity,
      });
      weightedPoints += 0.70;
      spokenIndex = bestMatchIndex + 1;
    } else {
      // Missing (word skipped or significantly mispronounced)
      resultTokens.push({
        word: target.raw,
        cleanWord: target.clean,
        status: 'missing',
        similarity: 0,
      });
    }
  }

  // Calculate raw percentage score
  let score = Math.round((weightedPoints / targetTokens.length) * 100);

  // Mild penalty if spoken words had excessive extra gibberish (> 1.5x length)
  if (spokenTokens.length > targetTokens.length + 3) {
    const penalty = Math.min(15, (spokenTokens.length - targetTokens.length) * 3);
    score = Math.max(10, score - penalty);
  }

  score = Math.min(100, Math.max(0, score));

  // Determine Rating & Status Label
  let rating: PronunciationRating;
  let statusLabel: string;

  if (score >= 90) {
    rating = 'excellent';
    statusLabel = '🌟 ยอดเยี่ยม! ออกเสียงได้ชัดเจนและเป็นธรรมชาติมาก';
  } else if (score >= 75) {
    rating = 'good';
    statusLabel = '👍 ชัดเจนดีมาก! เข้าใจความหมายได้ครบถ้วน';
  } else if (score >= 50) {
    rating = 'fair';
    statusLabel = '💪 ออกเสียงได้ดีในหลายคำ ลองฝึกเน้นคำที่มีเครื่องหมายเตือนอีกนิด';
  } else {
    rating = 'retry';
    statusLabel = '🔄 ยังมีหลายคำที่ตกหล่น ลองกดฟังเสียงต้นแบบแล้วฝึกพูดใหม่อีกครั้ง';
  }

  // Extract problem words for AI Coach practice
  const problemWords = resultTokens
    .filter((t) => t.status === 'missing' || t.status === 'near')
    .map((t) => t.cleanWord);

  return {
    score,
    rating,
    statusLabel,
    matchedCount,
    totalTargetCount: targetTokens.length,
    tokens: resultTokens,
    problemWords,
    spokenTranscript,
    targetSentence,
  };
}

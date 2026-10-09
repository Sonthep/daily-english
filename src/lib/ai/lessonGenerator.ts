import { Lesson, LearningResource, LessonGenerationOptions, LessonSentence, LessonPrompt, TargetPhrase } from '../../types';

/**
 * Builds a local lesson from sentences and phrases already saved on a resource.
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
        category: 'Custom',
      }))
    : selectedSentences.slice(0, 3).map((s, idx) => {
        const words = s.en.split(' ').slice(0, 3).join(' ');
        return {
          id: `custom-p-${idx + 1}-${Date.now()}`,
          en: words,
          th: s.th,
          example: s.en,
          category: 'Custom',
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
    id: `lesson-resource-${Date.now()}`,
    titleTh: `ฝึกบทเรียนจาก: ${resource.title}`,
    titleEn: `Practice from: ${resource.title}`,
    category: 'Custom',
    objectiveTh: `ฝึกฟัง จับใจความ และออกเสียงสำนวนสำคัญจาก ${resource.title} อย่างมั่นใจ`,
    sentences: selectedSentences,
    prompts: [prompt],
    targetPhrases,
    createdAt: new Date().toISOString(),
    isCustom: true,
    sourceResourceId: resource.id,
  };
}

/**
 * Parses a generated lesson response into a strict Lesson model.
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
    console.warn('[Lesson Generator] Malformed generated lesson, using local resource content', err);
    return generateHeuristicLesson(resource, options);
  }
}

/**
 * Creates a local lesson from a saved learning resource.
 */
export async function generateLessonFromResource(
  resource: LearningResource,
  options: LessonGenerationOptions = { targetDurationMinutes: 5 }
): Promise<Lesson> {
  return generateHeuristicLesson(resource, options);
}

function normalizeTokens(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9']+/g, ' ').trim().split(/\s+/).filter(Boolean);
}

function includesWord(text: string, word: string): boolean {
  const tokens = normalizeTokens(text);
  const expected = normalizeTokens(word);
  return expected.length > 0 && tokens.some((_, index) =>
    expected.every((token, offset) => tokens[index + offset] === token)
  );
}

export function parseGeminiWordLessonResponse(
  rawText: string,
  selectedWords: string[],
  focus: string,
  targetDurationMinutes: 5 | 15
): Lesson {
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    throw new Error('อ่านข้อมูลบทเรียนไม่สำเร็จ กรุณาลองอีกครั้ง');
  }

  const sentences = Array.isArray(parsed.sentences) ? parsed.sentences : [];
  const prompts = Array.isArray(parsed.prompts) ? parsed.prompts : [];
  const phrases = Array.isArray(parsed.targetPhrases) ? parsed.targetPhrases : [];
  const expectedPromptCount = targetDurationMinutes === 5 ? 1 : 2;
  if (sentences.length < 3 || prompts.length !== expectedPromptCount || phrases.length !== selectedWords.length) {
    throw new Error('บทเรียนที่สร้างมายังมีเนื้อหาไม่ครบ กรุณาลองสร้างใหม่');
  }

  const lessonSentences = sentences.slice(0, 3).map((item, index) => {
    const sentence = item as Record<string, unknown>;
    const en = typeof sentence.en === 'string' ? sentence.en.trim() : '';
    const th = typeof sentence.th === 'string' ? sentence.th.trim() : '';
    if (!en || !th) throw new Error('บทเรียนที่สร้างมามีประโยคหรือคำแปลไม่ครบ กรุณาลองสร้างใหม่');
    return { id: `word-s-${index + 1}-${Date.now()}`, en, th };
  });

  const lessonPrompts = prompts.map((item, index) => {
    const prompt = item as Record<string, unknown>;
    const questionEn = typeof prompt.questionEn === 'string' ? prompt.questionEn.trim() : '';
    const questionTh = typeof prompt.questionTh === 'string' ? prompt.questionTh.trim() : '';
    const sampleAnswer = typeof prompt.sampleAnswer === 'string' ? prompt.sampleAnswer.trim() : '';
    if (!questionEn || !questionTh || !sampleAnswer) {
      throw new Error('คำถามในบทเรียนยังไม่ครบ กรุณาลองสร้างใหม่');
    }
    return { id: `word-prompt-${index + 1}-${Date.now()}`, questionEn, questionTh, sampleAnswer };
  });

  const targetPhrases = phrases.map((item, index) => {
    const phrase = item as Record<string, unknown>;
    const en = typeof phrase.en === 'string' ? phrase.en.trim() : '';
    const th = typeof phrase.th === 'string' ? phrase.th.trim() : '';
    const example = typeof phrase.example === 'string' ? phrase.example.trim() : '';
    if (!en || !th || !example) throw new Error('วลีเป้าหมายยังไม่ครบ กรุณาลองสร้างใหม่');
    return { id: `word-phrase-${index + 1}-${Date.now()}`, en, th, example, category: focus };
  });

  const sentenceText = lessonSentences.map((sentence) => sentence.en).join(' ');
  const phraseText = targetPhrases.map((phrase) => phrase.en).join(' ');
  if (selectedWords.some((word) => !includesWord(sentenceText, word) || !includesWord(phraseText, word))) {
    throw new Error('บทเรียนที่สร้างมาใช้คำที่เลือกไม่ครบ กรุณาลองสร้างใหม่');
  }

  const titleTh = typeof parsed.titleTh === 'string' ? parsed.titleTh.trim() : '';
  const titleEn = typeof parsed.titleEn === 'string' ? parsed.titleEn.trim() : '';
  const objectiveTh = typeof parsed.objectiveTh === 'string' ? parsed.objectiveTh.trim() : '';
  if (!titleTh || !titleEn || !objectiveTh) {
    throw new Error('ข้อมูลบทเรียนยังไม่ครบ กรุณาลองสร้างใหม่');
  }

  return {
    id: `lesson-words-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    titleTh,
    titleEn,
    category: 'Custom',
    objectiveTh,
    sentences: lessonSentences,
    prompts: lessonPrompts,
    targetPhrases,
    createdAt: new Date().toISOString(),
    isAiGenerated: true,
  };
}

export async function generateLessonFromWords(
  selectedWords: string[],
  options: LessonGenerationOptions,
  focus: string
): Promise<Lesson> {
  const words = [...new Set(selectedWords.map((word) => word.trim().toLowerCase()).filter(Boolean))];
  if (words.length < 3 || words.length > 5) {
    throw new Error('เลือกคำไม่ถูกต้อง กรุณาเลือก 3 ถึง 5 คำ');
  }
  if (options.targetDurationMinutes === 5 && words.length !== 3) {
    throw new Error('โหมด 5 นาทีใช้คำที่เลือก 3 คำพอดี หรือเปลี่ยนเป็นโหมด 15 นาที');
  }

  const category: Lesson['category'] = focus === 'Design & Marketing'
    ? 'Design & Marketing'
    : focus === 'Gaming'
      ? 'Gaming'
      : 'Daily Life';
  const sentences: LessonSentence[] = words.slice(0, 3).map((word, index) => ({
    id: `word-local-s${index + 1}-${Date.now()}`,
    en: `I want to use the word "${word}" when I talk about ${focus}.`,
    th: `ฉันอยากใช้คำว่า "${word}" เมื่อต้องพูดเกี่ยวกับ${focus}`,
  }));
  const targetPhrases: TargetPhrase[] = words.map((word, index) => ({
    id: `word-local-p${index + 1}-${Date.now()}`,
    en: word,
    th: 'ลองนึกความหมายของคำนี้ด้วยตัวเอง',
    example: sentences[index % sentences.length].en,
    category,
  }));
  const prompts: LessonPrompt[] = Array.from(
    { length: options.targetDurationMinutes === 5 ? 1 : 2 },
    (_, index) => ({
      id: `word-local-prompt${index + 1}-${Date.now()}`,
      questionEn: `How could you use "${words[index % words.length]}" in a conversation about ${focus}?`,
      questionTh: `คุณจะใช้คำว่า "${words[index % words.length]}" ในบทสนทนาเกี่ยวกับ${focus} ได้อย่างไร?`,
      sampleAnswer: `I can use "${words[index % words.length]}" when I talk about ${focus}.`,
    })
  );

  return {
    id: `lesson-words-local-${Date.now()}`,
    titleTh: `ฝึกคำศัพท์: ${words.join(', ')}`,
    titleEn: `Practice these words: ${words.join(', ')}`,
    category,
    objectiveTh: `ฝึกนำคำศัพท์ที่เลือกไปใช้ในบริบท ${focus} ด้วยประโยคของตัวเอง`,
    sentences,
    prompts,
    targetPhrases,
    createdAt: new Date().toISOString(),
    isCustom: true,
  };
}

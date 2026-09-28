import React, { useEffect, useState } from 'react';
import { AlertCircle, BookOpen, Clock, Play, RefreshCw, Sparkles } from 'lucide-react';
import { Lesson } from '../../types';
import { generateLessonFromWords } from '../../lib/ai/lessonGenerator';
import { getStoredGeminiApiKey } from '../../lib/ai/geminiProvider';
import { lessonRepo } from '../../lib/storage/repositories';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';

export interface CommonWordsLessonModalProps {
  isOpen: boolean;
  words: string[];
  onClose: () => void;
  onConfigureAI: () => void;
  onLessonCreated: (lesson: Lesson, durationMinutes: 5 | 15, startImmediately: boolean) => void;
}

const focusOptions = [
  { value: 'Daily Life', label: 'ชีวิตประจำวัน' },
  { value: 'Design & Marketing', label: 'งานออกแบบและการตลาด' },
  { value: 'Gaming', label: 'เกมและการเล่นเป็นทีม' },
];

export const CommonWordsLessonModal: React.FC<CommonWordsLessonModalProps> = ({
  isOpen,
  words,
  onClose,
  onConfigureAI,
  onLessonCreated,
}) => {
  const [targetDuration, setTargetDuration] = useState<5 | 15>(words.length === 3 ? 5 : 15);
  const [focus, setFocus] = useState('Daily Life');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedLesson, setGeneratedLesson] = useState<Lesson | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasApiKey = Boolean(getStoredGeminiApiKey());
  const durationIsValid = targetDuration === 15 || words.length === 3;

  useEffect(() => {
    if (isOpen) {
      setTargetDuration(words.length === 3 ? 5 : 15);
      setFocus('Daily Life');
      setGeneratedLesson(null);
      setErrorMessage(null);
    }
  }, [isOpen, words]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const lesson = await generateLessonFromWords(
        words,
        { targetDurationMinutes: targetDuration, customFocus: focus },
        focus
      );
      setGeneratedLesson(lesson);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'สร้างบทเรียนไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async (startImmediately: boolean) => {
    if (!generatedLesson) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await lessonRepo.saveLesson(generatedLesson);
      onLessonCreated(generatedLesson, targetDuration, startImmediately);
    } catch {
      setErrorMessage('บันทึกบทเรียนไม่สำเร็จ กรุณาลองอีกครั้ง');
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="สร้างบทเรียนจากคำที่เลือก"
      description="Gemini จะนำคำไปสร้างประโยคและโจทย์ฝึก คุณตรวจเนื้อหาก่อนบันทึกได้"
      maxWidth="760px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {errorMessage && (
          <div role="alert" style={{ display: 'flex', gap: 'var(--space-sm)', padding: 'var(--space-md)', borderRadius: 'var(--radius-control)', backgroundColor: 'var(--color-error-soft)', color: 'var(--color-error)' }}>
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {!generatedLesson ? (
          <>
            <Card padding="md" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <strong>คำเป้าหมาย {words.length} คำ</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                {words.map((word) => <Badge key={word} variant="primary">{word}</Badge>)}
              </div>
            </Card>

            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>เวลาเรียน</legend>
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                {([5, 15] as const).map((minutes) => (
                  <Button
                    key={minutes}
                    type="button"
                    variant={targetDuration === minutes ? 'primary' : 'outline'}
                    aria-pressed={targetDuration === minutes}
                    disabled={minutes === 5 && words.length !== 3}
                    onClick={() => setTargetDuration(minutes)}
                  >
                    <Clock size={16} /> {minutes} นาที
                  </Button>
                ))}
              </div>
              {words.length !== 3 && (
                <span className="muted" style={{ display: 'block', marginTop: 'var(--space-sm)', fontSize: 'var(--font-size-xs)' }}>
                  โหมด 5 นาทีใช้ 3 คำพอดี; ชุดนี้ใช้โหมด 15 นาทีเพื่อฝึกครบทุกคำ
                </span>
              )}
            </fieldset>

            <div>
              <label htmlFor="word-lesson-focus" style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 'var(--space-xs)' }}>
                บริบทการฝึก
              </label>
              <select
                id="word-lesson-focus"
                value={focus}
                onChange={(event) => setFocus(event.target.value)}
                style={{ width: '100%', minHeight: '44px', padding: 'var(--space-sm) var(--space-md)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', background: 'var(--color-surface)' }}
              >
                {focusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>

            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              คำที่เลือกและบริบทจะถูกส่งไปยัง Google Gemini เพื่อสร้างบทเรียน ตรวจคำแปลและตัวอย่างก่อนนำไปฝึก
            </p>

            {!hasApiKey ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                <span className="muted">ต้องตั้งค่า Gemini API Key ก่อน จึงจะสร้างบทเรียนได้</span>
                <Button variant="outline" onClick={onConfigureAI}>ไปตั้งค่า AI</Button>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)' }}>
                <Button variant="outline" onClick={onClose} disabled={isGenerating}>ยกเลิก</Button>
                <Button onClick={handleGenerate} disabled={!durationIsValid || isGenerating || isSaving}>
                  {isGenerating ? <><RefreshCw size={16} /> กำลังสร้าง...</> : <><Sparkles size={16} /> สร้างตัวอย่างบทเรียน</>}
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <Card padding="md" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', backgroundColor: 'var(--color-primary-soft)' }}>
              <Badge variant="primary">บทเรียนสร้างด้วย AI · {focusOptions.find((option) => option.value === focus)?.label}</Badge>
              <h3>{generatedLesson.titleTh}</h3>
              <span className="muted">{generatedLesson.titleEn}</span>
              <p style={{ margin: 0 }}>{generatedLesson.objectiveTh}</p>
            </Card>

            <section aria-label="ตัวอย่างประโยค">
              <h3 style={{ fontSize: 'var(--font-size-base)', marginBottom: 'var(--space-sm)' }}>ประโยคฝึก</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 'var(--space-sm)' }}>
                {generatedLesson.sentences.map((sentence) => (
                  <Card key={sentence.id} padding="sm">
                    <strong>{sentence.en}</strong>
                    <p className="muted" style={{ margin: 'var(--space-xs) 0 0' }}>{sentence.th}</p>
                  </Card>
                ))}
              </div>
            </section>

            <section aria-label="วลีเป้าหมาย">
              <h3 style={{ fontSize: 'var(--font-size-base)', marginBottom: 'var(--space-sm)' }}>วลีเป้าหมาย</h3>
              <ul style={{ paddingLeft: 'var(--space-lg)', display: 'grid', gap: 'var(--space-xs)' }}>
                {generatedLesson.targetPhrases.map((phrase) => (
                  <li key={phrase.id}><strong>{phrase.en}</strong> · {phrase.th}</li>
                ))}
              </ul>
            </section>

            <section aria-label="โจทย์ฝึกใช้ภาษา">
              <h3 style={{ fontSize: 'var(--font-size-base)', marginBottom: 'var(--space-sm)' }}>โจทย์ลองใช้</h3>
              {generatedLesson.prompts.map((prompt) => (
                <Card key={prompt.id} padding="sm" style={{ marginBottom: 'var(--space-sm)' }}>
                  <strong>{prompt.questionEn}</strong>
                  <p className="muted" style={{ margin: 'var(--space-xs) 0' }}>{prompt.questionTh}</p>
                  <span style={{ fontSize: 'var(--font-size-sm)' }}>ตัวอย่าง: {prompt.sampleAnswer}</span>
                </Card>
              ))}
            </section>

            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
              <Button variant="outline" onClick={() => { setGeneratedLesson(null); setErrorMessage(null); }} disabled={isSaving}>
                สร้างใหม่
              </Button>
              <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                <Button variant="outline" onClick={() => handleSave(false)} disabled={isSaving}>
                  <BookOpen size={16} /> บันทึกบทเรียน
                </Button>
                <Button onClick={() => handleSave(true)} disabled={isSaving}>
                  <Play size={16} /> เริ่มฝึก {targetDuration} นาที
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
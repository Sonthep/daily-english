import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Phrase } from '../../types';
import { phraseRepo } from '../../lib/storage/repositories';
import { createNewPhrase } from '../../lib/review/scheduler';
import { speechService } from '../../lib/audio/speech';
import { lookupWordWithGemini } from '../../lib/ai/geminiProvider';
import {
  Volume2,
  Sparkles,
  Check,
  Bookmark,
} from 'lucide-react';

export interface SaveWordModalProps {
  isOpen: boolean;
  initialWord?: string;
  initialExample?: string;
  contextSentence?: string;
  sourceResourceId?: string;
  defaultCategory?: string;
  onClose: () => void;
  onSaved: (phrase: Phrase) => void;
}

export const SaveWordModal: React.FC<SaveWordModalProps> = ({
  isOpen,
  initialWord = '',
  initialExample = '',
  contextSentence = '',
  sourceResourceId = null,
  defaultCategory = 'Vocabulary',
  onClose,
  onSaved,
}) => {
  const sentenceContext = initialExample || contextSentence || '';
  const [word, setWord] = useState(initialWord);
  const [th, setTh] = useState('');
  const [example, setExample] = useState(sentenceContext);
  const [category, setCategory] = useState(defaultCategory);
  const [partOfSpeech, setPartOfSpeech] = useState<string>('');
  const [phonetic, setPhonetic] = useState<string>('');

  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const clean = (initialWord || '').trim().replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
      const defaultEx = initialExample || contextSentence || '';
      setWord(clean);
      setExample(defaultEx);
      setCategory(defaultCategory || 'Vocabulary');
      setTh('');
      setPartOfSpeech('');
      setPhonetic('');
      setIsSavedSuccess(false);

      // Auto-lookup if a word was selected
      if (clean) {
        handleLookup(clean, defaultEx);
      }
    } else {
      speechService.stop();
    }
  }, [isOpen, initialWord, initialExample, contextSentence, defaultCategory]);

  const handleLookup = async (lookupWord: string, context?: string) => {
    if (!lookupWord.trim()) return;
    setIsLoadingAi(true);
    try {
      const res = await lookupWordWithGemini(lookupWord, context || example);
      if (res.th) setTh(res.th);
      if (res.partOfSpeech) setPartOfSpeech(res.partOfSpeech);
      if (res.phonetic) setPhonetic(res.phonetic);
      if (res.example && (!example || example.length < 5)) {
        setExample(res.example);
      }
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handlePlayWordSpeech = () => {
    if (!word.trim()) return;
    speechService.stop();
    setIsPlayingAudio(true);
    speechService.speak(
      word.trim(),
      1.0,
      () => setIsPlayingAudio(false),
      () => setIsPlayingAudio(false)
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanWord = word.trim();
    const cleanTh = th.trim();
    if (!cleanWord || !cleanTh) return;

    const newPhrase = createNewPhrase(
      cleanWord,
      cleanTh,
      example.trim() || cleanWord,
      category.trim() || 'Vocabulary',
      sourceResourceId || null
    );

    await phraseRepo.savePhrase(newPhrase);
    setIsSavedSuccess(true);
    onSaved(newPhrase);

    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="เก็บคำศัพท์สำหรับทำ Flashcard"
      maxWidth="540px"
    >
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {/* Word Input & Audio Playback */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px' }}>
            คำศัพท์หรือสำนวน (English Word / Phrase) *
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              required
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="เช่น practice, talent, consistent..."
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--color-border)',
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--color-primary)',
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePlayWordSpeech}
              title="ฟังเสียงอ่านคำศัพท์"
              style={{ padding: '0 12px' }}
            >
              <Volume2 size={16} color={isPlayingAudio ? 'var(--color-primary)' : undefined} />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleLookup(word, example)}
              disabled={isLoadingAi || !word.trim()}
              title="ค้นหาความหมายและตัวอย่างด้วย AI"
              style={{ padding: '0 12px', fontSize: '12px' }}
            >
              <Sparkles size={14} />
              <span>{isLoadingAi ? 'กำลังค้นหา...' : 'AI แปล'}</span>
            </Button>
          </div>

          {(phonetic || partOfSpeech) && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '6px' }}>
              {partOfSpeech && (
                <Badge variant="neutral">
                  {partOfSpeech}
                </Badge>
              )}
              {phonetic && (
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                  {phonetic}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Thai Translation */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px' }}>
            คำแปลภาษาไทย (Thai Meaning) *
          </label>
          <input
            type="text"
            required
            value={th}
            onChange={(e) => setTh(e.target.value)}
            placeholder="เช่น ฝึกฝน, ลงมือปฏิบัติจริง..."
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--color-border)',
              fontSize: '14px',
            }}
          />
        </div>

        {/* Context Example Sentence */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>
              ประโยคตัวอย่างในคลิป (Context Example)
            </label>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              (จะแสดงเป็นคำใบ้ใน Flashcard)
            </span>
          </div>
          <textarea
            rows={2}
            value={example}
            onChange={(e) => setExample(e.target.value)}
            placeholder="เช่น If you want to speak good English, you have to practice every day."
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--color-border)',
              fontSize: '13px',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Category tag */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px' }}>
            หมวดหมู่ / แท็ก (Category)
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="เช่น Speaking, Inspiration, General..."
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--color-border)',
              fontSize: '13px',
            }}
          />
        </div>

        {/* Spaced Repetition Note */}
        <div
          style={{
            padding: '10px 12px',
            borderRadius: '6px',
            backgroundColor: '#F0F9F4',
            border: '1px solid #D1E5DA',
            fontSize: '12px',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Bookmark size={15} />
          <span>
            คำศัพท์นี้จะถูกจัดเข้าสู่ **Flashcard (Stage 0: คำศัพท์ใหม่)** พร้อมฝึกท่องทันที!
          </span>
        </div>

        {/* Footer Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
          <Button type="button" variant="ghost" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button type="submit" variant="primary" disabled={!word.trim() || !th.trim() || isSavedSuccess}>
            {isSavedSuccess ? (
              <>
                <Check size={16} /> บันทึกเรียบร้อย!
              </>
            ) : (
              <>
                <Bookmark size={16} /> บันทึกเข้า Flashcard
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

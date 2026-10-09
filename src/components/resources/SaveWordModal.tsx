import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Phrase } from '../../types';
import { phraseRepo } from '../../lib/storage/repositories';
import { createNewPhrase } from '../../lib/review/scheduler';
import { speechService } from '../../lib/audio/speech';
import { translateEnglishToThai } from '../../lib/translations/myMemory';
import { suggestPhraseGrammar } from '../../lib/phrases/organization';
import {
  Volume2,
  Check,
  Bookmark,
  Languages,
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
  defaultCategory = 'Other',
  onClose,
  onSaved,
}) => {
  const sentenceContext = initialExample || contextSentence || '';
  const [word, setWord] = useState(initialWord);
  const [th, setTh] = useState('');
  const [example, setExample] = useState(sentenceContext);
  const [category, setCategory] = useState(defaultCategory);
  const [tagsText, setTagsText] = useState('');
  const [organizationManuallyEdited, setOrganizationManuallyEdited] = useState(false);

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const clean = (initialWord || '').trim().replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
      const defaultEx = initialExample || contextSentence || '';
      setWord(clean);
      setExample(defaultEx);
      setCategory(defaultCategory || 'Vocabulary');
      setTagsText('');
      setOrganizationManuallyEdited(false);
      setTh('');
      setTranslationError(null);
      setIsSavedSuccess(false);
    } else {
      speechService.stop();
    }
  }, [isOpen, initialWord, initialExample, contextSentence, defaultCategory]);

  useEffect(() => {
    if (!isOpen || organizationManuallyEdited) return;
    const suggestion = suggestPhraseGrammar(word, example, defaultCategory);
    setCategory(suggestion.category);
    setTagsText(suggestion.tags.join(', '));
  }, [isOpen, word, example, defaultCategory, organizationManuallyEdited]);

  const handleTranslate = async () => {
    setIsTranslating(true);
    setTranslationError(null);
    try {
      setTh(await translateEnglishToThai(word));
    } catch (error) {
      setTranslationError(error instanceof Error ? error.message : 'แปลไม่สำเร็จ กรุณาลองอีกครั้ง');
    } finally {
      setIsTranslating(false);
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
    newPhrase.tags = [...new Set(tagsText.split(',').map((tag) => tag.trim()).filter(Boolean))];

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
          </div>
        </div>

        {/* Thai Translation */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>
              คำแปลภาษาไทย (Thai Meaning) *
            </label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleTranslate}
              disabled={!word.trim() || isTranslating}
            >
              <Languages size={14} /> {isTranslating ? 'กำลังแปล...' : 'แปลจาก MyMemory'}
            </Button>
          </div>
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
          {translationError && (
            <p role="alert" style={{ margin: '6px 0 0', color: 'var(--color-error)', fontSize: 'var(--font-size-xs)' }}>
              {translationError}
            </p>
          )}
          <p style={{ margin: '6px 0 0', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', lineHeight: 1.5 }}>
            เมื่อกดแปล คำหรือวลีนี้จะถูกส่งไป MyMemory; ผู้ให้บริการระบุว่าอาจเก็บข้อความที่ส่งไว้ และจำกัดการใช้ฟรี 5,000 ตัวอักษรต่อวัน
          </p>
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

        {/* Automatic category and editable tags */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px' }}>
            ชนิดคำ (POS)
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => {
              setOrganizationManuallyEdited(true);
              setCategory(e.target.value);
            }}
            placeholder="เช่น Noun, Verb, Adjective..."
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--color-border)',
              fontSize: '13px',
            }}
          />
        </div>

        <div>
          <label htmlFor="flashcard-tags" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px' }}>
            Tags ทางไวยากรณ์ (คั่นด้วย comma)
          </label>
          <input
            id="flashcard-tags"
            type="text"
            value={tagsText}
            onChange={(e) => {
              setOrganizationManuallyEdited(true);
              setTagsText(e.target.value);
            }}
            placeholder="เช่น singular, subject, present tense"
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

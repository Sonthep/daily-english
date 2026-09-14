import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Phrase, ReviewEvent } from '../../types';
import { phraseRepo, reviewRepo } from '../../lib/storage/repositories';
import { speechService } from '../../lib/audio/speech';
import { calculateNextReview, createReviewEvent } from '../../lib/review/scheduler';
import {
  Volume2,
  Check,
  RotateCcw,
  Eye,
  Award,
  Sparkles,
} from 'lucide-react';

export interface PhraseReviewModalProps {
  isOpen: boolean;
  phrases: Phrase[];
  onClose: () => void;
  onComplete: () => void;
}

export const PhraseReviewModal: React.FC<PhraseReviewModalProps> = ({
  isOpen,
  phrases,
  onClose,
  onComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [rememberedCount, setRememberedCount] = useState(0);
  const [againCount, setAgainCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Reset state when opening modal
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsFlipped(false);
      setRememberedCount(0);
      setAgainCount(0);
      setIsFinished(false);
    } else {
      speechService.stop();
    }
  }, [isOpen]);

  const currentPhrase = phrases[currentIndex];

  const handleReveal = () => {
    setIsFlipped(true);
    if (currentPhrase) {
      speechService.speak(currentPhrase.en);
    }
  };

  const handleAnswer = async (result: 'again' | 'remembered') => {
    if (!currentPhrase) return;

    const now = new Date();
    const calc = calculateNextReview(currentPhrase.reviewStage, result, now);

    // Update phrase in storage
    const updatedPhrase: Phrase = {
      ...currentPhrase,
      reviewStage: calc.nextStage,
      dueAt: calc.dueAt,
      updatedAt: now.toISOString(),
    };
    await phraseRepo.savePhrase(updatedPhrase);

    // Log review event
    const event: ReviewEvent = createReviewEvent(
      currentPhrase.id,
      result,
      currentPhrase.reviewStage,
      calc.nextStage,
      now
    );
    await reviewRepo.recordReviewEvent(event);

    if (result === 'remembered') {
      setRememberedCount((prev) => prev + 1);
    } else {
      setAgainCount((prev) => prev + 1);
    }

    // Move to next card or finish
    setIsFlipped(false);
    if (currentIndex + 1 < phrases.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#245C4F', '#E7F0EA', '#F7E8D7'],
        });
      } catch {
        // ignore
      }
    }
  };

  if (!isOpen) return null;

  if (phrases.length === 0) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="ทบทวนคำศัพท์ (Flashcard Review)"
        maxWidth="500px"
      >
        <div style={{ textAlign: 'center', padding: 'var(--space-lg) 0' }}>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)' }}>
            ยอดเยี่ยม! ไม่มีคำศัพท์ที่ครบกำหนดทบทวนในขณะนี้
          </p>
          <Button onClick={onClose}>ตกลง</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        speechService.stop();
        onClose();
        if (isFinished) onComplete();
      }}
      title="รอบทบทวนคำศัพท์ (Flashcard Review)"
      description={
        !isFinished
          ? `คำที่ ${currentIndex + 1} จาก ${phrases.length} คำ`
          : 'ผลลัพธ์รอบการทบทวน'
      }
      maxWidth="560px"
    >
      {!isFinished ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Progress Bar */}
          <div
            style={{
              height: '4px',
              backgroundColor: 'var(--color-border)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                backgroundColor: 'var(--color-primary)',
                width: `${((currentIndex + 1) / phrases.length) * 100}%`,
                transition: 'width 200ms ease',
              }}
            />
          </div>

          {/* Flashcard Box */}
          <div
            onClick={() => !isFlipped && handleReveal()}
            style={{
              minHeight: '220px',
              padding: 'var(--space-xl) var(--space-lg)',
              borderRadius: 'var(--radius-card)',
              backgroundColor: isFlipped ? '#F5FAF7' : '#FFFFFF',
              border: '2px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              cursor: !isFlipped ? 'pointer' : 'default',
              boxShadow: 'var(--shadow-card)',
              transition: 'all var(--transition-smooth)',
              gap: 'var(--space-md)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Badge variant="neutral">Stage {currentPhrase?.reviewStage ?? 0}</Badge>
              <Badge variant="primary">{currentPhrase?.category || 'General'}</Badge>
            </div>

            {/* Front: Thai Translation */}
            <div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                ความหมายภาษาไทย
              </span>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 600, color: 'var(--color-text)', marginTop: '4px' }}>
                {currentPhrase?.th}
              </div>
            </div>

            {/* Back: English & Example (Only shown after reveal) */}
            {isFlipped ? (
              <div style={{ borderTop: '1px dashed var(--color-border)', paddingTop: 'var(--space-md)', width: '100%' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 600 }}>
                  เฉลยวลีภาษาอังกฤษ:
                </span>
                <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-primary)', marginTop: '2px' }}>
                  {currentPhrase?.en}
                </div>

                {currentPhrase?.example && (
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: '6px', fontStyle: 'italic' }}>
                    "{currentPhrase.example}"
                  </div>
                )}

                <div style={{ marginTop: '10px' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (currentPhrase) speechService.speak(currentPhrase.en);
                    }}
                  >
                    <Volume2 size={16} /> ฟังเสียงอ่าน
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReveal();
                }}
              >
                <Eye size={16} /> เปิดดูเฉลย
              </Button>
            )}
          </div>

          {/* Action Outcome Buttons */}
          {isFlipped ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Button
                variant="danger"
                size="lg"
                onClick={() => handleAnswer('again')}
              >
                <RotateCcw size={18} />
                <span>ยังจำไม่ได้ (Stage 0)</span>
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => handleAnswer('remembered')}
              >
                <Check size={18} />
                <span>จำได้แล้ว (เลื่อนขั้น)</span>
              </Button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
              * ลองนึกคำในใจก่อนกดเปิดเฉลย
            </div>
          )}
        </div>
      ) : (
        /* Summary Celebration Screen */
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-md) 0' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary-soft)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Award size={32} />
          </div>

          <Badge variant="success" icon={<Sparkles size={13} />}>
            ทบทวนเสร็จสิ้น
          </Badge>

          <h3 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--color-text)' }}>
            จบรอบทบทวนคำศัพท์เรียบร้อยแล้ว!
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              width: '100%',
              padding: '12px',
              borderRadius: 'var(--radius-control)',
              backgroundColor: '#FAFCFA',
              border: '1px solid var(--color-border)',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>จำได้แล้ว</div>
              <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-primary)' }}>
                {rememberedCount} คำ
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>ต้องทบทวนอีกครั้ง</div>
              <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: '#B42318' }}>
                {againCount} คำ
              </div>
            </div>
          </div>

          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
            ระบบได้ปรับรอบนัดหมาย Spaced Repetition ให้สอดคล้องกับความจำของคุณแล้ว
          </p>

          <Button
            size="lg"
            fullWidth
            onClick={() => {
              onClose();
              onComplete();
            }}
          >
            เสร็จสิ้นและกลับสู่คลังคำศัพท์
          </Button>
        </div>
      )}
    </Modal>
  );
};

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { LearningResource, Lesson } from '../../types';
import { generateLessonFromResource } from '../../lib/ai/lessonGenerator';
import { lessonRepo } from '../../lib/storage/repositories';
import { Sparkles, Clock, Play, BookOpen, AlertCircle, RefreshCw } from 'lucide-react';

export interface GenerateLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: LearningResource;
  onLessonCreated: (lesson: Lesson, startImmediately: boolean) => void;
}

export const GenerateLessonModal: React.FC<GenerateLessonModalProps> = ({
  isOpen,
  onClose,
  resource,
  onLessonCreated,
}) => {
  const [targetDuration, setTargetDuration] = useState<5 | 15>(5);
  const [customFocus, setCustomFocus] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedLesson, setGeneratedLesson] = useState<Lesson | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const lesson = await generateLessonFromResource(resource, {
        targetDurationMinutes: targetDuration,
        customFocus: customFocus.trim() || undefined,
      });

      setGeneratedLesson(lesson);
    } catch (err: unknown) {
      console.error('Failed to generate lesson', err);
      setErrorMsg('เกิดข้อผิดพลาดในการสร้างบทเรียน กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAndStart = async (startImmediately: boolean) => {
    if (!generatedLesson) return;
    setIsSaving(true);
    try {
      await lessonRepo.saveLesson(generatedLesson);
      onLessonCreated(generatedLesson, startImmediately);
      handleClose();
    } catch (err) {
      console.error('Failed to save lesson', err);
      setErrorMsg('ไม่สามารถบันทึกบทเรียนลงฐานข้อมูลได้');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setGeneratedLesson(null);
    setErrorMsg(null);
    setIsGenerating(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="✨ สร้างบทเรียน 5 สเต็ปด้วย AI"
      description={`แปลงเนื้อหาจาก "${resource.title}" ให้เป็นบทเรียนฝึกฟัง พูด และทบทวนภาษาอังกฤษแบบครบวงจร`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {errorMsg && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-control)',
              backgroundColor: '#FDF0EE',
              border: '1px solid #F5C6CB',
              color: 'var(--color-error)',
              fontSize: 'var(--font-size-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {!generatedLesson ? (
          /* Step 1: Configuration Form */
          <>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                  marginBottom: '8px',
                  color: 'var(--color-text)',
                }}
              >
                เลือกระยะเวลาฝึกที่ต้องการ
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setTargetDuration(5)}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-control)',
                    border: targetDuration === 5 ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    backgroundColor: targetDuration === 5 ? '#EFF5F2' : 'var(--color-surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--color-text)' }}>
                    <Clock size={16} color="var(--color-primary)" />
                    <span>โหมดสั้น 5 นาที</span>
                  </div>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                    คัด 3–4 ประโยคสำคัญ กระชับ ตรงจุด
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetDuration(15)}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-control)',
                    border: targetDuration === 15 ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    backgroundColor: targetDuration === 15 ? '#EFF5F2' : 'var(--color-surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--color-text)' }}>
                    <Clock size={16} color="var(--color-primary)" />
                    <span>โหมดเจาะลึก 15 นาที</span>
                  </div>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                    คัด 5–6 ประโยค พร้อมคำถามขยายความ
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="custom-focus"
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                  marginBottom: '6px',
                  color: 'var(--color-text)',
                }}
              >
                จุดเน้นเพิ่มเติม (ไม่บังคับ)
              </label>
              <input
                id="custom-focus"
                type="text"
                placeholder="เช่น เน้นคำศัพท์เกี่ยวกับการทำงาน, สำเนียงธรรมชาติ..."
                value={customFocus}
                onChange={(e) => setCustomFocus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-control)',
                  border: '1px solid var(--color-border)',
                  outline: 'none',
                  fontSize: 'var(--font-size-sm)',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: 'var(--space-sm)' }}>
              <Button variant="ghost" onClick={handleClose} disabled={isGenerating}>
                ยกเลิก
              </Button>
              <Button variant="primary" onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <RefreshCw size={16} className="spin-animation" />
                    <span>กำลังสร้างบทเรียน...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>สร้างบทเรียน AI ทันที</span>
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          /* Step 2: Lesson Preview & Save */
          <>
            <div
              style={{
                padding: '14px',
                borderRadius: 'var(--radius-control)',
                backgroundColor: '#EFF5F2',
                border: '1px solid rgba(36, 92, 79, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Badge variant="primary">AI Generated Lesson</Badge>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                  {generatedLesson.sentences.length} ประโยค • {generatedLesson.targetPhrases.length} วลีสำคัญ
                </span>
              </div>

              <div>
                <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-text)' }}>
                  {generatedLesson.titleTh}
                </h3>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                  {generatedLesson.titleEn}
                </div>
              </div>

              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)', fontWeight: 500 }}>
                🎯 เป้าหมาย: {generatedLesson.objectiveTh}
              </div>
            </div>

            {/* Sentences Preview */}
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                ตัวอย่างประโยคในบทเรียน:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                {generatedLesson.sentences.map((s, idx) => (
                  <div
                    key={s.id || idx}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-control)',
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      fontSize: 'var(--font-size-xs)',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{s.en}</div>
                    <div style={{ color: 'var(--color-text-muted)', marginTop: '2px' }}>{s.th}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '10px', marginTop: 'var(--space-sm)' }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setGeneratedLesson(null)}
                disabled={isSaving}
              >
                <RefreshCw size={14} /> สร้างใหม่
              </Button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSaveAndStart(false)}
                  disabled={isSaving}
                >
                  <BookOpen size={15} /> บันทึกลงคลังบทเรียน
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleSaveAndStart(true)}
                  disabled={isSaving}
                >
                  <Play size={15} /> เริ่มฝึกทันที
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

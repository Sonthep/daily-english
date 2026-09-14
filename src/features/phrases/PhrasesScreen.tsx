import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Toast } from '../../components/ui/Toast';
import { EmptyState } from '../../components/ui/EmptyState';
import { Phrase } from '../../types';
import { phraseRepo } from '../../lib/storage/repositories';
import { speechService } from '../../lib/audio/speech';
import { createNewPhrase } from '../../lib/review/scheduler';
import { PhraseReviewModal } from './PhraseReviewModal';
import {
  Search,
  Plus,
  Volume2,
  Bookmark,
  Trash2,
  Edit2,
  Clock,
  RotateCcw,
} from 'lucide-react';

export const PhrasesScreen: React.FC = () => {
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'due' | 'category'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPhrase, setEditingPhrase] = useState<Phrase | null>(null);
  const [formEn, setFormEn] = useState('');
  const [formTh, setFormTh] = useState('');
  const [formExample, setFormExample] = useState('');
  const [formCategory, setFormCategory] = useState('General');

  // Delete & Undo State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [recentlyDeleted, setRecentlyDeleted] = useState<Phrase | null>(null);
  const [deleteConfirmPhrase, setDeleteConfirmPhrase] = useState<Phrase | null>(null);

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const loadPhrases = async () => {
    setIsLoading(true);
    try {
      const all = await phraseRepo.getAllPhrases();
      setPhrases(all);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPhrases();
  }, []);

  const handleOpenAdd = () => {
    setEditingPhrase(null);
    setFormEn('');
    setFormTh('');
    setFormExample('');
    setFormCategory('General');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (phrase: Phrase) => {
    setEditingPhrase(phrase);
    setFormEn(phrase.en);
    setFormTh(phrase.th);
    setFormExample(phrase.example);
    setFormCategory(phrase.category);
    setIsModalOpen(true);
  };

  const handleSavePhrase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEn.trim() || !formTh.trim()) return;

    if (editingPhrase) {
      const updated: Phrase = {
        ...editingPhrase,
        en: formEn.trim(),
        th: formTh.trim(),
        example: formExample.trim(),
        category: formCategory,
        updatedAt: new Date().toISOString(),
      };
      await phraseRepo.savePhrase(updated);
    } else {
      const created = createNewPhrase(
        formEn,
        formTh,
        formExample,
        formCategory,
        null
      );
      await phraseRepo.savePhrase(created);
    }

    setIsModalOpen(false);
    await loadPhrases();
  };

  const handleDelete = async (phrase: Phrase) => {
    await phraseRepo.deletePhrase(phrase.id);
    setRecentlyDeleted(phrase);
    setToastMessage(`ลบ "${phrase.en}" เรียบร้อยแล้ว`);
    setDeleteConfirmPhrase(null);
    await loadPhrases();

    // Auto dismiss undo after 5 seconds
    setTimeout(() => {
      setRecentlyDeleted(null);
      setToastMessage(null);
    }, 5000);
  };

  const handleUndoDelete = async () => {
    if (recentlyDeleted) {
      await phraseRepo.savePhrase(recentlyDeleted);
      setRecentlyDeleted(null);
      setToastMessage(null);
      await loadPhrases();
    }
  };

  const handleSpeak = (text: string) => {
    speechService.speak(text);
  };

  // Filter logic
  const nowTime = Date.now();
  const filteredPhrases = phrases.filter((p) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      query === '' ||
      p.en.toLowerCase().includes(query) ||
      p.th.toLowerCase().includes(query) ||
      p.example.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (filterType === 'due') {
      return new Date(p.dueAt).getTime() <= nowTime;
    }

    if (filterType === 'category' && selectedCategory !== 'All') {
      return p.category === selectedCategory;
    }

    return true;
  });

  const dueCount = phrases.filter((p) => new Date(p.dueAt).getTime() <= nowTime).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-md)',
        }}
      >
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-text)', marginBottom: '4px' }}>
            คลังคำศัพท์และวลี (My Phrases)
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-base)' }}>
            รวมวลีที่เก็บจากบทเรียนและคำศัพท์ที่คุณเพิ่มเอง พร้อมระบบนัดทบทวน
          </p>
        </div>

        <Button onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>เพิ่มวลีใหม่</span>
        </Button>
      </div>

      {/* Due Phrases Review Banner */}
      {dueCount > 0 && (
        <Card
          padding="md"
          style={{
            backgroundColor: '#FAF7F2',
            border: '1.5px solid #F5E0C3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-accent-soft)',
                color: '#7D4F1E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Clock size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 'var(--font-size-base)', color: '#7D4F1E' }}>
                มีคำศัพท์ {dueCount} คำ ครบกำหนดทบทวนในวันนี้
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                ทบทวนสั้นๆ ผ่าน Flashcard เพื่อย้ายคำศัพท์เข้าสู่ความจำระยะยาว (Spaced Repetition)
              </div>
            </div>
          </div>

          <Button
            size="md"
            onClick={() => setIsReviewModalOpen(true)}
            style={{ backgroundColor: '#7D4F1E', borderColor: '#7D4F1E', color: '#FFFFFF' }}
          >
            <RotateCcw size={16} /> เริ่มรอบทบทวน Flashcard
          </Button>
        </Card>
      )}

      {/* Search and Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={18}
            color="var(--color-text-muted)"
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาวลีภาษาอังกฤษ, คำแปลไทย หรือตัวอย่าง..."
            style={{
              width: '100%',
              padding: '12px 14px 12px 42px',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--color-border)',
              backgroundColor: '#FFFFFF',
              outline: 'none',
              fontSize: 'var(--font-size-base)',
            }}
          />
        </div>

        {/* Filter Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button
            onClick={() => {
              setFilterType('all');
              setSelectedCategory('All');
            }}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-badge)',
              border: filterType === 'all' ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
              backgroundColor: filterType === 'all' ? 'var(--color-primary)' : '#FFFFFF',
              color: filterType === 'all' ? '#FFFFFF' : 'var(--color-text-muted)',
              fontSize: 'var(--font-size-sm)',
              cursor: 'pointer',
            }}
          >
            ทั้งหมด ({phrases.length})
          </button>

          <button
            onClick={() => setFilterType('due')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-badge)',
              border: filterType === 'due' ? '1px solid #7D4F1E' : '1px solid var(--color-border)',
              backgroundColor: filterType === 'due' ? 'var(--color-accent-soft)' : '#FFFFFF',
              color: filterType === 'due' ? '#7D4F1E' : 'var(--color-text-muted)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: filterType === 'due' ? 600 : 400,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Clock size={14} />
            <span>ถึงกำหนดทบทวน ({dueCount})</span>
          </button>
        </div>
      </div>

      {/* Phrases Grid */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-2xl) 0', color: 'var(--color-text-muted)' }}>
          กำลังโหลดคลังคำศัพท์...
        </div>
      ) : filteredPhrases.length === 0 ? (
        <EmptyState
          icon={<Bookmark size={24} />}
          title={searchQuery || filterType === 'due' ? 'ไม่พบวลีที่ตรงกับเงื่อนไข' : 'ยังไม่มีวลีในคลัง'}
          description={
            searchQuery || filterType === 'due'
              ? 'ลองปรับคำค้นหา หรือเลือกดูวลีทั้งหมดดูครับ'
              : 'เมื่อคุณฝึกบทเรียนและทบทวน หรือกดปุ่ม "เพิ่มวลีใหม่" วลีจะมาปรากฏที่นี่'
          }
          actionLabel={searchQuery || filterType === 'due' ? 'ดูวลีทั้งหมด' : 'เพิ่มวลีแรก'}
          onAction={() => {
            if (searchQuery || filterType === 'due') {
              setSearchQuery('');
              setFilterType('all');
            } else {
              handleOpenAdd();
            }
          }}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--space-md)',
          }}
        >
          {filteredPhrases.map((p) => {
            const isDue = new Date(p.dueAt).getTime() <= nowTime;

            return (
              <Card
                key={p.id}
                padding="md"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 'var(--space-sm)',
                  backgroundColor: isDue ? '#FFFDF8' : 'var(--color-surface)',
                  border: isDue ? '1.5px solid #F5E0C3' : '1px solid var(--color-border)',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '6px',
                    }}
                  >
                    <Badge variant={isDue ? 'accent' : 'neutral'}>
                      {isDue ? 'ถึงกำหนดทบทวน' : `Stage ${p.reviewStage}`}
                    </Badge>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {p.category}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--color-text)' }}>
                      {p.en}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSpeak(p.en)}
                      style={{ padding: '6px', minHeight: '32px', flexShrink: 0 }}
                      title="ฟังเสียงอ่าน"
                    >
                      <Volume2 size={16} color="var(--color-primary)" />
                    </Button>
                  </div>

                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    {p.th}
                  </div>

                  {p.example && (
                    <div
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-muted)',
                        fontStyle: 'italic',
                        marginTop: '8px',
                        padding: '6px 10px',
                        backgroundColor: '#FAFCFA',
                        borderRadius: '6px',
                        borderLeft: '2px solid var(--color-primary)',
                      }}
                    >
                      "{p.example}"
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--color-border)',
                    paddingTop: '8px',
                    marginTop: '8px',
                  }}
                >
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    รอบถัดไป: {new Date(p.dueAt).toLocaleDateString('th-TH')}
                  </span>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(p)}
                      style={{ padding: '4px 8px', minHeight: '30px' }}
                      title="แก้ไขวลี"
                    >
                      <Edit2 size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirmPhrase(p)}
                      style={{ padding: '4px 8px', minHeight: '30px', color: 'var(--color-error)' }}
                      title="ลบวลี"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPhrase ? 'แก้ไขวลี' : 'เพิ่มวลีใหม่'}
        description="เพิ่มวลีที่คุณต้องการจำไว้ใช้ เพื่อให้ระบบช่วยนัดหมายทบทวน"
      >
        <form onSubmit={handleSavePhrase} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div>
            <label
              htmlFor="phrase-en"
              style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '4px' }}
            >
              วลีหรือประโยคภาษาอังกฤษ *
            </label>
            <input
              id="phrase-en"
              type="text"
              required
              value={formEn}
              onChange={(e) => setFormEn(e.target.value)}
              placeholder="เช่น Could you make it bigger?"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--color-border)',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="phrase-th"
              style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '4px' }}
            >
              คำแปลภาษาไทย *
            </label>
            <input
              id="phrase-th"
              type="text"
              required
              value={formTh}
              onChange={(e) => setFormTh(e.target.value)}
              placeholder="เช่น ช่วยทำให้ใหญ่ขึ้นอีกนิดได้ไหม?"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--color-border)',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="phrase-example"
              style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '4px' }}
            >
              ตัวอย่างประโยคบริบทการใช้งาน (ถ้ามี)
            </label>
            <textarea
              id="phrase-example"
              rows={2}
              value={formExample}
              onChange={(e) => setFormExample(e.target.value)}
              placeholder="เช่น Could you make the logo a little bigger on this slide?"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--color-border)',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="phrase-cat"
              style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '4px' }}
            >
              หมวดหมู่
            </label>
            <select
              id="phrase-cat"
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--color-border)',
                outline: 'none',
                backgroundColor: '#FFFFFF',
              }}
            >
              <option value="General">ทั่วไป (General)</option>
              <option value="Design & Marketing">งานดีไซน์ & การตลาด</option>
              <option value="Daily Life">ชีวิตประจำวัน</option>
              <option value="Gaming">เกม & ทีมเวิร์ก</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: 'var(--space-md)' }}>
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              ยกเลิก
            </Button>
            <Button variant="primary" type="submit">
              บันทึกวลี
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      {deleteConfirmPhrase && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteConfirmPhrase(null)}
          title="ยืนยันการลบวลี?"
          description={`คุณต้องการลบ "${deleteConfirmPhrase.en}" ออกจากคลังใช่หรือไม่?`}
        >
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: 'var(--space-md)' }}>
            <Button variant="outline" onClick={() => setDeleteConfirmPhrase(null)}>
              ยกเลิก
            </Button>
            <Button variant="danger" onClick={() => handleDelete(deleteConfirmPhrase)}>
              ยืนยันลบ
            </Button>
          </div>
        </Modal>
      )}

      {/* Undo Toast */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          action={
            recentlyDeleted
              ? {
                  label: 'เลิกทำ (Undo)',
                  onClick: handleUndoDelete,
                }
              : undefined
          }
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Flashcard Review Modal */}
      <PhraseReviewModal
        isOpen={isReviewModalOpen}
        phrases={phrases.filter((p) => new Date(p.dueAt).getTime() <= nowTime)}
        onClose={() => setIsReviewModalOpen(false)}
        onComplete={() => {
          setIsReviewModalOpen(false);
          loadPhrases();
        }}
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { LearningResource, ResourceType, ResourceSentence, TargetPhrase } from '../../types';
import { resourceRepo } from '../../lib/storage/repositories';
import { extractYouTubeId, buildYouTubeEmbedUrl, getResourceTypeLabel } from '../../lib/resources/mediaUtils';
import { parseBulkTextToSentences } from '../../lib/resources/bulkParser';
import { VideoTranscribeModal } from '../../components/resources/VideoTranscribeModal';
import {
  Plus,
  Search,
  Headphones,
  Music,
  Film,
  FileText,
  Play,
  Trash2,
  ExternalLink,
  BookOpen,
  Sparkles,
  Check,
} from 'lucide-react';

const YoutubeIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = '#B42318' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

export interface ResourcesScreenProps {
  onStudyResource: (resourceId: string) => void;
}

export const ResourcesScreen: React.FC<ResourcesScreenProps> = ({ onStudyResource }) => {
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [selectedType, setSelectedType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTranscribeModalOpen, setIsTranscribeModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<ResourceType>('youtube');
  const [formSourceUrl, setFormSourceUrl] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formReflection, setFormReflection] = useState('');

  // Bulk Paste State
  const [showBulkPaste, setShowBulkPaste] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkFeedback, setBulkFeedback] = useState<string | null>(null);

  // Sentence dynamic list
  const [formSentences, setFormSentences] = useState<ResourceSentence[]>([
    { id: 's1', en: '', th: '', timestamp: '' },
  ]);

  // Phrase dynamic list
  const [formPhrases, setFormPhrases] = useState<TargetPhrase[]>([
    { id: 'p1', en: '', th: '', example: '', category: 'General' },
  ]);

  // Delete state
  const [deleteConfirmResource, setDeleteConfirmResource] = useState<LearningResource | null>(null);

  const loadResources = async () => {
    setIsLoading(true);
    try {
      const all = await resourceRepo.getAllResources();
      setResources(all);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  const handleOpenAddModal = () => {
    setFormTitle('');
    setFormType('youtube');
    setFormSourceUrl('');
    setFormNotes('');
    setFormReflection('');
    setShowBulkPaste(false);
    setBulkText('');
    setBulkFeedback(null);
    setFormSentences([{ id: `s_${Date.now()}_1`, en: '', th: '', timestamp: '' }]);
    setFormPhrases([{ id: `p_${Date.now()}_1`, en: '', th: '', example: '', category: 'General' }]);
    setIsModalOpen(true);
  };

  const handleApplyBulkReplace = () => {
    const parsed = parseBulkTextToSentences(bulkText);
    if (parsed.length > 0) {
      setFormSentences(parsed);
      setShowBulkPaste(false);
      setBulkFeedback(`นำเข้าแทนที่ ${parsed.length} ประโยคเรียบร้อยแล้ว`);
      setTimeout(() => setBulkFeedback(null), 4000);
    }
  };

  const handleApplyBulkAppend = () => {
    const parsed = parseBulkTextToSentences(bulkText);
    if (parsed.length > 0) {
      setFormSentences((prev) => {
        const existing = prev.filter((p) => p.en.trim().length > 0);
        return [...existing, ...parsed];
      });
      setShowBulkPaste(false);
      setBulkFeedback(`เพิ่มต่อท้าย ${parsed.length} ประโยคเรียบร้อยแล้ว`);
      setTimeout(() => setBulkFeedback(null), 4000);
    }
  };

  const handleInsertSampleBulk = () => {
    setBulkText(
      `00:05 If you want to speak good English, you have to practice every day.\nถ้าคุณอยากพูดภาษาอังกฤษเก่ง คุณต้องฝึกทุกวัน\n00:15 Don't be afraid of making mistakes.\nอย่ากลัวที่จะทำผิดพลาด\n00:30 Every mistake is an opportunity to learn.\nทุกความผิดพลาดคือโอกาสในการเรียนรู้`
    );
  };

  const handleAddSentenceRow = () => {
    setFormSentences((prev) => [
      ...prev,
      { id: `s_${Date.now()}_${prev.length + 1}`, en: '', th: '', timestamp: '' },
    ]);
  };

  const handleRemoveSentenceRow = (index: number) => {
    if (formSentences.length <= 1) return;
    setFormSentences((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddPhraseRow = () => {
    setFormPhrases((prev) => [
      ...prev,
      { id: `p_${Date.now()}_${prev.length + 1}`, en: '', th: '', example: '', category: 'General' },
    ]);
  };

  const handleRemovePhraseRow = (index: number) => {
    if (formPhrases.length <= 1) return;
    setFormPhrases((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    let embedUrl = '';
    if (formType === 'youtube' && formSourceUrl) {
      const ytId = extractYouTubeId(formSourceUrl);
      if (ytId) {
        embedUrl = buildYouTubeEmbedUrl(ytId);
      }
    } else if (formSourceUrl) {
      embedUrl = formSourceUrl.trim();
    }

    // Filter valid sentences
    const cleanSentences = formSentences.filter((s) => s.en.trim().length > 0);
    const cleanPhrases = formPhrases.filter((p) => p.en.trim().length > 0);

    const newRes: LearningResource = {
      id: `res_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: formTitle.trim(),
      type: formType,
      sourceUrl: formSourceUrl.trim() || undefined,
      embedUrl: embedUrl || undefined,
      notes: formNotes.trim() || undefined,
      reflectionQuestion: formReflection.trim() || undefined,
      sentences: cleanSentences,
      targetPhrases: cleanPhrases,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await resourceRepo.saveResource(newRes);
    setIsModalOpen(false);
    await loadResources();
  };

  const handleDeleteResource = async (res: LearningResource) => {
    await resourceRepo.deleteResource(res.id);
    setDeleteConfirmResource(null);
    await loadResources();
  };

  const getTypeIcon = (type: ResourceType) => {
    switch (type) {
      case 'youtube':
        return <YoutubeIcon size={16} color="#B42318" />;
      case 'podcast':
        return <Headphones size={16} color="var(--color-primary)" />;
      case 'song':
        return <Music size={16} color="#7D4F1E" />;
      case 'movie':
        return <Film size={16} color="#4A5568" />;
      case 'article':
        return <FileText size={16} color="var(--color-primary)" />;
      default:
        return <BookOpen size={16} />;
    }
  };

  const filteredResources = resources.filter((res) => {
    const matchesType = selectedType === 'All' || res.type === selectedType;
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      query === '' ||
      res.title.toLowerCase().includes(query) ||
      (res.notes && res.notes.toLowerCase().includes(query)) ||
      res.sentences.some((s) => s.en.toLowerCase().includes(query) || s.th.toLowerCase().includes(query));
    return matchesType && matchesQuery;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Header */}
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
            คลังสื่อเรียนรู้ (Learning Resources)
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-base)' }}>
            แนบ YouTube, Podcast, เพลง, หรือซีนหนังที่คุณชอบ แล้วฝึกภาษาอังกฤษจากสื่อที่คุณสนใจ
          </p>
        </div>

        <Button onClick={handleOpenAddModal}>
          <Plus size={18} />
          <span>แนบ Resource ใหม่</span>
        </Button>
      </div>

      {/* Search & Type Filters */}
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
            placeholder="ค้นหาชื่อสื่อ, ประโยค หรือคำศัพท์ในสื่อ..."
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

        {/* Filter Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {[
            { id: 'All', label: 'ทั้งหมด' },
            { id: 'youtube', label: 'YouTube' },
            { id: 'podcast', label: 'Podcast' },
            { id: 'song', label: 'เพลง (Song)' },
            { id: 'movie', label: 'ซีนหนัง (Movie)' },
            { id: 'article', label: 'บทความ (Article)' },
          ].map((item) => {
            const isSelected = selectedType === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedType(item.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-badge)',
                  border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  backgroundColor: isSelected ? 'var(--color-primary)' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : 'var(--color-text-muted)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: isSelected ? 600 : 400,
                  cursor: 'pointer',
                  minHeight: '34px',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Resource Cards */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-2xl) 0', color: 'var(--color-text-muted)' }}>
          กำลังโหลดคลังสื่อเรียนรู้...
        </div>
      ) : filteredResources.length === 0 ? (
        <EmptyState
          icon={<YoutubeIcon size={24} />}
          title="ยังไม่มีสื่อที่แนบไว้"
          description="คุณสามารถแนบลิงก์วิดีโอ YouTube (เช่น สุนทรพจน์, บทสัมภาษณ์), ลิงก์เพลง หรือพอดแคสต์เพื่อฝึกภาษาอังกฤษได้ทันที"
          actionLabel="แนบ Resource แรกเลย"
          onAction={handleOpenAddModal}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
            gap: 'var(--space-md)',
          }}
        >
          {filteredResources.map((res) => {
            const ytId = res.sourceUrl ? extractYouTubeId(res.sourceUrl) : null;

            return (
              <Card
                key={res.id}
                padding="md"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 'var(--space-md)',
                }}
              >
                <div>
                  {/* Thumbnail / Header */}
                  {ytId ? (
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        paddingBottom: '52%',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        marginBottom: 'var(--space-sm)',
                        backgroundColor: '#182A25',
                      }}
                    >
                      <img
                        src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                        alt={res.title}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '8px',
                          right: '8px',
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          color: '#FFFFFF',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <YoutubeIcon size={14} color="#FF0000" /> YouTube
                      </div>
                    </div>
                  ) : null}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <Badge variant="primary" icon={getTypeIcon(res.type)}>
                      {getResourceTypeLabel(res.type)}
                    </Badge>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {res.sentences.length} ประโยคฝึก
                    </span>
                  </div>

                  <h3 style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-text)', marginBottom: '4px' }}>
                    {res.title}
                  </h3>

                  {res.notes && (
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
                      {res.notes}
                    </p>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--color-border)',
                    paddingTop: 'var(--space-md)',
                    marginTop: 'var(--space-xs)',
                  }}
                >
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => onStudyResource(res.id)}
                  >
                    <Play size={15} fill="currentColor" /> ศึกษาจากสื่อนี้
                  </Button>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    {res.sourceUrl && (
                      <a
                        href={res.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '6px',
                          color: 'var(--color-text-muted)',
                        }}
                        title="เปิดลิงก์ต้นทาง"
                      >
                        <ExternalLink size={15} />
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirmResource(res)}
                      style={{ padding: '6px', minHeight: '32px', color: 'var(--color-error)' }}
                      title="ลบ Resource"
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Resource Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="แนบ Resource ใหม่สำหรับฝึกภาษาอังกฤษ"
        description="ใส่วิดีโอ YouTube, พอดแคสต์, เนื้อเพลง หรือบทสนทนาที่คุณอยากนำมาใช้ฝึก"
        maxWidth="680px"
      >
        <form onSubmit={handleSaveResource} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '4px' }}>
              ประเภทของสื่อ *
            </label>
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value as ResourceType)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--color-border)',
                outline: 'none',
                backgroundColor: '#FFFFFF',
              }}
            >
              <option value="youtube">วิดีโอ YouTube</option>
              <option value="podcast">พอดแคสต์ (Podcast / Audio)</option>
              <option value="song">เพลงและเนื้อร้อง (Song / Lyrics)</option>
              <option value="movie">ฉากภาพยนตร์ / ซีรีส์ (Movie)</option>
              <option value="article">บทความ / สุนทรพจน์ (Article / Speech)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '4px' }}>
              ชื่อสื่อ / หัวข้อ *
            </label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="เช่น Jack Ma: Why Most People Never Speak English Fluently"
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
            <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '4px' }}>
              {formType === 'youtube' ? 'ลิงก์ YouTube (URL) *' : 'ลิงก์ต้นทาง / ลิงก์ไฟล์เสียง (ถ้ามี)'}
            </label>
            <input
              type="url"
              value={formSourceUrl}
              onChange={(e) => setFormSourceUrl(e.target.value)}
              placeholder={
                formType === 'youtube'
                  ? 'https://www.youtube.com/watch?v=...'
                  : 'https://...'
              }
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
            <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '4px' }}>
              คำอธิบายหรือบริบทของสื่อ (Notes)
            </label>
            <textarea
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="เช่น สุนทรพจน์เกี่ยวกับการฝึกพูดทุกวัน..."
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

          {/* Dynamic Sentences Input */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                ประโยคที่ต้องการฝึกฟังและพูดตาม (Sentences: {formSentences.filter(s => s.en.trim()).length})
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setIsTranscribeModalOpen(true)}
                  style={{
                    borderColor: 'var(--color-primary)',
                    color: 'var(--color-primary)',
                    backgroundColor: '#EFF5F2',
                    fontWeight: 600,
                  }}
                >
                  <Sparkles size={14} /> ถอดประโยคจากคลิป
                </Button>
                <Button
                  variant={showBulkPaste ? 'primary' : 'outline'}
                  size="sm"
                  type="button"
                  onClick={() => setShowBulkPaste(!showBulkPaste)}
                >
                  <FileText size={14} /> {showBulkPaste ? 'ซ่อนการวางทั้งชุด' : 'วางข้อความทั้งชุด (Bulk Paste)'}
                </Button>
                <Button variant="outline" size="sm" type="button" onClick={handleAddSentenceRow}>
                  <Plus size={14} /> เพิ่มประโยค
                </Button>
              </div>
            </div>

            {bulkFeedback && (
              <div
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#E8F5E9',
                  color: 'var(--color-primary)',
                  borderRadius: '6px',
                  fontSize: 'var(--font-size-xs)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '10px',
                }}
              >
                <Check size={14} /> {bulkFeedback}
              </div>
            )}

            {/* Bulk Paste Box */}
            {showBulkPaste && (
              <div
                style={{
                  padding: '14px',
                  backgroundColor: '#F7FAF8',
                  borderRadius: '8px',
                  border: '1.5px dashed var(--color-primary)',
                  marginBottom: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--color-text)' }}>
                      วางเนื้อหาหลายประโยคพร้อมกัน (Bulk Paste / Subtitle Parser)
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      รองรับเนื้อเพลง, ซับไตเติล SRT, เวลา (เช่น 01:24 หรือ [01:24]), และประโยคคู่ EN/TH
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" type="button" onClick={handleInsertSampleBulk}>
                    <Sparkles size={14} /> ลองใส่ตัวอย่าง
                  </Button>
                </div>

                <textarea
                  rows={5}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={`วางข้อความที่นี่ เช่น:\n00:05 If you want to speak good English, you have to practice every day.\nถ้าคุณอยากพูดภาษาอังกฤษเก่ง คุณต้องฝึกทุกวัน\n00:15 Don't be afraid of making mistakes.\nอย่ากลัวที่จะทำผิดพลาด`}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    backgroundColor: '#FFFFFF',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    {bulkText.trim().length > 0 && (
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: parseBulkTextToSentences(bulkText).length > 0 ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        }}
                      >
                        ตรวจพบ {parseBulkTextToSentences(bulkText).length} ประโยค
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      disabled={parseBulkTextToSentences(bulkText).length === 0}
                      onClick={handleApplyBulkAppend}
                    >
                      เพิ่มต่อท้าย (Append)
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      type="button"
                      disabled={parseBulkTextToSentences(bulkText).length === 0}
                      onClick={handleApplyBulkReplace}
                    >
                      นำเข้าแทนที่ทั้งหมด
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {formSentences.map((st, idx) => (
                <div
                  key={st.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#FAFCFA',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)' }}>
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      placeholder="ประโยคภาษาอังกฤษ (เช่น If you want to speak good English...)"
                      value={st.en}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormSentences((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, en: val } : item))
                        );
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border)',
                        outline: 'none',
                        fontSize: '13px',
                      }}
                    />
                    <input
                      type="text"
                      placeholder="เวลา (เช่น 01:24)"
                      value={st.timestamp || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormSentences((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, timestamp: val } : item))
                        );
                      }}
                      style={{
                        width: '70px',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border)',
                        outline: 'none',
                        fontSize: '13px',
                      }}
                    />
                    {formSentences.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSentenceRow(idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-error)',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="คำแปลภาษาไทย (ถ้ามี)"
                    value={st.th}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormSentences((prev) =>
                        prev.map((item, i) => (i === idx ? { ...item, th: val } : item))
                      );
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border)',
                      outline: 'none',
                      fontSize: '13px',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Target Phrases Input */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                คำศัพท์หรือวลีสำคัญที่ต้องการเก็บเข้าคลัง (Target Phrases)
              </span>
              <Button variant="outline" size="sm" type="button" onClick={handleAddPhraseRow}>
                <Plus size={14} /> เพิ่มวลี
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {formPhrases.map((tp, idx) => (
                <div
                  key={tp.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#FAFCFA',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="วลีภาษาอังกฤษ (เช่น practice every single day)"
                      value={tp.en}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormPhrases((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, en: val } : item))
                        );
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border)',
                        outline: 'none',
                        fontSize: '13px',
                      }}
                    />
                    <input
                      type="text"
                      placeholder="คำแปลไทย"
                      value={tp.th}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormPhrases((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, th: val } : item))
                        );
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border)',
                        outline: 'none',
                        fontSize: '13px',
                      }}
                    />
                    {formPhrases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePhraseRow(idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-error)',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '4px' }}>
              คำถามทบทวนหลังศึกษา (Reflection Question)
            </label>
            <input
              type="text"
              value={formReflection}
              onChange={(e) => setFormReflection(e.target.value)}
              placeholder="เช่น What did you learn from this video?"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--color-border)',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: 'var(--space-md)' }}>
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              ยกเลิก
            </Button>
            <Button variant="primary" type="submit">
              บันทึก Resource
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      {deleteConfirmResource && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteConfirmResource(null)}
          title="ยืนยันการลบ Resource?"
          description={`คุณต้องการลบ "${deleteConfirmResource.title}" ออกจากคลังสื่อใช่หรือไม่?`}
        >
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: 'var(--space-md)' }}>
            <Button variant="outline" onClick={() => setDeleteConfirmResource(null)}>
              ยกเลิก
            </Button>
            <Button variant="danger" onClick={() => handleDeleteResource(deleteConfirmResource)}>
              ยืนยันลบ
            </Button>
          </div>
        </Modal>
      )}
      {/* Video Transcribe Modal */}
      <VideoTranscribeModal
        isOpen={isTranscribeModalOpen}
        onClose={() => setIsTranscribeModalOpen(false)}
        videoTitle={formTitle || 'สื่อใหม่'}
        videoUrl={formSourceUrl}
        videoNotes={formNotes}
        existingSentencesCount={formSentences.filter((s) => s.en.trim().length > 0).length}
        onApplySentences={(newSentences, mode, targetPhrases) => {
          if (mode === 'replace') {
            setFormSentences(newSentences);
          } else {
            setFormSentences((prev) => {
              const existing = prev.filter((p) => p.en.trim().length > 0);
              return [...existing, ...newSentences];
            });
          }

          if (targetPhrases && targetPhrases.length > 0) {
            setFormPhrases((prev) => {
              const existing = prev.filter((p) => p.en.trim().length > 0);
              return [...existing, ...targetPhrases];
            });
          }
        }}
      />
    </div>
  );
};

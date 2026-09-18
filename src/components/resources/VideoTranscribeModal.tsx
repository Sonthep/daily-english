import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ResourceSentence, TargetPhrase } from '../../types';
import {
  parseYouTubeTranscript,
  transcribeVideoWithGemini,
  translateSentencesWithGemini,
  secondsToTimestamp,
} from '../../lib/resources/videoTranscriber';
import { getStoredGeminiApiKey, setStoredGeminiApiKey } from '../../lib/ai/geminiProvider';
import { extractYouTubeId } from '../../lib/resources/mediaUtils';
import {
  Sparkles,
  FileText,
  Mic,
  ExternalLink,
  Trash2,
  Check,
  AlertCircle,
  Clock,
  Key,
  RefreshCw,
} from 'lucide-react';

export interface VideoTranscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoTitle: string;
  videoUrl?: string;
  videoNotes?: string;
  existingSentencesCount: number;
  onApplySentences: (
    sentences: ResourceSentence[],
    mode: 'replace' | 'append',
    targetPhrases?: TargetPhrase[]
  ) => void;
}

type TranscribeTab = 'ai' | 'youtube_transcript' | 'live_mic';

export const VideoTranscribeModal: React.FC<VideoTranscribeModalProps> = ({
  isOpen,
  onClose,
  videoTitle,
  videoUrl,
  videoNotes,
  existingSentencesCount,
  onApplySentences,
}) => {
  const [activeTab, setActiveTab] = useState<TranscribeTab>('ai');

  // Preview sentences generated
  const [previewSentences, setPreviewSentences] = useState<ResourceSentence[]>([]);
  const [previewPhrases, setPreviewPhrases] = useState<TargetPhrase[]>([]);
  const [applyMode, setApplyMode] = useState<'replace' | 'append'>(
    existingSentencesCount > 0 ? 'replace' : 'replace'
  );

  // Tab 1: AI Transcribe State
  const [sentenceCount, setSentenceCount] = useState<number>(8);
  const [focusStyle, setFocusStyle] = useState<'practical' | 'beginner' | 'full'>('practical');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);

  // Tab 2: YouTube Transcript Paste State
  const [transcriptText, setTranscriptText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateSuccess, setTranslateSuccess] = useState(false);

  // Tab 3: Live Audio Transcribe State
  const [isListeningLive, setIsListeningLive] = useState(false);
  const [liveInterim, setLiveInterim] = useState('');
  const [liveElapsedSeconds, setLiveElapsedSeconds] = useState(0);
  const liveTimerRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      const key = getStoredGeminiApiKey();
      setHasApiKey(Boolean(key));
      setApiKeyInput(key || '');
      setAiError(null);
      setPreviewSentences([]);
      setPreviewPhrases([]);
      setTranscriptText('');
    }
  }, [isOpen]);

  // Clean up live recognition on unmount
  useEffect(() => {
    return () => {
      if (liveTimerRef.current) clearInterval(liveTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKeyInput.trim()) {
      setStoredGeminiApiKey(apiKeyInput.trim());
      setHasApiKey(true);
      setAiError(null);
    }
  };

  // 1. Run AI Transcription
  const handleRunAiTranscription = async () => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      const result = await transcribeVideoWithGemini({
        videoUrl,
        videoTitle,
        notes: videoNotes,
        count: sentenceCount,
        focus: focusStyle,
      });

      if (result.sentences.length === 0) {
        setAiError('AI ไม่พบประโยคพูดในคลิปนี้ กรุณาลองใหม่อีกครั้งหรือใช้วิธีวาง Transcript');
        return;
      }

      setPreviewSentences(result.sentences);
      if (result.targetPhrases) {
        setPreviewPhrases(result.targetPhrases);
      }
    } catch (err: any) {
      setAiError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ Gemini AI');
    } finally {
      setIsAiLoading(false);
    }
  };

  // 2. Parse YouTube Transcript
  const handleParseTranscript = () => {
    if (!transcriptText.trim()) return;
    const parsed = parseYouTubeTranscript(transcriptText);
    if (parsed.length > 0) {
      setPreviewSentences(parsed);
      setTranslateSuccess(false);
    }
  };

  // Translate parsed sentences via AI
  const handleTranslateParsedSentences = async () => {
    if (previewSentences.length === 0) return;
    setIsTranslating(true);
    try {
      const translated = await translateSentencesWithGemini(previewSentences);
      setPreviewSentences(translated);
      setTranslateSuccess(true);
      setTimeout(() => setTranslateSuccess(false), 4000);
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถแปลภาษาด้วย AI ได้ กรุณาตรวจสอบ API Key');
    } finally {
      setIsTranslating(false);
    }
  };

  // 3. Live Speech Recognition
  const handleToggleLiveListening = () => {
    if (isListeningLive) {
      // Stop
      setIsListeningLive(false);
      if (liveTimerRef.current) clearInterval(liveTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    } else {
      // Start
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('เบราว์เซอร์ของคุณยังไม่รองรับ Web Speech Recognition แนะนำให้ใช้ Google Chrome หรือ Microsoft Edge');
        return;
      }

      setIsListeningLive(true);
      setLiveElapsedSeconds(0);
      setLiveInterim('');

      liveTimerRef.current = window.setInterval(() => {
        setLiveElapsedSeconds((s) => s + 1);
      }, 1000);

      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let interimText = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            const finalClean = trans.trim();
            if (finalClean.length > 0) {
              const currentTimestamp = secondsToTimestamp(liveElapsedSeconds);
              setPreviewSentences((prev) => [
                ...prev,
                {
                  id: `live_${Date.now()}_${prev.length + 1}`,
                  en: finalClean.charAt(0).toUpperCase() + finalClean.slice(1),
                  th: '',
                  timestamp: currentTimestamp,
                },
              ]);
            }
          } else {
            interimText += trans;
          }
        }
        setLiveInterim(interimText);
      };

      recognition.onerror = (e: any) => {
        console.warn('Live speech recognition error:', e);
      };

      recognition.onend = () => {
        if (isListeningLive) {
          try {
            recognition.start();
          } catch {
            // ignore
          }
        }
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleApply = () => {
    if (previewSentences.length === 0) return;
    onApplySentences(previewSentences, applyMode, previewPhrases.length > 0 ? previewPhrases : undefined);
    onClose();
  };

  const ytId = videoUrl ? extractYouTubeId(videoUrl) : null;
  const ytDirectUrl = ytId
    ? `https://www.youtube.com/watch?v=${ytId}`
    : videoUrl || '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="ถอดภาษาอังกฤษจากคลิปสำหรับฝึก Shadowing" maxWidth="760px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {/* Resource Context Info */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-control)',
            backgroundColor: '#F7FAF8',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 600 }}>
              คลิปวิดีโอที่กำลังเรียนรู้
            </div>
            <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-text)' }}>
              {videoTitle}
            </div>
          </div>

          {ytDirectUrl && (
            <a
              href={ytDirectUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                color: 'var(--color-primary)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <span>เปิดคลิปใน YouTube</span>
              <ExternalLink size={12} />
            </a>
          )}
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '2px solid var(--color-border)',
            gap: '8px',
          }}
        >
          <button
            onClick={() => setActiveTab('ai')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              border: 'none',
              borderBottom: activeTab === 'ai' ? '3px solid var(--color-primary)' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'ai' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: activeTab === 'ai' ? 700 : 500,
              fontSize: 'var(--font-size-sm)',
              cursor: 'pointer',
              marginBottom: '-2px',
            }}
          >
            <Sparkles size={16} />
            <span>ถอดด้วย AI (Gemini)</span>
          </button>

          <button
            onClick={() => setActiveTab('youtube_transcript')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              border: 'none',
              borderBottom:
                activeTab === 'youtube_transcript'
                  ? '3px solid var(--color-primary)'
                  : '3px solid transparent',
              backgroundColor: 'transparent',
              color:
                activeTab === 'youtube_transcript'
                  ? 'var(--color-primary)'
                  : 'var(--color-text-muted)',
              fontWeight: activeTab === 'youtube_transcript' ? 700 : 500,
              fontSize: 'var(--font-size-sm)',
              cursor: 'pointer',
              marginBottom: '-2px',
            }}
          >
            <FileText size={16} />
            <span>วาง Transcript จาก YouTube</span>
          </button>

          <button
            onClick={() => setActiveTab('live_mic')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              border: 'none',
              borderBottom:
                activeTab === 'live_mic' ? '3px solid var(--color-primary)' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'live_mic' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: activeTab === 'live_mic' ? 700 : 500,
              fontSize: 'var(--font-size-sm)',
              cursor: 'pointer',
              marginBottom: '-2px',
            }}
          >
            <Mic size={16} />
            <span>ฟังเสียงสดจากคลิป</span>
          </button>
        </div>

        {/* TAB 1: AI Transcribe (Gemini) */}
        {activeTab === 'ai' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {!hasApiKey ? (
              <div
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-control)',
                  backgroundColor: '#FFF9F2',
                  border: '1px solid #F5DEB3',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9A5B18', fontWeight: 600, fontSize: '13px' }}>
                  <Key size={16} />
                  <span>กรอก Google Gemini API Key เพื่อถอดประโยคอัตโนมัติด้วย AI</span>
                </div>
                <p style={{ fontSize: '12px', color: '#7D4F1E', margin: 0 }}>
                  Gemini API ใช้งานได้ฟรี (Free Tier) สามารถรับคีย์ได้จาก Google AI Studio
                </p>
                <form onSubmit={handleSaveApiKey} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="วาง AIzaSy... ที่นี่"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-control)',
                      border: '1px solid var(--color-border)',
                      fontSize: '13px',
                    }}
                  />
                  <Button type="submit" size="sm" variant="primary">
                    บันทึกคีย์
                  </Button>
                </form>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#F0F9F4',
                  fontSize: '12px',
                  color: 'var(--color-primary)',
                  fontWeight: 500,
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={14} /> Google Gemini (3.6 Flash) พร้อมใช้งาน
                </span>
                <button
                  onClick={() => {
                    setStoredGeminiApiKey('');
                    setHasApiKey(false);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    fontSize: '11px',
                    textDecoration: 'underline',
                  }}
                >
                  เปลี่ยนคีย์
                </button>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: '4px' }}>
                  จำนวนประโยคที่ต้องการถอด
                </label>
                <select
                  value={sentenceCount}
                  onChange={(e) => setSentenceCount(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-control)',
                    border: '1px solid var(--color-border)',
                    fontSize: '13px',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <option value={5}>5 ประโยค (เน้นหัวข้อหลัก สั้นกระชับ)</option>
                  <option value={8}>8 ประโยค (แนะนำ - พอดีสำหรับ 1 รอบฝึก)</option>
                  <option value={12}>12 ประโยค (ละเอียด ครอบคลุมทั้งคลิป)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: '4px' }}>
                  รูปแบบประโยค
                </label>
                <select
                  value={focusStyle}
                  onChange={(e) => setFocusStyle(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-control)',
                    border: '1px solid var(--color-border)',
                    fontSize: '13px',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <option value="practical">ประโยคใช้จริงและออกเสียงเป็นธรรมชาติ (Practical)</option>
                  <option value="beginner">ประโยคสั้นเข้าใจง่าย (Beginner Friendly)</option>
                  <option value="full">ถอดตามลำดับบทพูดในคลิป (Sequential)</option>
                </select>
              </div>
            </div>

            {aiError && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-control)',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  color: '#991B1B',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={15} />
                <span>{aiError}</span>
              </div>
            )}

            <Button
              variant="primary"
              onClick={handleRunAiTranscription}
              disabled={isAiLoading || !hasApiKey}
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            >
              {isAiLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>AI กำลังวิเคราะห์คลิปและถอดบทพูด...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>เริ่มถอดภาษาอังกฤษด้วย AI</span>
                </>
              )}
            </Button>
          </div>
        )}

        {/* TAB 2: YouTube Transcript Paste */}
        {activeTab === 'youtube_transcript' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <div
              style={{
                backgroundColor: '#F8FAF9',
                padding: '10px 14px',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--color-border)',
                fontSize: '12px',
                color: 'var(--color-text)',
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: '4px' }}>
                💡 วิธีคัดลอก Transcript จาก YouTube ใน 3 คลิก (ไม่ต้องใช้ AI Key):
              </div>
              <ol style={{ margin: '0 0 0 16px', padding: 0 }}>
                <li>เปิดคลิปใน YouTube (คลิก "เปิดคลิปใน YouTube" ด้านบน)</li>
                <li>ใต้คลิป YouTube กดปุ่ม <b>...</b> หรือ <b>Show transcript (แสดงข้อความถอดเสียง)</b></li>
                <li>ลากคลุมข้อความทั้งหมด (หรือกด Ctrl+A ในหน้าต่างซับ) แล้วกด Copy มาวางในช่องนี้</li>
              </ol>
            </div>

            <textarea
              rows={6}
              value={transcriptText}
              onChange={(e) => setTranscriptText(e.target.value)}
              placeholder="วาง Transcript จาก YouTube ที่นี่ เช่น&#10;0:00&#10;If you want to speak good English&#10;0:04&#10;you have to practice every single day..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--color-border)',
                fontSize: '13px',
                fontFamily: 'monospace',
                resize: 'vertical',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleParseTranscript}
                disabled={!transcriptText.trim()}
              >
                <span>จัดกลุ่มเป็นประโยคอัตโนมัติ</span>
              </Button>

              {previewSentences.length > 0 && hasApiKey && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTranslateParsedSentences}
                  disabled={isTranslating}
                  style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
                >
                  {isTranslating ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>กำลังแปลไทยด้วย AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>{translateSuccess ? 'แปลไทยเรียบร้อย!' : 'แปลไทยอัตโนมัติด้วย AI'}</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Live Audio Transcribe */}
        {activeTab === 'live_mic' && (
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-control)',
              backgroundColor: '#F8FAF9',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
              เปิดเล่นวิดีโอคลิป Jack Ma ในแท็บนี้ หรือเปิดเสียงผ่านลำโพง/หูฟัง แล้วกดปุ่มเพื่อให้ระบบฟังและถอดเสียงสด
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <Button
                variant={isListeningLive ? 'primary' : 'outline'}
                onClick={handleToggleLiveListening}
                style={{
                  padding: '12px 24px',
                  backgroundColor: isListeningLive ? '#DC2626' : undefined,
                  borderColor: isListeningLive ? '#DC2626' : undefined,
                  color: isListeningLive ? '#FFFFFF' : undefined,
                }}
              >
                <Mic size={18} />
                <span>{isListeningLive ? 'กำลังฟังเสียงสด (กดหยุด)' : 'เริ่มฟังเสียงและถอดประโยคสด'}</span>
              </Button>

              {isListeningLive && (
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#DC2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={14} /> {secondsToTimestamp(liveElapsedSeconds)}
                </span>
              )}
            </div>

            {isListeningLive && liveInterim && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#FFFFFF',
                  border: '1px dashed var(--color-primary)',
                  fontSize: '13px',
                  color: 'var(--color-primary)',
                  fontStyle: 'italic',
                }}
              >
                ได้ยินเสียง: "{liveInterim}..."
              </div>
            )}
          </div>
        )}

        {/* PREVIEW AREA */}
        {previewSentences.length > 0 && (
          <div
            style={{
              marginTop: 'var(--space-sm)',
              borderTop: '1px solid var(--color-border)',
              paddingTop: 'var(--space-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={16} color="var(--color-primary)" />
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>
                  พบ {previewSentences.length} ประโยคพร้อมฝึก Shadowing
                </span>
              </div>

              {existingSentencesCount > 0 && (
                <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="applyMode"
                      checked={applyMode === 'replace'}
                      onChange={() => setApplyMode('replace')}
                    />
                    <span>แทนที่ประโยคเดิม ({existingSentencesCount} ประโยค)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="applyMode"
                      checked={applyMode === 'append'}
                      onChange={() => setApplyMode('append')}
                    />
                    <span>เพิ่มต่อท้าย</span>
                  </label>
                </div>
              )}
            </div>

            {/* Scrollable list of sentences */}
            <div
              style={{
                maxHeight: '260px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                paddingRight: '4px',
              }}
            >
              {previewSentences.map((st, idx) => (
                <div
                  key={st.id || idx}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#FAFCFA',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--color-primary)',
                        backgroundColor: 'var(--color-primary-soft)',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
                        {st.en}
                      </div>
                      {st.th ? (
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          {st.th}
                        </div>
                      ) : (
                        <div style={{ fontSize: '11px', color: '#B45309', fontStyle: 'italic', marginTop: '2px' }}>
                          (ยังไม่มีคำแปลไทย - สามารถกดปุ่มแปลไทยด้วย AI ด้านบน)
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    {st.timestamp && (
                      <Badge variant="neutral">
                        <Clock size={11} style={{ marginRight: '3px' }} />
                        {st.timestamp}
                      </Badge>
                    )}
                    <button
                      onClick={() => {
                        setPreviewSentences((prev) => prev.filter((_, i) => i !== idx));
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-muted)',
                        cursor: 'pointer',
                        padding: '2px',
                      }}
                      title="ลบประโยคนี้"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Target Phrases Preview if any */}
            {previewPhrases.length > 0 && (
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                💡 รวมทั้งสกัดสำนวนเป้าหมาย ({previewPhrases.length} วลี) เช่น: "
                {previewPhrases.map((p) => p.en).join('", "')}"
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            borderTop: '1px solid var(--color-border)',
            paddingTop: 'var(--space-md)',
            marginTop: 'var(--space-sm)',
          }}
        >
          <Button variant="ghost" onClick={onClose}>
            ยกเลิก
          </Button>

          <Button
            variant="primary"
            onClick={handleApply}
            disabled={previewSentences.length === 0}
            style={{ fontWeight: 600 }}
          >
            <Check size={16} />
            <span>นำไปใช้ในบทเรียนและเริ่ม Shadowing ({previewSentences.length})</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};

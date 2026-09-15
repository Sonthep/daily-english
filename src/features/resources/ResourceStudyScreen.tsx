import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Toast } from '../../components/ui/Toast';
import { Modal } from '../../components/ui/Modal';
import { LearningResource, ResourceSentence, TargetPhrase } from '../../types';
import { phraseRepo } from '../../lib/storage/repositories';
import { speechService } from '../../lib/audio/speech';
import { AudioRecorder, RecorderError } from '../../lib/audio/recorder';
import { speechRecognitionService } from '../../lib/audio/recognition';
import { evaluatePronunciation, PronunciationScoreResult } from '../../lib/audio/pronunciationMatcher';
import { PronunciationFeedbackCard } from '../../components/audio/PronunciationFeedbackCard';
import { createNewPhrase } from '../../lib/review/scheduler';
import { formatDurationThai } from '../../lib/review/dateUtils';
import { getResourceTypeLabel } from '../../lib/resources/mediaUtils';
import { getActiveTutorProvider, getStoredGeminiApiKey, setStoredGeminiApiKey } from '../../lib/ai/provider';
import { TextFeedbackResponse } from '../../lib/ai/types';
import { AICoachFeedbackCard } from '../../components/ai/AICoachFeedbackCard';
import {
  ArrowLeft,
  Volume2,
  Mic,
  RotateCcw,
  Check,
  Bookmark,
  ExternalLink,
  MessageSquare,
  Clock,
  Sparkles,
  Key,
} from 'lucide-react';

export interface ResourceStudyScreenProps {
  resource: LearningResource;
  onExit: () => void;
}

export const ResourceStudyScreen: React.FC<ResourceStudyScreenProps> = ({
  resource,
  onExit,
}) => {
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [playingSentenceId, setPlayingSentenceId] = useState<string | null>(null);

  // Shadowing Audio State per sentence
  const [recorder] = useState<AudioRecorder>(() => new AudioRecorder());
  const [activeRecordSentenceId, setActiveRecordSentenceId] = useState<string | null>(null);
  const [recordState, setRecordState] = useState<'idle' | 'recording' | 'recorded' | 'playing'>('idle');
  const [recordAudioUrl, setRecordAudioUrl] = useState<string | null>(null);
  const [micError, setMicError] = useState<RecorderError | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [pronunciationResults, setPronunciationResults] = useState<Record<string, PronunciationScoreResult>>({});

  // Saved Phrases state
  const [savedPhraseIds, setSavedPhraseIds] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reflection & AI Coach State
  const [reflectionText, setReflectionText] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<TextFeedbackResponse | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);
  const [isNoKeyModalOpen, setIsNoKeyModalOpen] = useState<boolean>(false);
  const [quickApiKey, setQuickApiKey] = useState<string>('');

  // 1. Timer that pauses when tab is hidden
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        setActiveSeconds((prev) => prev + 1);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      speechService.stop();
      speechRecognitionService.abort();
      recorder.cleanup();
    };
  }, [recorder]);

  // Speech Helper
  const handlePlaySpeech = (sentence: ResourceSentence) => {
    speechService.stop();
    setPlayingSentenceId(sentence.id);
    speechService.speak(
      sentence.en,
      1.0,
      () => setPlayingSentenceId(null),
      () => setPlayingSentenceId(null)
    );
  };

  // Shadowing Microphone Helpers
  const handleStartShadowing = async (sentenceId: string) => {
    setMicError(null);
    setActiveRecordSentenceId(sentenceId);
    setLiveTranscript('');
    const res = await recorder.start();
    if (res.success) {
      setRecordState('recording');
      speechRecognitionService.start({
        lang: 'en-US',
        onInterim: (text) => setLiveTranscript(text),
        onFinal: (text) => setLiveTranscript(text),
      });
    } else if (res.error) {
      setMicError(res.error);
      setRecordState('idle');
    }
  };

  const handleStopShadowing = async () => {
    const url = await recorder.stop();
    const finalTranscript = speechRecognitionService.stop() || liveTranscript;
    setRecordAudioUrl(url);
    setRecordState('recorded');

    if (activeRecordSentenceId) {
      const targetSentence = resource.sentences.find(
        (s: ResourceSentence) => s.id === activeRecordSentenceId
      );
      if (targetSentence) {
        const evaluation = evaluatePronunciation(targetSentence.en, finalTranscript || '');
        setPronunciationResults((prev) => ({
          ...prev,
          [activeRecordSentenceId]: evaluation,
        }));
      }
    }
  };

  const handlePlayRecorded = () => {
    if (!recordAudioUrl) return;
    setRecordState('playing');
    recorder.play(
      () => setRecordState('recorded'),
      () => setRecordState('recorded')
    );
  };

  const handleResetRecord = () => {
    recorder.cleanup();
    speechRecognitionService.abort();
    setRecordAudioUrl(null);
    setRecordState('idle');
    setLiveTranscript('');
    if (activeRecordSentenceId) {
      setPronunciationResults((prev) => {
        const next = { ...prev };
        delete next[activeRecordSentenceId];
        return next;
      });
    }
    setActiveRecordSentenceId(null);
  };

  // 1-Click Save Phrase to Spaced Repetition Phrase Bank
  const handleSavePhraseToBank = async (en: string, th: string, example: string, keyId: string) => {
    const newPhrase = createNewPhrase(en, th, example, resource.type, resource.id);
    await phraseRepo.savePhrase(newPhrase);

    setSavedPhraseIds((prev) => new Set(prev).add(keyId));
    setToastMessage(`บันทึก "${en}" เข้าคลัง My Phrases เรียบร้อยแล้ว (Stage 0)`);

    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleFinishStudy = () => {
    setIsCompleted(true);
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#245C4F', '#E7F0EA', '#F7E8D7'],
      });
    } catch {
      // ignore
    }
  };

  const handleAskAICoach = async () => {
    const trimmed = reflectionText.trim();
    if (!trimmed) return;

    const key = getStoredGeminiApiKey();
    if (!key) {
      setIsNoKeyModalOpen(true);
      return;
    }

    setIsLoadingAI(true);
    try {
      const provider = getActiveTutorProvider();
      const feedback = await provider.getFeedback(
        resource.reflectionQuestion || 'What did you learn from this resource?',
        'คุณได้ข้อคิดหรือนำภาษาอังกฤษประโยคไหนไปใช้ต่อจากสื่อนี้บ้าง?',
        trimmed,
        'In this resource, I learned how to express my ideas clearly and with confidence.'
      );
      setAiFeedback(feedback);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleSaveQuickKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickApiKey.trim()) {
      setStoredGeminiApiKey(quickApiKey.trim());
      setIsNoKeyModalOpen(false);
      setTimeout(() => {
        handleAskAICoach();
      }, 100);
    }
  };

  return (
    <div
      style={{
        maxWidth: '860px',
        margin: '0 auto',
        padding: 'var(--space-base) var(--space-base) var(--space-2xl)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-lg)',
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <Button variant="ghost" size="sm" onClick={onExit} style={{ padding: '6px 12px' }}>
          <ArrowLeft size={18} />
          <span>กลับไปหน้ารวมสื่อ</span>
        </Button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Badge variant="primary">{getResourceTypeLabel(resource.type)}</Badge>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={13} /> {formatDurationThai(activeSeconds)}
          </span>
        </div>
      </div>

      {/* Resource Title Card */}
      <div>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-text)', marginBottom: '4px' }}>
          {resource.title}
        </h1>
        {resource.notes && (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-base)', lineHeight: 1.6 }}>
            {resource.notes}
          </p>
        )}
      </div>

      {/* Media Player Embed Area */}
      {resource.embedUrl && resource.type === 'youtube' && (
        <Card padding="none" style={{ overflow: 'hidden', borderRadius: '16px', backgroundColor: '#000000' }}>
          <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%' }}>
            <iframe
              src={resource.embedUrl}
              title={resource.title}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </Card>
      )}

      {/* External Link Option if available */}
      {resource.sourceUrl && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <a
            href={resource.sourceUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-primary)',
            }}
          >
            <span>เปิดชมต้นฉบับในแท็บใหม่</span>
            <ExternalLink size={13} />
          </a>
        </div>
      )}

      {/* Key Sentences & Shadowing Practice */}
      <Card padding="lg">
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <Sparkles size={18} color="var(--color-primary)" />
            <h2 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text)' }}>
              ประโยคสำคัญและฝึกพูดตาม (Shadowing Practice)
            </h2>
          </div>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
            ฟังการออกเสียง แล้วลองกดอัดเสียงเพื่อฝึกพูดตาม (Shadowing) หรือกดบันทึกวลีเข้าคลังคำศัพท์
          </p>
        </div>

        {micError && (
          <div
            style={{
              backgroundColor: 'var(--color-accent-soft)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-control)',
              fontSize: 'var(--font-size-xs)',
              color: '#7D4F1E',
              marginBottom: 'var(--space-md)',
            }}
          >
            {micError.message}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {resource.sentences.map((st, index) => {
            const isPlayingThis = playingSentenceId === st.id;
            const isRecordingThis = activeRecordSentenceId === st.id;
            const isSaved = savedPhraseIds.has(st.id);

            return (
              <div
                key={st.id}
                style={{
                  padding: 'var(--space-base)',
                  borderRadius: 'var(--radius-control)',
                  backgroundColor: '#FAFCFA',
                  border: isRecordingThis ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-sm)',
                  transition: 'all var(--transition-smooth)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-primary-soft)',
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 700,
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      {index + 1}
                    </span>

                    <div>
                      <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--color-text)' }}>
                        {st.en}
                      </div>
                      {st.th && (
                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          {st.th}
                        </div>
                      )}
                    </div>
                  </div>

                  {st.timestamp && (
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#EFF3F0',
                        color: 'var(--color-text-muted)',
                        flexShrink: 0,
                      }}
                    >
                      {st.timestamp}
                    </span>
                  )}
                </div>

                {/* Sentence Action Controls */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--color-border)',
                    paddingTop: '8px',
                    marginTop: '4px',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePlaySpeech(st)}
                      style={{ padding: '6px 12px' }}
                    >
                      <Volume2 size={16} color={isPlayingThis ? 'var(--color-primary)' : undefined} />
                      <span>{isPlayingThis ? 'กำลังเล่นเสียง...' : 'ฟังเสียงอ่าน'}</span>
                    </Button>

                    <Button
                      variant={isRecordingThis ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => {
                        if (isRecordingThis && recordState === 'recording') {
                          handleStopShadowing();
                        } else {
                          handleStartShadowing(st.id);
                        }
                      }}
                      style={{ padding: '6px 12px' }}
                    >
                      <Mic size={15} />
                      <span>
                        {isRecordingThis && recordState === 'recording'
                          ? 'กำลังอัดเสียง (กดหยุด)'
                          : 'ฝึกพูดตาม (Shadowing)'}
                      </span>
                    </Button>
                  </div>

                  <Button
                    variant={isSaved ? 'secondary' : 'ghost'}
                    size="sm"
                    disabled={isSaved}
                    onClick={() => handleSavePhraseToBank(st.en, st.th || '', st.en, st.id)}
                    style={{ padding: '6px 10px', fontSize: 'var(--font-size-xs)' }}
                  >
                    {isSaved ? (
                      <>
                        <Check size={14} color="var(--color-primary)" />
                        <span>บันทึกแล้ว</span>
                      </>
                    ) : (
                      <>
                        <Bookmark size={14} />
                        <span>เก็บเข้า My Phrases</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* In-Place Audio Recording Playback, Live Transcript & Evaluation */}
                {isRecordingThis && recordState === 'recording' && liveTranscript && (
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--color-primary)',
                      fontStyle: 'italic',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--color-primary-soft)',
                      marginTop: '4px',
                    }}
                  >
                    ได้ยิน: "{liveTranscript}"
                  </div>
                )}

                {isRecordingThis && pronunciationResults[st.id] && (
                  <div style={{ marginTop: '8px' }}>
                    <PronunciationFeedbackCard
                      result={pronunciationResults[st.id]}
                      recordedAudioUrl={recordAudioUrl}
                      onPlayRecorded={handlePlayRecorded}
                      isPlayingRecorded={recordState === 'playing'}
                      onRetry={handleResetRecord}
                      onRequestKeySetup={() => setIsNoKeyModalOpen(true)}
                    />
                  </div>
                )}

                {isRecordingThis && !pronunciationResults[st.id] && (recordState === 'recorded' || recordState === 'playing') && (
                  <div
                    style={{
                      marginTop: '6px',
                      padding: '10px 14px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text)' }}>
                      เสียงที่คุณฝึกพูด:
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button variant="secondary" size="sm" onClick={handlePlayRecorded}>
                        <Volume2 size={14} />
                        <span>{recordState === 'playing' ? 'กำลังเล่น...' : 'ฟังเสียงตัวเอง'}</span>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleResetRecord}>
                        <RotateCcw size={14} />
                        <span>ลองใหม่อีกครั้ง</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Target Phrases Showcase */}
      {resource.targetPhrases.length > 0 && (
        <Card padding="lg">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
            <Bookmark size={18} color="var(--color-primary)" />
            <h2 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text)' }}>
              วลีเด่นจากสื่อนี้ (Target Phrases)
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 'var(--space-sm)',
            }}
          >
            {resource.targetPhrases.map((phrase: TargetPhrase) => {
              const isSaved = savedPhraseIds.has(phrase.id);

              return (
                <div
                  key={phrase.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-control)',
                    backgroundColor: '#FAFCFA',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: 'var(--font-size-base)' }}>
                      {phrase.en}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                      {phrase.th}
                    </div>
                    {phrase.example && (
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: '4px' }}>
                        "{phrase.example}"
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      size="sm"
                      variant={isSaved ? 'secondary' : 'outline'}
                      disabled={isSaved}
                      onClick={() => handleSavePhraseToBank(phrase.en, phrase.th, phrase.example, phrase.id)}
                      style={{ padding: '4px 10px', fontSize: 'var(--font-size-xs)' }}
                    >
                      {isSaved ? (
                        <>
                          <Check size={13} /> อยู่ในคลังแล้ว
                        </>
                      ) : (
                        <>
                          <Bookmark size={13} /> เก็บคำนี้เข้าคลัง
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Reflection Question */}
      <Card padding="lg">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-sm)' }}>
          <MessageSquare size={18} color="var(--color-primary)" />
          <h2 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text)' }}>
            ฝึกคิดและเขียนสรุป (Self-Reflection)
          </h2>
        </div>

        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)' }}>
          {resource.reflectionQuestion || 'คุณได้ข้อคิดหรือนำภาษาอังกฤษประโยคไหนไปใช้ต่อจากสื่อนี้บ้าง?'}
        </p>

        <textarea
          rows={3}
          value={reflectionText}
          onChange={(e) => setReflectionText(e.target.value)}
          placeholder="ลองเขียนบันทึกความคิดเห็นหรือคำศัพท์ใหม่สั้นๆ เป็นภาษาอังกฤษ..."
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 'var(--radius-control)',
            border: '1px solid var(--color-border)',
            outline: 'none',
            fontSize: 'var(--font-size-base)',
            resize: 'vertical',
            lineHeight: 1.5,
            marginBottom: 'var(--space-md)',
          }}
        />

        {/* AI Coach Action & Feedback */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: 'var(--space-md)' }}>
          <Button
            variant="secondary"
            size="sm"
            disabled={isLoadingAI || !reflectionText.trim()}
            onClick={handleAskAICoach}
          >
            <Sparkles size={15} /> {isLoadingAI ? 'AI Coach กำลังวิเคราะห์...' : 'ให้ AI Coach ช่วยตรวจความคิดเห็น'}
          </Button>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            * ตรวจและแนะนำสำนวนภาษาอังกฤษให้ดูเป็นธรรมชาติ
          </span>
        </div>

        {aiFeedback && (
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <AICoachFeedbackCard
              feedback={aiFeedback}
              title="คำแนะนำความคิดเห็นจาก AI Coach"
              onDismiss={() => setAiFeedback(null)}
            />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button size="lg" onClick={handleFinishStudy}>
            <Check size={18} /> จบการศึกษาจากสื่อนี้
          </Button>
        </div>
      </Card>

      {/* Quick API Key Modal */}
      <Modal
        isOpen={isNoKeyModalOpen}
        onClose={() => setIsNoKeyModalOpen(false)}
        title="เปิดใช้งานผู้ช่วย AI Coach (Google Gemini)"
        description="ใส่ Gemini API Key ของคุณเพื่อเริ่มใช้งานระบบตรวจประโยคและแนะนำสำนวนภาษาอังกฤษ"
      >
        <form onSubmit={handleSaveQuickKey} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: '#F8F9F5',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--color-text-muted)',
              lineHeight: 1.5,
            }}
          >
            🔒 <strong>ความเป็นส่วนตัว:</strong> คีย์จะถูกบันทึกไว้ใน Browser LocalStorage ของเครื่องคุณเท่านั้น
            <div style={{ marginTop: '4px' }}>
              ✨ รับ API Key ฟรีได้ที่{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'underline' }}
              >
                Google AI Studio
              </a>
            </div>
          </div>

          <div>
            <label
              htmlFor="resource-quick-key"
              style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '6px' }}
            >
              Google Gemini API Key:
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Key size={16} color="var(--color-text-muted)" style={{ position: 'absolute', left: '12px' }} />
              <input
                id="resource-quick-key"
                type="password"
                value={quickApiKey}
                onChange={(e) => setQuickApiKey(e.target.value)}
                placeholder="AIzaSy..."
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: 'var(--radius-control)',
                  border: '1px solid var(--color-border)',
                  outline: 'none',
                  fontSize: 'var(--font-size-sm)',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: 'var(--space-sm)' }}>
            <Button variant="outline" type="button" onClick={() => setIsNoKeyModalOpen(false)}>
              ยกเลิก
            </Button>
            <Button variant="primary" type="submit" disabled={!quickApiKey.trim()}>
              บันทึกและให้ AI ตรวจ
            </Button>
          </div>
        </form>
      </Modal>

      {/* Completion Banner */}
      {isCompleted && (
        <Card
          padding="lg"
          style={{
            textAlign: 'center',
            backgroundColor: '#F5FAF7',
            border: '1.5px solid var(--color-primary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-md)',
          }}
        >
          <Badge variant="success" icon={<Check size={14} />}>
            ศึกษาเรียบร้อยแล้ว
          </Badge>
          <h3 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--color-text)' }}>
            ยอดเยี่ยมมากครับ! คุณได้ฝึกฝนภาษาอังกฤษจากสื่อจริง
          </h3>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', maxWidth: '500px' }}>
            เวลาฝึกฝนในครั้งนี้: {formatDurationThai(activeSeconds)} | คำศัพท์ที่เก็บเข้าคลัง: {savedPhraseIds.size} รายการ
            (สามารถเข้าไปทบทวนได้ในเมนู My Phrases)
          </p>
          <Button onClick={onExit} style={{ marginTop: '8px' }}>
            กลับไปหน้ารวมสื่อ
          </Button>
        </Card>
      )}

      {/* Toast Notification */}
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
    </div>
  );
};

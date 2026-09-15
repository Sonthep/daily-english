import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import {
  Lesson,
  Session,
  LessonStep,
  ReviewEvent,
  UserAnswer,
} from '../../types';
import {
  sessionRepo,
  phraseRepo,
  reviewRepo,
} from '../../lib/storage/repositories';
import { speechService } from '../../lib/audio/speech';
import { AudioRecorder, RecorderError } from '../../lib/audio/recorder';
import { speechRecognitionService } from '../../lib/audio/recognition';
import { evaluatePronunciation, PronunciationScoreResult } from '../../lib/audio/pronunciationMatcher';
import { PronunciationFeedbackCard } from '../../components/audio/PronunciationFeedbackCard';
import { calculateNextReview, createNewPhrase } from '../../lib/review/scheduler';
import { formatDurationThai } from '../../lib/review/dateUtils';
import { getActiveTutorProvider, getStoredGeminiApiKey, setStoredGeminiApiKey } from '../../lib/ai/provider';
import { TextFeedbackResponse } from '../../lib/ai/types';
import { AICoachFeedbackCard } from '../../components/ai/AICoachFeedbackCard';
import {
  ArrowLeft,
  Volume2,
  Square,
  RotateCcw,
  Check,
  Eye,
  EyeOff,
  Mic,
  MicOff,
  Sparkles,
  Award,
  ChevronRight,
  HelpCircle,
  Key,
  ExternalLink,
} from 'lucide-react';

export interface LessonScreenProps {
  lesson: Lesson;
  initialModeMinutes: 5 | 15;
  onExit: () => void;
}

export const LessonScreen: React.FC<LessonScreenProps> = ({
  lesson,
  initialModeMinutes,
  onExit,
}) => {
  // Session State
  const [session, setSession] = useState<Session | null>(null);
  const [currentStep, setCurrentStep] = useState<LessonStep>('listen');
  const [itemIndex, setItemIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [reviewedPhraseIds, setReviewedPhraseIds] = useState<string[]>([]);
  const [activeSeconds, setActiveSeconds] = useState<number>(0);

  // Audio Playback State (Listen)
  const [speechRate, setSpeechRate] = useState<0.75 | 1.0>(1.0);
  const [isPlayingSpeech, setIsPlayingSpeech] = useState<boolean>(false);
  const [showTranscript, setShowTranscript] = useState<boolean>(true);
  const [showTranslation, setShowTranslation] = useState<boolean>(true);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);

  // Audio Recording State (Repeat)
  const [recorder] = useState<AudioRecorder>(() => new AudioRecorder());
  const [recordState, setRecordState] = useState<'idle' | 'recording' | 'recorded' | 'playing'>('idle');
  const [recordAudioUrl, setRecordAudioUrl] = useState<string | null>(null);
  const [micError, setMicError] = useState<RecorderError | null>(null);
  const [typedFallbackText, setTypedFallbackText] = useState<string>('');
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [pronunciationResults, setPronunciationResults] = useState<Record<number, PronunciationScoreResult>>({});

  // Use It State
  const [showSampleAnswer, setShowSampleAnswer] = useState<boolean>(false);
  const [aiFeedbacks, setAiFeedbacks] = useState<Record<string, TextFeedbackResponse>>({});
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);
  const [isNoKeyModalOpen, setIsNoKeyModalOpen] = useState<boolean>(false);
  const [quickApiKey, setQuickApiKey] = useState<string>('');

  // Review State
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // Confirm Exit Modal
  const [isExitModalOpen, setIsExitModalOpen] = useState<boolean>(false);

  // Slice content based on mode (5 min vs 15 min)
  const sentenceCount = initialModeMinutes === 5 ? 1 : Math.min(3, lesson.sentences.length);
  const activeSentences = lesson.sentences.slice(0, sentenceCount);

  const promptCount = initialModeMinutes === 5 ? 1 : Math.min(2, lesson.prompts.length);
  const activePrompts = lesson.prompts.slice(0, promptCount);

  const phraseCount = initialModeMinutes === 5 ? 3 : Math.min(5, lesson.targetPhrases.length);
  const activePhrases = lesson.targetPhrases.slice(0, phraseCount);

  // 1. Initialize or Resume Session
  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      // Check for an existing incomplete session
      const existing = await sessionRepo.getActiveSession(lesson.id);
      if (existing && isMounted) {
        setSession(existing);
        setCurrentStep(existing.currentStep);
        setItemIndex(existing.currentItemIndex || 0);
        setActiveSeconds(existing.activeDurationSeconds || 0);
        setReviewedPhraseIds(existing.reviewedPhraseIds || []);

        // Restore answers
        const ansMap: Record<string, string> = {};
        (existing.answers || []).forEach((a) => {
          ansMap[a.promptId] = a.answerText;
        });
        setUserAnswers(ansMap);
      } else if (isMounted) {
        const newSession: Session = {
          id: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          lessonId: lesson.id,
          modeMinutes: initialModeMinutes,
          currentStep: 'listen',
          currentItemIndex: 0,
          answers: [],
          reviewedPhraseIds: [],
          activeDurationSeconds: 0,
          startedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: null,
        };
        await sessionRepo.saveSession(newSession);
        setSession(newSession);
      }

      // Check speech support
      const support = speechService.checkSupport();
      if (!support.supported) {
        setSpeechNotice('เบราว์เซอร์นี้ไม่รองรับ Web Speech API แต่คุณยังสามารถอ่านประโยคและฝึกต่อได้ครับ');
      } else if (!support.hasEnglishVoice) {
        setSpeechNotice('ไม่พบเสียงภาษาอังกฤษในระบบ อาจใช้เสียงมาตรฐานของระบบปฏิบัติการแทน');
      }
    };

    initSession();

    return () => {
      isMounted = false;
      speechService.stop();
      speechRecognitionService.abort();
      recorder.cleanup();
    };
  }, [lesson.id, initialModeMinutes]);

  // 2. Active Duration Timer (Stops when tab is hidden!)
  useEffect(() => {
    if (currentStep === 'summary') return; // Don't add more study time on summary

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        setActiveSeconds((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentStep]);

  // 3. Save progress to IndexedDB on step or item change
  useEffect(() => {
    if (!session || currentStep === 'summary') return;

    const answersArray: UserAnswer[] = Object.entries(userAnswers).map(([promptId, answerText]) => ({
      promptId,
      answerText,
      answeredAt: new Date().toISOString(),
    }));

    const updated: Session = {
      ...session,
      currentStep,
      currentItemIndex: itemIndex,
      answers: answersArray,
      reviewedPhraseIds,
      activeDurationSeconds: activeSeconds,
      updatedAt: new Date().toISOString(),
    };

    sessionRepo.saveSession(updated);
  }, [currentStep, itemIndex, userAnswers, reviewedPhraseIds, activeSeconds]);

  // 4. Trigger celebration confetti on summary
  useEffect(() => {
    if (currentStep === 'summary') {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#245C4F', '#E7F0EA', '#F7E8D7'],
        });
      } catch {
        // Safe ignore
      }
    }
  }, [currentStep]);

  // Speech Helper
  const handlePlaySpeech = (text: string) => {
    setIsPlayingSpeech(true);
    speechService.speak(
      text,
      speechRate,
      () => setIsPlayingSpeech(false),
      () => setIsPlayingSpeech(false)
    );
  };

  const handleStopSpeech = () => {
    speechService.stop();
    setIsPlayingSpeech(false);
  };

  // Recording Helpers
  const handleStartRecord = async () => {
    setMicError(null);
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

  const handleStopRecord = async () => {
    const url = await recorder.stop();
    const finalTranscript = speechRecognitionService.stop() || liveTranscript;
    setRecordAudioUrl(url);
    setRecordState('recorded');

    const target = activeSentences[itemIndex]?.en;
    if (target) {
      const evaluation = evaluatePronunciation(target, finalTranscript || '');
      setPronunciationResults((prev) => ({
        ...prev,
        [itemIndex]: evaluation,
      }));
    }
  };

  const handleEvaluateTyped = () => {
    const target = activeSentences[itemIndex]?.en;
    if (!target || !typedFallbackText.trim()) return;
    const evaluation = evaluatePronunciation(target, typedFallbackText.trim());
    setPronunciationResults((prev) => ({
      ...prev,
      [itemIndex]: evaluation,
    }));
  };

  const handlePlayRecorded = () => {
    if (!recordAudioUrl) return;
    setRecordState('playing');
    recorder.play(
      () => setRecordState('recorded'),
      () => setRecordState('recorded')
    );
  };

  // AI Coach Helpers
  const handleAskAICoach = async () => {
    const currentPrompt = activePrompts[itemIndex];
    if (!currentPrompt) return;
    const answer = (userAnswers[currentPrompt.id] || '').trim();
    if (!answer) return;

    const key = getStoredGeminiApiKey();
    if (!key) {
      setIsNoKeyModalOpen(true);
      return;
    }

    setIsLoadingAI(true);
    try {
      const provider = getActiveTutorProvider();
      const feedback = await provider.getFeedback(
        currentPrompt.questionEn,
        currentPrompt.questionTh,
        answer,
        currentPrompt.sampleAnswer
      );
      setAiFeedbacks((prev) => ({
        ...prev,
        [currentPrompt.id]: feedback,
      }));
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleSaveQuickKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickApiKey.trim()) {
      setStoredGeminiApiKey(quickApiKey.trim());
      setIsNoKeyModalOpen(false);
      // Automatically trigger coach after saving
      setTimeout(() => {
        handleAskAICoach();
      }, 100);
    }
  };

  const handleResetRecord = () => {
    recorder.cleanup();
    speechRecognitionService.abort();
    setRecordAudioUrl(null);
    setRecordState('idle');
    setMicError(null);
    setLiveTranscript('');
    setPronunciationResults((prev) => {
      const next = { ...prev };
      delete next[itemIndex];
      return next;
    });
  };

  // Review Helpers
  const handleReviewAnswer = async (result: 'again' | 'remembered') => {
    const currentTarget = activePhrases[itemIndex];
    if (!currentTarget) return;

    // Check if phrase already exists in repository
    const allPhrases = await phraseRepo.getAllPhrases();
    let existing = allPhrases.find(
      (p) => p.en.toLowerCase() === currentTarget.en.toLowerCase()
    );

    const now = new Date();
    let newStage = 0;
    let nextDue = now.toISOString();

    if (existing) {
      const calc = calculateNextReview(existing.reviewStage, result, now);
      newStage = calc.nextStage;
      nextDue = calc.dueAt;
      existing = {
        ...existing,
        reviewStage: newStage,
        dueAt: nextDue,
        updatedAt: now.toISOString(),
      };
      await phraseRepo.savePhrase(existing);
    } else {
      // Create new phrase
      const initial = createNewPhrase(
        currentTarget.en,
        currentTarget.th,
        currentTarget.example,
        currentTarget.category,
        lesson.id,
        now
      );
      const calc = calculateNextReview(0, result, now);
      newStage = calc.nextStage;
      nextDue = calc.dueAt;
      initial.reviewStage = newStage;
      initial.dueAt = nextDue;
      await phraseRepo.savePhrase(initial);
      existing = initial;
    }

    // Record review event
    const event: ReviewEvent = {
      id: `re_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      phraseId: existing.id,
      result,
      reviewedAt: now.toISOString(),
      previousStage: existing.reviewStage,
      nextStage: newStage,
    };
    await reviewRepo.recordReviewEvent(event);

    setReviewedPhraseIds((prev) => [...prev, currentTarget.id]);

    // Move to next phrase or summary
    setIsFlipped(false);
    if (itemIndex + 1 < activePhrases.length) {
      setItemIndex((prev) => prev + 1);
    } else {
      // Complete lesson session idempotently
      if (session) {
        const completed: Session = {
          ...session,
          currentStep: 'summary',
          currentItemIndex: 0,
          activeDurationSeconds: activeSeconds,
          completedAt: session.completedAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await sessionRepo.completeSession(completed);
        setSession(completed);
      }
      setCurrentStep('summary');
    }
  };

  const stepsList: { id: LessonStep; label: string }[] = [
    { id: 'listen', label: '1. ฟัง (Listen)' },
    { id: 'repeat', label: '2. พูดตาม (Repeat)' },
    { id: 'use_it', label: '3. ใช้จริง (Use it)' },
    { id: 'review', label: '4. ทบทวน (Review)' },
    { id: 'summary', label: '5. สรุปผล (Summary)' },
  ];

  return (
    <div
      style={{
        maxWidth: 'var(--lesson-max-width)',
        margin: '0 auto',
        padding: 'var(--space-base) var(--space-base) var(--space-2xl)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-lg)',
        minHeight: '100vh',
      }}
    >
      {/* Top Navigation & Step Indicator */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (currentStep !== 'summary') {
                setIsExitModalOpen(true);
              } else {
                onExit();
              }
            }}
            style={{ padding: '6px 12px' }}
          >
            <ArrowLeft size={18} />
            <span>ออกจากการฝึก</span>
          </Button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Badge variant="primary">{initialModeMinutes} นาที</Badge>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              {formatDurationThai(activeSeconds)}
            </span>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div
          role="tablist"
          aria-label="ขั้นตอนการเรียน"
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '2px',
          }}
        >
          {stepsList.map((st, idx) => {
            const stepOrder: LessonStep[] = ['listen', 'repeat', 'use_it', 'review', 'summary'];
            const currentIndex = stepOrder.indexOf(currentStep);
            const isCompleted = idx < currentIndex;
            const isCurrent = st.id === currentStep;

            return (
              <div
                key={st.id}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  minWidth: '70px',
                }}
              >
                <div
                  style={{
                    height: '4px',
                    borderRadius: '2px',
                    backgroundColor: isCompleted || isCurrent ? 'var(--color-primary)' : 'var(--color-border)',
                  }}
                />
                <span
                  style={{
                    fontSize: '11px',
                    color: isCurrent ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    fontWeight: isCurrent ? 600 : 400,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 1: LISTEN */}
      {currentStep === 'listen' && (
        <Card padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <Badge variant="primary">ขั้นตอนที่ 1 : ฟัง (Listen)</Badge>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                ประโยคที่ {itemIndex + 1} จาก {activeSentences.length}
              </span>
            </div>
            <h2 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--color-text)' }}>
              ฟังสำเนียงและจังหวะการออกเสียง
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
              กดปุ่มฟังเพื่อฟังเสียงอ่านภาษาอังกฤษ ปรับความเร็วและซ่อนคำแปลเพื่อฝึกการฟัง
            </p>
          </div>

          {speechNotice && (
            <div
              style={{
                backgroundColor: 'var(--color-accent-soft)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-control)',
                fontSize: 'var(--font-size-sm)',
                color: '#7D4F1E',
              }}
            >
              {speechNotice}
            </div>
          )}

          {/* Sentence Display Card */}
          <div
            style={{
              padding: 'var(--space-lg)',
              borderRadius: 'var(--radius-control)',
              backgroundColor: '#FAFCFA',
              border: '1.5px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-md)',
              textAlign: 'center',
            }}
          >
            {/* English Sentence */}
            <div style={{ minHeight: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {showTranscript ? (
                <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600, color: 'var(--color-text)' }}>
                  {activeSentences[itemIndex]?.en}
                </div>
              ) : (
                <div style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: 'var(--font-size-sm)' }}>
                  (ซ่อนข้อความภาษาอังกฤษอยู่ กดปุ่มด้านล่างเพื่อเปิดดู)
                </div>
              )}
            </div>

            {/* Thai Translation */}
            {showTranslation && (
              <div style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-muted)' }}>
                {activeSentences[itemIndex]?.th}
              </div>
            )}
          </div>

          {/* Controls: Speed, Play Audio, Toggle Visibility */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              borderTop: '1px solid var(--color-border)',
              paddingTop: 'var(--space-md)',
            }}
          >
            {/* Speed Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>ความเร็ว:</span>
              <button
                onClick={() => setSpeechRate(0.75)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: speechRate === 0.75 ? 'var(--color-primary-soft)' : '#FFFFFF',
                  color: speechRate === 0.75 ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  fontWeight: speechRate === 0.75 ? 600 : 400,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                0.75x
              </button>
              <button
                onClick={() => setSpeechRate(1.0)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: speechRate === 1.0 ? 'var(--color-primary-soft)' : '#FFFFFF',
                  color: speechRate === 1.0 ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  fontWeight: speechRate === 1.0 ? 600 : 400,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                1.0x
              </button>
            </div>

            {/* View Toggles */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTranscript((prev) => !prev)}
                title="ซ่อน/แสดงข้อความภาษาอังกฤษ"
              >
                {showTranscript ? <EyeOff size={15} /> : <Eye size={15} />}
                <span>{showTranscript ? 'ซ่อนคำอ่าน' : 'เปิดคำอ่าน'}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTranslation((prev) => !prev)}
                title="ซ่อน/แสดงคำแปลไทย"
              >
                <span>{showTranslation ? 'ซ่อนคำแปล' : 'เปิดคำแปล'}</span>
              </Button>
            </div>
          </div>

          {/* Action Bar */}
          <div style={{ display: 'flex', gap: '12px', marginTop: 'var(--space-sm)' }}>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                if (isPlayingSpeech) {
                  handleStopSpeech();
                } else {
                  handlePlaySpeech(activeSentences[itemIndex]?.en || '');
                }
              }}
              style={{ flex: 1 }}
            >
              {isPlayingSpeech ? (
                <>
                  <Square size={18} /> หยุดฟัง
                </>
              ) : (
                <>
                  <Volume2 size={18} /> ฟังเสียงอ่าน
                </>
              )}
            </Button>

            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                handleStopSpeech();
                if (itemIndex + 1 < activeSentences.length) {
                  setItemIndex((prev) => prev + 1);
                } else {
                  setCurrentStep('repeat');
                  setItemIndex(0);
                }
              }}
              style={{ flex: 1.2 }}
            >
              <span>ต่อไป (ฝึกพูดตาม)</span>
              <ChevronRight size={18} />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 2: REPEAT */}
      {currentStep === 'repeat' && (
        <Card padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <Badge variant="primary">ขั้นตอนที่ 2 : พูดตาม (Repeat)</Badge>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                ประโยคที่ {itemIndex + 1} จาก {activeSentences.length}
              </span>
            </div>
            <h2 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--color-text)' }}>
              ฝึกออกเสียงและฟังเสียงของตัวเอง
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
              กดปุ่มอัดเสียงแล้วพูดตามประโยค หรือใช้โหมดพิมพ์หากอยู่ในที่ที่ไม่สะดวกพูด
            </p>
          </div>

          {/* Target Sentence */}
          <div
            style={{
              padding: 'var(--space-lg)',
              borderRadius: 'var(--radius-control)',
              backgroundColor: '#FAFCFA',
              border: '1.5px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-sm)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600, color: 'var(--color-text)' }}>
              {activeSentences[itemIndex]?.en}
            </div>
            <div style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-muted)' }}>
              {activeSentences[itemIndex]?.th}
            </div>

            <div style={{ marginTop: '8px' }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePlaySpeech(activeSentences[itemIndex]?.en || '')}
              >
                <Volume2 size={16} /> ฟังเสียงต้นแบบอีกครั้ง
              </Button>
            </div>
          </div>

          {/* Microphone Denial or Error Notification */}
          {micError && (
            <div
              style={{
                backgroundColor: 'var(--color-accent-soft)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-control)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}
            >
              <MicOff size={20} color="#7D4F1E" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: '#7D4F1E' }}>
                  การใช้งานไมโครโฟน
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: '#7D4F1E' }}>
                  {micError.message}
                </div>
              </div>
            </div>
          )}

          {/* Recording / Typed Input Area */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-lg)',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-control)',
              border: '1px dashed var(--color-border)',
              gap: 'var(--space-md)',
            }}
          >
            {/* If Mic is working */}
            {!micError && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                {recordState === 'idle' && (
                  <Button
                    size="lg"
                    onClick={handleStartRecord}
                    style={{
                      borderRadius: '50px',
                      padding: '16px 28px',
                      backgroundColor: 'var(--color-primary)',
                    }}
                  >
                    <Mic size={20} /> กดเพื่อเริ่มอัดเสียง
                  </Button>
                )}

                {recordState === 'recording' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-error)' }}>
                      <span
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--color-error)',
                          display: 'inline-block',
                          animation: 'pulse 1s infinite',
                        }}
                      />
                      <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                        กำลังอัดเสียง... พูดตามประโยคได้เลย
                      </span>
                    </div>

                    {liveTranscript && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--color-primary)',
                          fontStyle: 'italic',
                          textAlign: 'center',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--color-primary-soft)',
                          maxWidth: '400px',
                        }}
                      >
                        ได้ยิน: "{liveTranscript}"
                      </div>
                    )}

                    <Button variant="danger" size="lg" onClick={handleStopRecord}>
                      <Square size={18} /> หยุดอัดเสียง
                    </Button>
                  </div>
                )}

                {(recordState === 'recorded' || recordState === 'playing') && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                    <Button variant="secondary" size="md" onClick={handlePlayRecorded}>
                      <Volume2 size={18} />
                      {recordState === 'playing' ? 'กำลังเล่นเสียงคุณ...' : 'ฟังเสียงตัวเอง'}
                    </Button>
                    <Button variant="outline" size="md" onClick={handleResetRecord}>
                      <RotateCcw size={16} /> อัดใหม่อีกครั้ง
                    </Button>
                  </div>
                )}

                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                  * บันทึกเสียงในหน่วยความจำเท่านั้น จะไม่ถูกบันทึกถาวรหรือส่งออกนอกเครื่อง
                </div>
              </div>
            )}

            {/* Pronunciation Feedback Card Display */}
            {pronunciationResults[itemIndex] && (
              <div style={{ width: '100%', marginTop: '4px' }}>
                <PronunciationFeedbackCard
                  result={pronunciationResults[itemIndex]}
                  recordedAudioUrl={recordAudioUrl}
                  onPlayRecorded={handlePlayRecorded}
                  isPlayingRecorded={recordState === 'playing'}
                  onRetry={handleResetRecord}
                  onRequestKeySetup={() => setIsNoKeyModalOpen(true)}
                />
              </div>
            )}

            {/* Typed Fallback Input (Always available or when mic denied) */}
            <div style={{ width: '100%', borderTop: !micError ? '1px solid var(--color-border)' : 'none', paddingTop: !micError ? 'var(--space-md)' : 0 }}>
              <label
                htmlFor="typed-repeat-input"
                style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: '6px' }}
              >
                ฝึกพิมพ์ตอบตามประโยค (Typed Fallback):
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  id="typed-repeat-input"
                  type="text"
                  value={typedFallbackText}
                  onChange={(e) => setTypedFallbackText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && typedFallbackText.trim()) {
                      e.preventDefault();
                      handleEvaluateTyped();
                    }
                  }}
                  placeholder="พิมพ์ประโยคตามที่เห็นด้านบน..."
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-control)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: '#FFFFFF',
                    outline: 'none',
                    fontSize: 'var(--font-size-sm)',
                  }}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleEvaluateTyped}
                  disabled={!typedFallbackText.trim()}
                >
                  ตรวจคำตอบ
                </Button>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                handleResetRecord();
                setTypedFallbackText('');
                if (itemIndex + 1 < activeSentences.length) {
                  setItemIndex((prev) => prev + 1);
                } else {
                  setCurrentStep('use_it');
                  setItemIndex(0);
                }
              }}
              style={{ width: '100%' }}
            >
              <span>ต่อไป (ประยุกต์ใช้กับตัวเอง)</span>
              <ChevronRight size={18} />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 3: USE IT */}
      {currentStep === 'use_it' && (
        <Card padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <Badge variant="primary">ขั้นตอนที่ 3 : ใช้จริง (Use it)</Badge>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                คำถามที่ {itemIndex + 1} จาก {activePrompts.length}
              </span>
            </div>
            <h2 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--color-text)' }}>
              นำประโยคมาตอบเกี่ยวกับตัวคุณ
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
              พิมพ์คำตอบสั้นๆ ในแบบของคุณ แล้วกดเทียบกับตัวอย่างเพื่อประเมินตนเอง
            </p>
          </div>

          {/* Question Box */}
          <div
            style={{
              padding: 'var(--space-lg)',
              borderRadius: 'var(--radius-control)',
              backgroundColor: '#FAFCFA',
              border: '1.5px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--color-primary)' }}>
              {activePrompts[itemIndex]?.questionEn}
            </div>
            <div style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text)' }}>
              {activePrompts[itemIndex]?.questionTh}
            </div>
          </div>

          {/* User Answer Text Area */}
          <div>
            <label
              htmlFor="user-answer-input"
              style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '6px' }}
            >
              คำตอบของคุณเป็นภาษาอังกฤษ:
            </label>
            <textarea
              id="user-answer-input"
              rows={3}
              value={userAnswers[activePrompts[itemIndex]?.id || ''] || ''}
              onChange={(e) => {
                const val = e.target.value;
                setUserAnswers((prev) => ({
                  ...prev,
                  [activePrompts[itemIndex]?.id || '']: val,
                }));
              }}
              placeholder="ลองตอบสั้นๆ เช่น Today I designed..."
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--color-border)',
                backgroundColor: '#FFFFFF',
                outline: 'none',
                fontSize: 'var(--font-size-base)',
                resize: 'vertical',
                lineHeight: 1.5,
              }}
            />
          </div>

          {/* Sample Answer & AI Coach */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Button
                variant="secondary"
                size="sm"
                disabled={isLoadingAI || !(userAnswers[activePrompts[itemIndex]?.id || '']?.trim())}
                onClick={handleAskAICoach}
              >
                <Sparkles size={16} /> {isLoadingAI ? 'AI Coach กำลังวิเคราะห์...' : 'ขอคำแนะนำจาก AI Coach'}
              </Button>

              {!showSampleAnswer ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSampleAnswer(true)}
                >
                  <HelpCircle size={16} /> ดูแนวทางการตอบ (Sample Answer)
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSampleAnswer(false)}
                >
                  ซ่อนแนวทางการตอบ
                </Button>
              )}
            </div>

            {/* AI Coach Feedback Card */}
            {activePrompts[itemIndex] && aiFeedbacks[activePrompts[itemIndex].id] && (
              <AICoachFeedbackCard
                feedback={aiFeedbacks[activePrompts[itemIndex].id]}
                onDismiss={() => {
                  setAiFeedbacks((prev) => {
                    const next = { ...prev };
                    delete next[activePrompts[itemIndex].id];
                    return next;
                  });
                }}
              />
            )}

            {showSampleAnswer && (
              <div
                style={{
                  padding: 'var(--space-md)',
                  borderRadius: 'var(--radius-control)',
                  backgroundColor: '#F5FAF7',
                  border: '1px solid rgba(36, 92, 79, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Badge variant="accent">ตัวอย่างแนวทางการตอบ</Badge>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    (ไม่ใช่การตรวจข้อสอบ ใช้สำหรับเทียบสำนวน)
                  </span>
                </div>
                <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--color-primary)' }}>
                  "{activePrompts[itemIndex]?.sampleAnswer}"
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '8px', marginTop: '4px' }}>
                  <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text)' }}>
                    เกณฑ์ตรวจสอบตนเอง (Self-Check):
                  </div>
                  <ul style={{ paddingLeft: '18px', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    <li>สื่อความหมายชัดเจนและตอบตรงประเด็นของคำถาม</li>
                    <li>ใช้คำกริยาหรือ Tense ที่เหมาะสม (เช่น สิ่งที่ทำไปแล้วใช้รูปอดีต)</li>
                    <li>ลองออกเสียงคำตอบของคุณออกเสียงเบาๆ เพื่อให้คุ้นปาก</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                setShowSampleAnswer(false);
                if (itemIndex + 1 < activePrompts.length) {
                  setItemIndex((prev) => prev + 1);
                } else {
                  setCurrentStep('review');
                  setItemIndex(0);
                  setIsFlipped(false);
                }
              }}
              style={{ width: '100%' }}
            >
              <span>ต่อไป (ทบทวนคำศัพท์สำคัญ)</span>
              <ChevronRight size={18} />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 4: REVIEW (FLASHCARDS) */}
      {currentStep === 'review' && (
        <Card padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <Badge variant="primary">ขั้นตอนที่ 4 : ทบทวน (Review)</Badge>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                วลีที่ {itemIndex + 1} จาก {activePhrases.length}
              </span>
            </div>
            <h2 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--color-text)' }}>
              ทบทวนวลีติดปากเข้าคลังคำศัพท์
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
              ลองนึกความหมายภาษาอังกฤษในใจก่อนเปิดเฉลย จากนั้นเลือกว่า "ยังจำไม่ได้" หรือ "จำได้" เพื่อให้ระบบตั้งรอบทบทวน
            </p>
          </div>

          {/* Flashcard Component */}
          <div
            onClick={() => !isFlipped && setIsFlipped(true)}
            style={{
              minHeight: '220px',
              padding: 'var(--space-xl)',
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
            {/* Front: Thai Prompt */}
            <div>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                ความหมายภาษาไทย
              </span>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 600, color: 'var(--color-text)', marginTop: '4px' }}>
                {activePhrases[itemIndex]?.th}
              </div>
            </div>

            {/* Back: English & Example (Shown only when revealed) */}
            {isFlipped ? (
              <div style={{ borderTop: '1px dashed var(--color-border)', paddingTop: 'var(--space-md)', width: '100%' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)', fontWeight: 600 }}>
                  เฉลยวลีภาษาอังกฤษ:
                </span>
                <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-primary)', marginTop: '2px' }}>
                  {activePhrases[itemIndex]?.en}
                </div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: '6px', fontStyle: 'italic' }}>
                  "{activePhrases[itemIndex]?.example}"
                </div>

                <div style={{ marginTop: '12px' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlaySpeech(activePhrases[itemIndex]?.en || '');
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
                  setIsFlipped(true);
                }}
              >
                <Eye size={16} /> เปิดดูเฉลย
              </Button>
            )}
          </div>

          {/* Outcome Action Buttons (Visible only after reveal) */}
          {isFlipped ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Button
                variant="danger"
                size="lg"
                onClick={() => handleReviewAnswer('again')}
              >
                <RotateCcw size={18} />
                <span>ยังจำไม่ได้ (นัด 10 นาที)</span>
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => handleReviewAnswer('remembered')}
              >
                <Check size={18} />
                <span>จำได้แล้ว (เลื่อนขั้น)</span>
              </Button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
              * กรุณาเปิดดูเฉลยก่อนเลือกผลลัพธ์
            </div>
          )}
        </Card>
      )}

      {/* STEP 5: SUMMARY */}
      {currentStep === 'summary' && (
        <Card padding="lg" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-soft)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Award size={36} />
            </div>

            <Badge variant="success" icon={<Sparkles size={13} />}>
              บทเรียนสำเร็จเรียบร้อย
            </Badge>

            <h1 style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-text)' }}>
              เยี่ยมมากครับ! คุณทำบทเรียนวันนี้สำเร็จแล้ว
            </h1>

            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-base)', maxWidth: '480px' }}>
              การฝึกฝนเพียงเล็กน้อยแต่ต่อเนื่องทุกวัน จะช่วยให้คุณพูดและใช้งานภาษาอังกฤษได้อย่างเป็นธรรมชาติ
            </p>
          </div>

          {/* Real Metrics Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              padding: 'var(--space-md)',
              borderRadius: 'var(--radius-control)',
              backgroundColor: '#FAFCFA',
              border: '1px solid var(--color-border)',
            }}
          >
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>เวลาฝึกจริง (Active Time)</div>
              <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-primary)' }}>
                {formatDurationThai(activeSeconds)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>บันทึกเข้าคลังคำศัพท์</div>
              <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-primary)' }}>
                {activePhrases.length} วลี
              </div>
            </div>
          </div>

          {/* Saved Phrases List */}
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
              วลีที่เก็บเข้าคลังคำศัพท์วันนี้:
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activePhrases.map((phrase) => (
                <div
                  key={phrase.id}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-control)',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--color-primary)', fontSize: 'var(--font-size-sm)' }}>
                      {phrase.en}
                    </span>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', marginLeft: '8px' }}>
                      — {phrase.th}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePlaySpeech(phrase.en)}
                    style={{ padding: '4px', minHeight: '32px' }}
                  >
                    <Volume2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Return Home Button */}
          <Button size="lg" onClick={onExit} style={{ marginTop: 'var(--space-md)' }}>
            กลับหน้าหลัก (Today)
          </Button>
        </Card>
      )}

      {/* Exit Confirmation Modal */}
      <Modal
        isOpen={isExitModalOpen}
        onClose={() => setIsExitModalOpen(false)}
        title="ต้องการออกจากการฝึกใช่หรือไม่?"
        description="ระบบได้บันทึกขั้นตอนล่าสุดไว้ในเครื่องแล้ว คุณสามารถกลับมาฝึกต่อจากจุดนี้ได้ตลอดเวลา"
      >
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: 'var(--space-md)' }}>
          <Button variant="outline" onClick={() => setIsExitModalOpen(false)}>
            ฝึกต่อ
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setIsExitModalOpen(false);
              onExit();
            }}
          >
            ยืนยันออก
          </Button>
        </div>
      </Modal>

      {/* Quick API Key Modal for AI Coach */}
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
              ✨ สามารถขอรับ API Key ฟรีได้ที่{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
              >
                Google AI Studio <ExternalLink size={12} />
              </a>
            </div>
          </div>

          <div>
            <label
              htmlFor="quick-gemini-key"
              style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '6px' }}
            >
              Google Gemini API Key:
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Key size={16} color="var(--color-text-muted)" style={{ position: 'absolute', left: '12px' }} />
              <input
                id="quick-gemini-key"
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
              ไว้ทีหลัง (ใช้ Sample Answer)
            </Button>
            <Button variant="primary" type="submit" disabled={!quickApiKey.trim()}>
              บันทึกและเริ่มใช้ AI Coach
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

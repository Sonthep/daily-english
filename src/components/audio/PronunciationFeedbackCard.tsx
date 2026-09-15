import React, { useState } from 'react';
import {
  Sparkles,
  Volume2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Mic,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { PronunciationScoreResult, EvaluatedWordToken } from '../../lib/audio/pronunciationMatcher';
import { PronunciationCoachingResponse } from '../../lib/ai/types';
import { getActivePronunciationProvider } from '../../lib/ai/provider';
import { speechService } from '../../lib/audio/speech';
import { getStoredGeminiApiKey } from '../../lib/ai/geminiProvider';

interface PronunciationFeedbackCardProps {
  result: PronunciationScoreResult;
  recordedAudioUrl: string | null;
  onPlayRecorded?: () => void;
  isPlayingRecorded?: boolean;
  onRetry?: () => void;
  onRequestKeySetup?: () => void;
}

export const PronunciationFeedbackCard: React.FC<PronunciationFeedbackCardProps> = ({
  result,
  recordedAudioUrl,
  onPlayRecorded,
  isPlayingRecorded = false,
  onRetry,
  onRequestKeySetup,
}) => {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<PronunciationCoachingResponse | null>(null);
  const [isExpandedTips, setIsExpandedTips] = useState(true);
  const [isPlayingNative, setIsPlayingNative] = useState(false);
  const [isPlayingDrill, setIsPlayingDrill] = useState(false);

  // Score coloring
  const getScoreColor = (score: number) => {
    if (score >= 90) return { text: '#1E6347', bg: '#E7F0EA', border: '#C2E0CC' };
    if (score >= 75) return { text: '#1565C0', bg: '#E3F2FD', border: '#BBDEFB' };
    if (score >= 50) return { text: '#B45309', bg: '#FEF3C7', border: '#FDE68A' };
    return { text: '#B91C1C', bg: '#FEE2E2', border: '#FECACA' };
  };

  const scoreTheme = getScoreColor(result.score);

  // Play native speaker TTS for whole target
  const handlePlayNative = () => {
    setIsPlayingNative(true);
    speechService.speak(
      result.targetSentence,
      1.0,
      () => setIsPlayingNative(false),
      () => setIsPlayingNative(false)
    );
  };

  // Play native speaker TTS for drill sentence
  const handlePlayDrill = (text: string) => {
    setIsPlayingDrill(true);
    speechService.speak(
      text,
      0.75,
      () => setIsPlayingDrill(false),
      () => setIsPlayingDrill(false)
    );
  };

  // Request AI coach deep phonetic analysis
  const handleAskAICoach = async () => {
    const key = getStoredGeminiApiKey();
    if (!key && onRequestKeySetup) {
      onRequestKeySetup();
    }

    setIsAiLoading(true);
    try {
      const provider = getActivePronunciationProvider();
      const feedback = await provider.getPronunciationFeedback(
        result.targetSentence,
        result.spokenTranscript,
        result.problemWords
      );
      setAiFeedback(feedback);
      setIsExpandedTips(true);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-md)',
        padding: 'var(--space-md)',
        borderRadius: 'var(--radius-card)',
        backgroundColor: '#FFFFFF',
        border: '1.5px solid var(--color-border)',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
        width: '100%',
        animation: 'fadeIn 0.3s ease',
      }}
    >
      {/* Header: Score Badge & Status Label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              backgroundColor: scoreTheme.bg,
              border: `1.5px solid ${scoreTheme.border}`,
              color: scoreTheme.text,
              fontSize: '18px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{result.score}%</span>
            <span style={{ fontSize: '11px', fontWeight: 600, opacity: 0.85 }}>Match</span>
          </div>

          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
              {result.statusLabel}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              ออกเสียงชัดเจน {result.matchedCount} จาก {result.totalTargetCount} คำ
            </div>
          </div>
        </div>

        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} style={{ padding: '6px 12px' }}>
            <RotateCcw size={14} />
            <span>ลองพูดใหม่อีกรอบ</span>
          </Button>
        )}
      </div>

      {/* Word-by-Word Interactive Token Chips */}
      <div>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--color-text-muted)',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          การวิเคราะห์คำต่อคำ (Word Accuracy):
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            padding: '12px',
            borderRadius: '10px',
            backgroundColor: '#F9FAF9',
            border: '1px solid var(--color-border)',
          }}
        >
          {result.tokens.map((token: EvaluatedWordToken, idx: number) => {
            let chipBg = '#E7F0EA';
            let chipText = '#1E6347';
            let chipBorder = '#C2E0CC';
            let icon = <CheckCircle2 size={13} color="#1E6347" />;

            if (token.status === 'near') {
              chipBg = '#FEF3C7';
              chipText = '#B45309';
              chipBorder = '#FDE68A';
              icon = <HelpCircle size={13} color="#B45309" />;
            } else if (token.status === 'missing') {
              chipBg = '#FEE2E2';
              chipText = '#B91C1C';
              chipBorder = '#FECACA';
              icon = <AlertCircle size={13} color="#B91C1C" />;
            }

            return (
              <div
                key={idx}
                title={
                  token.status === 'matched'
                    ? `ออกเสียงชัดเจน: "${token.cleanWord}"`
                    : token.status === 'near'
                    ? `ออกเสียงใกล้เคียง: ได้ยิน "${token.spokenWord || '-'}" แทน "${token.cleanWord}"`
                    : `คำนี้ยังไม่ชัดเจนหรือตกหล่น: "${token.cleanWord}"`
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  backgroundColor: chipBg,
                  border: `1px solid ${chipBorder}`,
                  color: chipText,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'help',
                }}
              >
                {icon}
                <span>{token.word}</span>
                {token.status === 'near' && token.spokenWord && (
                  <span style={{ fontSize: '10px', opacity: 0.8, fontStyle: 'italic' }}>
                    ({token.spokenWord})
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            marginTop: '6px',
            fontSize: '11px',
            color: 'var(--color-text-muted)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1E6347' }} />
            เขียว = ชัดเจนถูกต้อง
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#B45309' }} />
            ส้ม = ใกล้เคียง / กลืนเสียง
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#B91C1C' }} />
            แดง = ตกหล่น / ยังไม่ชัด
          </span>
        </div>
      </div>

      {/* Spoken Transcript Row */}
      {result.spokenTranscript && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            backgroundColor: '#F4F7F5',
            fontSize: '12px',
            color: 'var(--color-text)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
          }}
        >
          <Mic size={14} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--color-primary)' }} />
          <div>
            <span style={{ fontWeight: 600, color: 'var(--color-text-muted)', marginRight: '6px' }}>
              เสียงที่ระบบตรวจได้ยิน (What was heard):
            </span>
            <span style={{ fontStyle: 'italic' }}>"{result.spokenTranscript}"</span>
          </div>
        </div>
      )}

      {/* Audio Comparison Controls: Native vs My Voice */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          alignItems: 'center',
          paddingTop: '6px',
        }}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={handlePlayNative}
          style={{ padding: '6px 12px' }}
        >
          <Volume2 size={15} color="var(--color-primary)" />
          <span>{isPlayingNative ? 'กำลังเล่นเสียงต้นแบบ...' : 'ฟังเสียงต้นแบบ (Native)'}</span>
        </Button>

        {recordedAudioUrl && onPlayRecorded && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onPlayRecorded}
            style={{ padding: '6px 12px' }}
          >
            <Volume2 size={15} />
            <span>{isPlayingRecorded ? 'กำลังเล่นเสียงคุณ...' : 'ฟังเสียงตัวเอง (Your Voice)'}</span>
          </Button>
        )}

        {/* AI Coach Action Button */}
        {!aiFeedback && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleAskAICoach}
            disabled={isAiLoading}
            style={{
              marginLeft: 'auto',
              padding: '6px 14px',
              background: 'linear-gradient(135deg, #245C4F 0%, #174238 100%)',
              boxShadow: '0 2px 8px rgba(36, 92, 79, 0.25)',
            }}
          >
            <Sparkles size={15} />
            <span>{isAiLoading ? 'กำลังวิเคราะห์สัทศาสตร์...' : 'วิเคราะห์ด้วย AI Coach'}</span>
          </Button>
        )}
      </div>

      {/* Deep AI Coach Pronunciation Analysis Section */}
      {aiFeedback && (
        <div
          style={{
            marginTop: '8px',
            padding: '14px',
            borderRadius: '10px',
            backgroundColor: '#F7FAF8',
            border: '1px solid var(--color-primary-soft)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
            onClick={() => setIsExpandedTips(!isExpandedTips)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={13} color="#FFFFFF" />
              </div>
              <div>
                <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-primary)' }}>
                  คำแนะนำจาก AI Pronunciation Coach
                </span>
                <span style={{ marginLeft: '8px', fontSize: '10px' }}>
                  <Badge variant="primary">{aiFeedback.overallRating}</Badge>
                </span>
              </div>
            </div>

            <button
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
              }}
            >
              {isExpandedTips ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {isExpandedTips && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Pacing & Intonation Advice */}
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--color-border)',
                  fontSize: '12.5px',
                  color: 'var(--color-text)',
                  lineHeight: 1.5,
                }}
              >
                <strong style={{ color: 'var(--color-primary)' }}>จังหวะและการเชื่อมเสียง (Pacing & Stress): </strong>
                {aiFeedback.pacingAndIntonationTh}
              </div>

              {/* Problem Words Phonetic Table */}
              {aiFeedback.problemWordsTips.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                    จุดที่ควรเน้นเป็นพิเศษ (Phonetic Breakdown):
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {aiFeedback.problemWordsTips.map((tip, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '6px',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid var(--color-border)',
                          fontSize: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>
                            {tip.word}
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--color-accent-soft)',
                              color: '#7D4F1E',
                            }}
                          >
                            {tip.phoneticGuideTh}
                          </span>
                        </div>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '11.5px' }}>
                          {tip.tipTh}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Practice Drill Sentence */}
              {aiFeedback.practiceSentence && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#E7F0EA',
                    fontSize: '12px',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--color-primary)', marginRight: '6px' }}>
                      ประโยคซ้อมออกเสียง:
                    </span>
                    <span style={{ fontStyle: 'italic', fontWeight: 600 }}>
                      "{aiFeedback.practiceSentence}"
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePlayDrill(aiFeedback.practiceSentence)}
                    style={{ padding: '4px 8px', fontSize: '11px' }}
                  >
                    <Volume2 size={13} />
                    <span>{isPlayingDrill ? 'กำลังอ่าน...' : 'ฟังประโยคซ้อม'}</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { TextFeedbackResponse } from '../../lib/ai/types';
import { speechService } from '../../lib/audio/speech';
import { Sparkles, Volume2, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

export interface AICoachFeedbackCardProps {
  feedback: TextFeedbackResponse;
  title?: string;
  onDismiss?: () => void;
}

export const AICoachFeedbackCard: React.FC<AICoachFeedbackCardProps> = ({
  feedback,
  title = 'คำแนะนำจาก AI Coach',
  onDismiss,
}) => {
  const handleSpeak = (text: string) => {
    speechService.speak(text);
  };

  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '12px',
        backgroundColor: '#F5FAF7',
        border: '1.5px solid rgba(36, 92, 79, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Badge variant="primary" icon={<Sparkles size={12} />}>
            AI Coach
          </Badge>
          <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--color-text)' }}>
            {title}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {feedback.meaningUnderstood === true && (
            <Badge variant="success" icon={<CheckCircle size={12} />}>
              สื่อความหมายเข้าใจ 👍
            </Badge>
          )}
          {feedback.meaningUnderstood === false && (
            <Badge variant="accent" icon={<AlertCircle size={12} />}>
              ควรปรับความหมายเพิ่ม
            </Badge>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                fontSize: '12px',
                padding: '2px 6px',
              }}
            >
              ปิด
            </button>
          )}
        </div>
      </div>

      {/* Corrected / Natural Sentence */}
      {feedback.correctedSentence && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            padding: '12px 14px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '2px' }}>
              ประโยคแนะนำที่ฟังดูเป็นธรรมชาติ:
            </div>
            <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--color-primary)' }}>
              "{feedback.correctedSentence}"
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSpeak(feedback.correctedSentence!)}
            style={{ padding: '6px', minHeight: '32px', flexShrink: 0 }}
            title="ฟังเสียงอ่านของ AI"
          >
            <Volume2 size={18} color="var(--color-primary)" />
          </Button>
        </div>
      )}

      {/* Thai Explanation */}
      {feedback.explanationTh && (
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text)', lineHeight: 1.5 }}>
          {feedback.explanationTh}
        </div>
      )}

      {/* Detailed Corrections if any */}
      {feedback.corrections && feedback.corrections.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>
            จุดที่แนะนำให้ปรับปรุง:
          </div>
          {feedback.corrections.map((corr, idx) => (
            <div
              key={idx}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--color-border)',
                fontSize: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ textDecoration: 'line-through', color: 'var(--color-text-muted)' }}>
                  {corr.original}
                </span>
                <ArrowRight size={12} color="var(--color-primary)" />
                <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                  {corr.improved}
                </span>
              </div>
              {corr.reasonTh && (
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  เหตุผล: {corr.reasonTh}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Suggested Practice */}
      {feedback.suggestedRetry && feedback.suggestedRetry !== feedback.correctedSentence && (
        <div
          style={{
            borderTop: '1px solid var(--color-border)',
            paddingTop: '8px',
            fontSize: '12px',
            color: 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>ลองฝึกพูด: "{feedback.suggestedRetry}"</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSpeak(feedback.suggestedRetry!)}
            style={{ padding: '4px 6px', minHeight: '26px' }}
          >
            <Volume2 size={14} />
          </Button>
        </div>
      )}
    </div>
  );
};

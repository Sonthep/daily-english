import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Profile, Lesson, Session, Phrase, AppRoute } from '../../types';
import {
  profileRepo,
  lessonRepo,
  sessionRepo,
  phraseRepo,
} from '../../lib/storage/repositories';
import { formatThaiDate, getPast7DaysActivity, formatDurationThai } from '../../lib/review/dateUtils';
import {
  Play,
  RotateCcw,
  Headphones,
  Mic,
  MessageSquare,
  Sparkles,
  CalendarCheck,
  CheckCircle2,
  Bookmark,
  ArrowRight,
} from 'lucide-react';

export interface TodayScreenProps {
  onNavigate: (route: AppRoute) => void;
  onStartLesson: (lessonId: string, durationMinutes: 5 | 15) => void;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({
  onNavigate,
  onStartLesson,
}) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [todayLesson, setTodayLesson] = useState<Lesson | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [duePhrases, setDuePhrases] = useState<Phrase[]>([]);
  const [completedSessions, setCompletedSessions] = useState<Session[]>([]);
  const [durationMode, setDurationMode] = useState<5 | 15>(5);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const p = (await profileRepo.getProfile()) || (await profileRepo.initDefaultProfile());
      setProfile(p);
      setDurationMode(p.dailyMinutes || 5);

      const lessons = await lessonRepo.getAllLessons();
      // Select appropriate lesson for today based on profile goal or index
      let targetLesson = lessons[0];
      if (p.goals.includes('gaming')) {
        targetLesson = lessons.find((l) => l.category === 'Gaming') || lessons[0];
      } else if (p.goals.includes('daily')) {
        targetLesson = lessons.find((l) => l.category === 'Daily Life') || lessons[0];
      }
      setTodayLesson(targetLesson);

      if (targetLesson) {
        const session = await sessionRepo.getActiveSession(targetLesson.id);
        setActiveSession(session);
      }

      const due = await phraseRepo.getDuePhrases();
      setDuePhrases(due);

      const completed = await sessionRepo.getCompletedSessions();
      setCompletedSessions(completed);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDurationToggle = async (mode: 5 | 15) => {
    setDurationMode(mode);
    if (profile) {
      await profileRepo.saveProfile({ ...profile, dailyMinutes: mode });
    }
  };

  if (isLoading || !todayLesson) {
    return (
      <div style={{ padding: 'var(--space-2xl) 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        กำลังเตรียมข้อมูลสำหรับวันนี้...
      </div>
    );
  }

  const past7Days = getPast7DaysActivity(completedSessions, profile?.timezone || 'Asia/Bangkok');
  const greetingName = profile?.displayName || 'ปุ๊ก';
  const hasIncompleteSession = !!activeSession;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      {/* Top Bar: Date, Greeting, and Duration Switcher */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 'var(--space-base)',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-muted)',
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <CalendarCheck size={16} color="var(--color-primary)" />
            {formatThaiDate(new Date(), profile?.timezone || 'Asia/Bangkok')}
          </div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
            สวัสดี{greetingName} วันนี้ลองเล่างานที่ทำกัน
          </h1>
        </div>

        {/* 5 / 15 Minute Mode Switch */}
        <div
          role="group"
          aria-label="เลือกระยะเวลาฝึกฝน"
          style={{
            display: 'inline-flex',
            padding: '4px',
            backgroundColor: '#EFF3F0',
            borderRadius: 'var(--radius-control)',
            border: '1px solid var(--color-border)',
          }}
        >
          <button
            onClick={() => handleDurationToggle(5)}
            aria-pressed={durationMode === 5}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: durationMode === 5 ? '#FFFFFF' : 'transparent',
              color: durationMode === 5 ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: durationMode === 5 ? 600 : 400,
              boxShadow: durationMode === 5 ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer',
              fontSize: 'var(--font-size-sm)',
              minHeight: '36px',
              transition: 'all var(--transition-smooth)',
            }}
          >
            5 นาที
          </button>
          <button
            onClick={() => handleDurationToggle(15)}
            aria-pressed={durationMode === 15}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: durationMode === 15 ? '#FFFFFF' : 'transparent',
              color: durationMode === 15 ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: durationMode === 15 ? 600 : 400,
              boxShadow: durationMode === 15 ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer',
              fontSize: 'var(--font-size-sm)',
              minHeight: '36px',
              transition: 'all var(--transition-smooth)',
            }}
          >
            15 นาที
          </button>
        </div>
      </div>

      {/* Hero Card: 1-Click Start */}
      <Card
        variant="default"
        padding="lg"
        style={{
          border: '1.5px solid var(--color-border)',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F5FAF7 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <Badge variant="primary" icon={<Sparkles size={13} />}>
              {todayLesson.category}
            </Badge>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              โหมดแนะนำ: {durationMode} นาที
            </span>
          </div>

          <div>
            <h2 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--color-text)', marginBottom: '4px' }}>
              {todayLesson.titleTh}
            </h2>
            <div style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-text-muted)', fontWeight: 400 }}>
              {todayLesson.titleEn}
            </div>
          </div>

          <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text)', lineHeight: 1.6, maxWidth: '640px' }}>
            {todayLesson.objectiveTh}
          </p>

          <div style={{ paddingTop: 'var(--space-sm)' }}>
            <Button
              size="lg"
              onClick={() => onStartLesson(todayLesson.id, durationMode)}
              style={{ padding: '14px 28px', fontSize: 'var(--font-size-md)' }}
            >
              {hasIncompleteSession ? (
                <>
                  <RotateCcw size={19} /> ฝึกต่อจากเดิม
                </>
              ) : (
                <>
                  <Play size={19} fill="currentColor" /> เริ่มฝึกวันนี้
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Secondary Section: 4 Steps Today, Due Phrases, and 7-Day Consistency */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-lg)',
        }}
      >
        {/* Left: 4 Steps of Today */}
        <Card padding="md">
          <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-base)', color: 'var(--color-text)' }}>
            ขั้นตอนฝึกประจำวัน (4 ขั้นตอน)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { step: 1, icon: Headphones, title: 'ฟัง (Listen)', desc: 'จับสำเนียงและความเร็ว ปรับ 0.75x/1x ได้' },
              { step: 2, icon: Mic, title: 'พูดตาม (Repeat)', desc: 'อัดเสียงเพื่อฟังตัวเอง หรือพิมพ์ข้อความแทน' },
              { step: 3, icon: MessageSquare, title: 'ใช้จริง (Use it)', desc: 'ตอบคำถามเรื่องของตัวเอง เทียบตัวอย่าง' },
              { step: 4, icon: Bookmark, title: 'ทบทวน (Review)', desc: 'นึกคำศัพท์ก่อนเปิดเฉลย บันทึกเข้าคลัง' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-control)',
                    backgroundColor: '#FAFCFA',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-primary-soft)',
                      color: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--color-text)' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Right Column: Due Phrases & 7-Day Consistency */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* Due Phrases Card */}
          <Card padding="md" style={{ backgroundColor: duePhrases.length > 0 ? '#FAF7F2' : 'var(--color-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: 'var(--font-size-base)', color: 'var(--color-text)' }}>
                วลีที่ถึงกำหนดทบทวน
              </span>
              <Badge variant={duePhrases.length > 0 ? 'accent' : 'neutral'}>
                {duePhrases.length} วลี
              </Badge>
            </div>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)' }}>
              {duePhrases.length > 0
                ? 'มีคำศัพท์/วลีที่นัดหมายไว้ตาม Spaced Repetition พร้อมให้คุณทบทวน'
                : 'ยอดเยี่ยม! ยังไม่มีวลีที่ค้างทบทวนในตอนนี้ คุณสามารถฝึกบทเรียนเพื่อเก็บคำศัพท์ใหม่ได้'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate({ path: 'phrases' })}
              style={{ width: '100%', justifyContent: 'space-between' }}
            >
              <span>{duePhrases.length > 0 ? 'ไปที่คลังเพื่อทบทวน' : 'ดูคลังคำศัพท์ทั้งหมด'}</span>
              <ArrowRight size={15} />
            </Button>
          </Card>

          {/* 7-Day Consistency Dot Grid */}
          <Card padding="md">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontWeight: 600, fontSize: 'var(--font-size-base)', color: 'var(--color-text)' }}>
                ความต่อเนื่อง 7 วันล่าสุด
              </span>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                บันทึกตามจริง
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center' }}>
              {past7Days.map((day) => {
                const hasPractice = day.completedSessions > 0;
                return (
                  <div
                    key={day.dateKey}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '8px',
                      backgroundColor: day.isToday ? 'rgba(36, 92, 79, 0.08)' : 'transparent',
                      border: day.isToday ? '1px solid var(--color-primary)' : '1px solid transparent',
                    }}
                  >
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                      {day.dayLabel}
                    </div>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        margin: '0 auto',
                        borderRadius: '50%',
                        backgroundColor: hasPractice ? 'var(--color-primary)' : '#EBEFEA',
                        color: hasPractice ? '#FFFFFF' : 'var(--color-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                      title={`${day.dateKey}: ฝึก ${day.completedSessions} เซสชัน (${formatDurationThai(day.totalActiveSeconds)})`}
                    >
                      {hasPractice ? <CheckCircle2 size={16} /> : day.dayNumber}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

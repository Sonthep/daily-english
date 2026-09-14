import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Session, Lesson, Profile, AppRoute } from '../../types';
import {
  sessionRepo,
  lessonRepo,
  phraseRepo,
  profileRepo,
} from '../../lib/storage/repositories';
import { formatDurationThai, getPast7DaysActivity, formatThaiDate } from '../../lib/review/dateUtils';
import {
  BarChart3,
  CalendarCheck,
  Clock,
  BookOpen,
  Bookmark,
  CheckCircle2,
} from 'lucide-react';

export interface ProgressScreenProps {
  onNavigate: (route: AppRoute) => void;
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({ onNavigate }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [completedSessions, setCompletedSessions] = useState<Session[]>([]);
  const [lessonsMap, setLessonsMap] = useState<Record<string, Lesson>>({});
  const [duePhrasesCount, setDuePhrasesCount] = useState<number>(0);
  const [totalPhrasesCount, setTotalPhrasesCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const p = (await profileRepo.getProfile()) || (await profileRepo.initDefaultProfile());
        setProfile(p);

        const allLessons = await lessonRepo.getAllLessons();
        const map: Record<string, Lesson> = {};
        allLessons.forEach((l) => {
          map[l.id] = l;
        });
        setLessonsMap(map);

        const completed = await sessionRepo.getCompletedSessions();
        // Sort descending by completion time
        completed.sort(
          (a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
        );
        setCompletedSessions(completed);

        const due = await phraseRepo.getDuePhrases();
        setDuePhrasesCount(due.length);

        const allPhrases = await phraseRepo.getAllPhrases();
        setTotalPhrasesCount(allPhrases.length);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div style={{ padding: 'var(--space-2xl) 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        กำลังคำนวณสถิติความก้าวหน้า...
      </div>
    );
  }

  const timezone = profile?.timezone || 'Asia/Bangkok';
  const totalActiveSeconds = completedSessions.reduce(
    (sum, s) => sum + (s.activeDurationSeconds || 0),
    0
  );

  const past7Days = getPast7DaysActivity(completedSessions, timezone);
  const activeDaysIn7 = past7Days.filter((d) => d.completedSessions > 0).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-text)', marginBottom: '4px' }}>
          ความคืบหน้าการฝึกฝน (Progress)
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-base)' }}>
          สถิติที่บันทึกจากการฝึกฝนจริงของคุณ โดยไม่มีตัวเลขหรือการวัดระดับที่แต่งขึ้น
        </p>
      </div>

      {/* Primary Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-md)',
        }}
      >
        <Card padding="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-primary)' }}>
            <BookOpen size={20} />
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>เซสชันที่เรียนจบ</span>
          </div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-text)', marginTop: '8px' }}>
            {completedSessions.length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            บทเรียนที่สำเร็จครบทุกขั้น
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-primary)' }}>
            <Clock size={20} />
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>เวลาฝึกจริงสะสม</span>
          </div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-text)', marginTop: '8px' }}>
            {formatDurationThai(totalActiveSeconds)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            นับเฉพาะช่วงที่เปิดแท็บจริง
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-primary)' }}>
            <CalendarCheck size={20} />
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>วันที่ฝึกใน 7 วันล่าสุด</span>
          </div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-text)', marginTop: '8px' }}>
            {activeDaysIn7} จาก 7 วัน
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            ความสม่ำเสมอในรอบสัปดาห์
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-primary)' }}>
            <Bookmark size={20} />
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>คลังวลีที่สะสม</span>
          </div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-text)', marginTop: '8px' }}>
            {totalPhrasesCount} วลี
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            ครบกำหนดทบทวน {duePhrasesCount} วลี
          </div>
        </Card>
      </div>

      {/* 7-Day Visual Consistency */}
      <Card padding="lg">
        <h3 style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-text)', marginBottom: 'var(--space-md)' }}>
          ความสม่ำเสมอในการฝึกฝน (7 วันที่ผ่านมา)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center' }}>
          {past7Days.map((day) => {
            const hasPractice = day.completedSessions > 0;
            return (
              <div
                key={day.dateKey}
                style={{
                  padding: '12px 6px',
                  borderRadius: 'var(--radius-control)',
                  backgroundColor: day.isToday ? 'rgba(36, 92, 79, 0.08)' : '#FAFCFA',
                  border: day.isToday ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                  {day.dayLabel}
                </div>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    margin: '0 auto',
                    borderRadius: '50%',
                    backgroundColor: hasPractice ? 'var(--color-primary)' : '#EBEFEA',
                    color: hasPractice ? '#FFFFFF' : 'var(--color-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  {hasPractice ? <CheckCircle2 size={18} /> : day.dayNumber}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                  {hasPractice ? `${day.completedSessions} เซสชัน` : '—'}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Lesson History List */}
      <div>
        <h2 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text)', marginBottom: 'var(--space-md)' }}>
          ประวัติการฝึกบทเรียน
        </h2>

        {completedSessions.length === 0 ? (
          <EmptyState
            icon={<BarChart3 size={24} />}
            title="ยังไม่มีประวัติการเรียน"
            description="เมื่อคุณฝึกบทเรียนจบในแต่ละวัน ประวัติและเวลาเรียนจริงจะถูกบันทึกและแสดงที่นี่"
            actionLabel="เริ่มฝึกบทเรียนแรก"
            onAction={() => onNavigate({ path: 'today' })}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {completedSessions.map((session) => {
              const lesson = lessonsMap[session.lessonId];
              const completedDate = session.completedAt
                ? formatThaiDate(new Date(session.completedAt), timezone)
                : '—';

              return (
                <Card
                  key={session.id}
                  padding="md"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <Badge variant="primary">{lesson?.category || 'General'}</Badge>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {completedDate}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-base)', color: 'var(--color-text)' }}>
                      {lesson?.titleTh || session.lessonId}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                      {lesson?.titleEn}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-primary)' }}>
                        {formatDurationThai(session.activeDurationSeconds || 0)}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        โหมด {session.modeMinutes} นาที
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

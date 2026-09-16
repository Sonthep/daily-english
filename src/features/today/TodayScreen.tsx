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
    <div className="today-page">
      <header className="today-heading">
        <div>
          <div className="eyebrow"><CalendarCheck size={15} /> {formatThaiDate(new Date(), profile?.timezone || 'Asia/Bangkok')}</div>
          <h1>สวัสดี {greetingName}<span className="greeting-dot">.</span></h1>
          <p className="muted">ให้ภาษาอังกฤษเป็นเรื่องเล็ก ๆ ที่ทำได้ทุกวัน</p>
        </div>
        <div className="duration-picker">
          <span className="eyebrow">วันนี้มีเวลาสักเท่าไหร่?</span>
          <div className="segmented-control" role="group" aria-label="เลือกระยะเวลาฝึกฝน">
            {([5, 15] as const).map(mode => <button key={mode} aria-pressed={durationMode === mode} onClick={() => handleDurationToggle(mode)}>{mode} นาที <span>{mode === 5 ? 'สั้น ๆ ก็ได้' : 'ฝึกเต็มที่'}</span></button>)}
          </div>
        </div>
      </header>

      <section className="lesson-hero" aria-labelledby="daily-lesson-title">
        <div className="hero-content">
          <div className="hero-kicker"><Sparkles size={16} /> บทเรียนสำหรับวันนี้ <span> / {todayLesson.category}</span></div>
          <h2 id="daily-lesson-title">{todayLesson.titleTh}</h2>
          <p className="hero-english">{todayLesson.titleEn}</p>
          <p className="hero-objective">{todayLesson.objectiveTh}</p>
          <div className="hero-actions">
            <Button size="lg" className="hero-start" onClick={() => onStartLesson(todayLesson.id, durationMode)}>
              {hasIncompleteSession ? <RotateCcw size={19} /> : <Play size={19} />} {hasIncompleteSession ? 'ฝึกต่อจากเดิม' : 'เริ่มฝึกวันนี้'} <ArrowRight size={18} />
            </Button>
            <button className="hero-link" onClick={() => onNavigate({ path: 'practice' })}>เลือกบทเรียนอื่น</button>
          </div>
        </div>
        <div className="hero-illustration" aria-hidden="true">
          <div className="illustration-orbit" />
          <div className="phrase-paper"><span>Little by little.</span><strong>A little practice,<br />a little more<br /><em>confidence.</em></strong><div className="paper-rule" /><small>YOUR DAILY ENGLISH MOMENT</small></div>
          <div className="audio-sticker"><Headphones size={23} /><span /><span /><span /><span /><span /></div>
        </div>
      </section>

      <section className="learning-path" aria-labelledby="path-title">
        <div className="section-heading"><h2 id="path-title">ทีละขั้น ก็เก่งขึ้นได้</h2><span className="muted">4 ขั้นตอนสั้น ๆ ในบทเรียนเดียว</span></div>
        <ol className="steps-grid">
          {[
            { icon: Headphones, title: 'ฟัง', en: 'Listen', desc: 'คุ้นกับเสียงและสำเนียง' },
            { icon: Mic, title: 'พูดตาม', en: 'Repeat', desc: 'ลองพูดในจังหวะของคุณ' },
            { icon: MessageSquare, title: 'ใช้จริง', en: 'Use it', desc: 'เล่าเรื่องด้วยคำของตัวเอง' },
            { icon: Bookmark, title: 'ทบทวน', en: 'Review', desc: 'เก็บวลีไว้ใช้ในวันต่อไป' },
          ].map((item, index) => <li key={item.en}><div className="step-top"><span className="step-icon"><item.icon size={21} /></span><span className="step-number">0{index + 1}</span></div><h3>{item.title} <span>{item.en}</span></h3><p>{item.desc}</p></li>)}
        </ol>
      </section>

      <div className="today-bottom-grid">
        <Card className="review-card">
          <div className="section-heading"><span className="step-icon"><Bookmark size={21} /></span><Badge variant="accent">{duePhrases.length} วลี</Badge></div>
          <h2>{duePhrases.length ? 'แวะทบทวนอีกนิด' : 'คลังวลีของคุณ'}</h2>
          <p className="muted">{duePhrases.length ? 'วลีที่เคยเก็บไว้พร้อมให้คุณทบทวนแล้ว ค่อย ๆ นึก ไม่ต้องรีบ' : 'ยังไม่มีวลีที่ถึงกำหนดทบทวน เก็บวลีที่ชอบจากบทเรียนไว้ฝึกครั้งต่อไปได้เลย'}</p>
          <Button variant="outline" fullWidth onClick={() => onNavigate({ path: 'phrases' })}>{duePhrases.length ? 'ไปทบทวนวลี' : 'เปิดคลังวลี'}<ArrowRight size={17} /></Button>
        </Card>
        <Card className="activity-card">
          <div className="section-heading"><h2>ทุกครั้งที่ฝึก มีความหมาย</h2><span className="eyebrow">7 วันล่าสุด</span></div>
          <p className="muted">{past7Days.some(day => day.completedSessions > 0) ? `คุณฝึกแล้ว ${past7Days.filter(day => day.completedSessions > 0).length} วันในสัปดาห์ที่ผ่านมา` : 'เริ่มวันนี้ แล้วค่อย ๆ เห็นการเดินทางของตัวเอง'}</p>
          <div className="week-grid">
            {past7Days.map(day => <div key={day.dateKey} className={`week-day ${day.isToday ? 'is-today' : ''}`} aria-label={`${day.dateKey}: ฝึก ${day.completedSessions} เซสชัน (${formatDurationThai(day.totalActiveSeconds)})`}>
              <span>{day.dayLabel}</span><span className={`day-circle ${day.completedSessions > 0 ? 'is-complete' : ''}`}>{day.completedSessions > 0 ? <CheckCircle2 size={20} /> : day.dayNumber}</span><small>{day.isToday ? 'วันนี้' : '\u00a0'}</small>
            </div>)}
          </div>
          <button className="text-link" onClick={() => onNavigate({ path: 'progress' })}>ดูความก้าวหน้าทั้งหมด <ArrowRight size={16} /></button>
        </Card>
      </div>
      <p className="today-footer">วันละนิด ในจังหวะของคุณเอง</p>
    </div>
  );
};

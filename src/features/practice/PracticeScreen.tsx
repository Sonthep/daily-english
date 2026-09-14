import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Lesson, Session, LessonCategory } from '../../types';
import { lessonRepo, sessionRepo } from '../../lib/storage/repositories';
import { Search, Play, RotateCcw, CheckCircle, Sparkles, BookOpen } from 'lucide-react';

export interface PracticeScreenProps {
  onStartLesson: (lessonId: string, durationMinutes: 5 | 15) => void;
}

export const PracticeScreen: React.FC<PracticeScreenProps> = ({ onStartLesson }) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const allLessons = await lessonRepo.getAllLessons();
        const allSessions = await sessionRepo.getAllSessions();
        setLessons(allLessons);
        setSessions(allSessions);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const categories: (LessonCategory | 'All')[] = [
    'All',
    'Design & Marketing',
    'Daily Life',
    'Gaming',
  ];

  // Map lesson status
  const getLessonStatus = (lessonId: string): 'not_started' | 'in_progress' | 'completed' => {
    const lessonSessions = sessions.filter((s) => s.lessonId === lessonId);
    if (lessonSessions.length === 0) return 'not_started';

    const hasCompleted = lessonSessions.some((s) => s.completedAt !== null);
    if (hasCompleted) return 'completed';

    const hasActive = lessonSessions.some((s) => s.completedAt === null);
    if (hasActive) return 'in_progress';

    return 'not_started';
  };

  const filteredLessons = lessons.filter((lesson) => {
    const matchesCategory =
      selectedCategory === 'All' || lesson.category === selectedCategory;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      query === '' ||
      lesson.titleTh.toLowerCase().includes(query) ||
      lesson.titleEn.toLowerCase().includes(query) ||
      lesson.objectiveTh.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const handleClearFilters = () => {
    setSelectedCategory('All');
    setSearchQuery('');
  };

  if (isLoading) {
    return (
      <div style={{ padding: 'var(--space-2xl) 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        กำลังโหลดบทเรียนทั้งหมด...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-text)', marginBottom: '4px' }}>
          คลังบทเรียน (Practice)
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-base)' }}>
          เลือกบทเรียนที่ตรงกับเรื่องที่คุณต้องการใช้จริงในชีวิตและการทำงาน
        </p>
      </div>

      {/* Search and Category Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {/* Search Box */}
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
            placeholder="ค้นหาชื่อบทเรียน หรือทักษะที่ต้องการฝึก..."
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

        {/* Category Tabs */}
        <div
          role="tablist"
          aria-label="ตัวกรองหมวดหมู่บทเรียน"
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
          }}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const label =
              cat === 'All'
                ? 'ทั้งหมด'
                : cat === 'Design & Marketing'
                ? 'งานดีไซน์ & การตลาด'
                : cat === 'Daily Life'
                ? 'ชีวิตประจำวัน'
                : 'เกม & การเล่นเป็นทีม';

            return (
              <button
                key={cat}
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-badge)',
                  border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  backgroundColor: isSelected ? 'var(--color-primary)' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : 'var(--color-text-muted)',
                  fontWeight: isSelected ? 600 : 400,
                  fontSize: 'var(--font-size-sm)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  minHeight: '38px',
                  transition: 'all var(--transition-smooth)',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lesson List */}
      {filteredLessons.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={24} />}
          title="ไม่พบบทเรียนที่ค้นหา"
          description="ไม่พบบทเรียนที่ตรงกับคำค้นหาหรือหมวดหมู่ที่คุณเลือก ลองเปลี่ยนคำค้นหรือล้างตัวกรองดูครับ"
          actionLabel="ล้างตัวกรองทั้งหมด"
          onAction={handleClearFilters}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 'var(--space-base)',
          }}
        >
          {filteredLessons.map((lesson) => {
            const status = getLessonStatus(lesson.id);

            return (
              <Card
                key={lesson.id}
                padding="md"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 'var(--space-md)',
                  transition: 'border-color var(--transition-smooth), transform var(--transition-smooth)',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 'var(--space-sm)',
                      gap: '8px',
                    }}
                  >
                    <Badge variant="primary" icon={<Sparkles size={12} />}>
                      {lesson.category}
                    </Badge>

                    {/* Status Badge */}
                    {status === 'completed' && (
                      <Badge variant="success" icon={<CheckCircle size={12} />}>
                        จบแล้ว
                      </Badge>
                    )}
                    {status === 'in_progress' && (
                      <Badge variant="accent" icon={<RotateCcw size={12} />}>
                        กำลังฝึก
                      </Badge>
                    )}
                    {status === 'not_started' && (
                      <Badge variant="neutral">
                        ยังไม่เริ่ม
                      </Badge>
                    )}
                  </div>

                  <h3 style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-text)', marginBottom: '2px' }}>
                    {lesson.titleTh}
                  </h3>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                    {lesson.titleEn}
                  </div>

                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text)', lineHeight: 1.5, margin: 0 }}>
                    {lesson.objectiveTh}
                  </p>
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
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                    ประมาณ 5 - 15 นาที
                  </span>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      size="sm"
                      variant={status === 'in_progress' ? 'secondary' : 'primary'}
                      onClick={() => onStartLesson(lesson.id, 5)}
                    >
                      {status === 'in_progress' ? (
                        <>
                          <RotateCcw size={15} /> ฝึกต่อ
                        </>
                      ) : (
                        <>
                          <Play size={15} fill="currentColor" /> เริ่มฝึก
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

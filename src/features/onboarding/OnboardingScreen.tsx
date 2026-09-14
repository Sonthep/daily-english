import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Profile } from '../../types';
import { profileRepo } from '../../lib/storage/repositories';
import { ArrowRight, Check, Sparkles } from 'lucide-react';

export interface OnboardingScreenProps {
  onComplete: (firstLessonId: string) => void;
  onSkip: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete,
  onSkip,
}) => {
  const [step, setStep] = useState<number>(1);
  const [displayName, setDisplayName] = useState('ปุ๊ก');
  const [selectedGoal, setSelectedGoal] = useState<'work' | 'daily' | 'gaming'>('work');
  const [dailyMinutes, setDailyMinutes] = useState<5 | 15>(5);
  const [confidence, setConfidence] = useState<'beginner' | 'intermediate' | 'advancing'>('intermediate');

  const handleFinish = async () => {
    const profile: Profile = {
      id: 'default-user',
      displayName: displayName.trim() || 'ปุ๊ก',
      goals: [selectedGoal],
      dailyMinutes,
      confidence,
      timezone: 'Asia/Bangkok',
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await profileRepo.saveProfile(profile);

    // Launch first lesson based on goal
    const lessonId =
      selectedGoal === 'gaming'
        ? 'gaming'
        : selectedGoal === 'daily'
        ? 'daily-life'
        : 'design-feedback';

    onComplete(lessonId);
  };

  const handleSkipToFirstLesson = async () => {
    await profileRepo.initDefaultProfile();
    const existing = await profileRepo.getProfile();
    if (existing) {
      await profileRepo.saveProfile({ ...existing, onboardingCompleted: true });
    }
    onSkip();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-base)',
        backgroundColor: 'var(--color-bg)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '540px' }}>
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-lg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/logo.svg" alt="Daily English" style={{ width: '28px', height: '28px' }} />
            <span style={{ fontWeight: 600, color: 'var(--color-primary)', fontSize: 'var(--font-size-base)' }}>
              Daily English
            </span>
          </div>

          <button
            onClick={handleSkipToFirstLesson}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              fontSize: 'var(--font-size-sm)',
              cursor: 'pointer',
              padding: '6px 12px',
              textDecoration: 'underline',
            }}
          >
            ข้ามการตั้งค่า (Skip)
          </button>
        </div>

        {/* Card */}
        <Card padding="lg" style={{ position: 'relative' }}>
          {/* Progress Indicator */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: 'var(--space-lg)' }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: '2px',
                  backgroundColor: i <= step ? 'var(--color-primary)' : 'var(--color-border)',
                  transition: 'background-color var(--transition-smooth)',
                }}
              />
            ))}
          </div>

          {/* Step 1: Name */}
          {step === 1 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-xs)' }}>
                <Sparkles size={18} color="var(--color-primary)" />
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                  ขั้นตอนที่ 1 จาก 4
                </span>
              </div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: '8px' }}>
                สวัสดีครับ! อยากให้เราเรียกคุณว่าอะไรดี?
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-lg)' }}>
                เป็นชื่อเล่นสั้นๆ เพื่อให้บทเรียนและคำทักทายอบอุ่นเป็นกันเอง
              </p>

              <label
                htmlFor="name-input"
                style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '6px' }}
              >
                ชื่อหรือชื่อเล่นของคุณ
              </label>
              <input
                id="name-input"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="เช่น ปุ๊ก, นัท, บอม"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-control)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                  fontSize: 'var(--font-size-base)',
                  marginBottom: 'var(--space-xl)',
                }}
              />

              <Button fullWidth onClick={() => setStep(2)}>
                ต่อไป <ArrowRight size={18} />
              </Button>
            </div>
          )}

          {/* Step 2: Goal */}
          {step === 2 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-xs)' }}>
                <Sparkles size={18} color="var(--color-primary)" />
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                  ขั้นตอนที่ 2 จาก 4
                </span>
              </div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: '8px' }}>
                เป้าหมายหลักที่คุณอยากฝึกภาษาอังกฤษคืออะไร?
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-lg)' }}>
                เพื่อเลือกจัดบทเรียนแรกให้ตรงกับเรื่องที่คุณใช้บ่อยที่สุด
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: 'var(--space-xl)' }}>
                {[
                  {
                    id: 'work',
                    title: 'งานกราฟิกและการตลาด (Design & Marketing)',
                    desc: 'คุยกับลูกค้า รับฟีดแบ็ก ขอแก้งาน และอธิบายชิ้นงาน',
                  },
                  {
                    id: 'daily',
                    title: 'ชีวิตประจำวัน (Daily Life)',
                    desc: 'เล่าสิ่งที่ทำ กิจวัตรประจำวัน แผนการพักผ่อนกับเพื่อน',
                  },
                  {
                    id: 'gaming',
                    title: 'เล่นเกมและทำงานเป็นทีม (Gaming & Teamwork)',
                    desc: 'สื่อสารในเกม สั่งการ ขอกำลังเสริม นัดแนะตำแหน่ง',
                  },
                ].map((item) => {
                  const isSelected = selectedGoal === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedGoal(item.id as any)}
                      style={{
                        padding: '14px 16px',
                        borderRadius: 'var(--radius-control)',
                        border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        backgroundColor: isSelected ? 'var(--color-primary-soft)' : '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        transition: 'all var(--transition-smooth)',
                      }}
                    >
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: isSelected ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                          backgroundColor: isSelected ? 'var(--color-primary)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginTop: '2px',
                          flexShrink: 0,
                        }}
                      >
                        {isSelected && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: 'var(--font-size-base)' }}>
                          {item.title}
                        </div>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                          {item.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <Button variant="outline" onClick={() => setStep(1)} style={{ flex: 1 }}>
                  ย้อนกลับ
                </Button>
                <Button onClick={() => setStep(3)} style={{ flex: 2 }}>
                  ต่อไป <ArrowRight size={18} />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Duration */}
          {step === 3 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-xs)' }}>
                <Sparkles size={18} color="var(--color-primary)" />
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                  ขั้นตอนที่ 3 จาก 4
                </span>
              </div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: '8px' }}>
                เวลาที่คุณสะดวกฝึกต่อวัน
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-lg)' }}>
                คุณสามารถสลับโหมดนี้ได้ตลอดเวลาในหน้าหลัก ไม่มีการบังคับ
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: 'var(--space-xl)' }}>
                {[
                  {
                    minutes: 5 as const,
                    badge: 'เร็ว กระชับ',
                    desc: 'ฟัง 1 ประโยค, พูดตาม 1 ประโยค, ตอบ 1 คำถาม, ทบทวน 3 วลี',
                  },
                  {
                    minutes: 15 as const,
                    badge: 'เข้มข้นขึ้น',
                    desc: 'ฟัง 3 ประโยค, พูดตาม 3 ประโยค, ตอบ 2 คำถาม, ทบทวน 5 วลี',
                  },
                ].map((item) => {
                  const isSelected = dailyMinutes === item.minutes;
                  return (
                    <div
                      key={item.minutes}
                      onClick={() => setDailyMinutes(item.minutes)}
                      style={{
                        padding: '16px',
                        borderRadius: 'var(--radius-control)',
                        border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        backgroundColor: isSelected ? 'var(--color-primary-soft)' : '#FFFFFF',
                        cursor: 'pointer',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: 'inline-block',
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '10px',
                            backgroundColor: isSelected ? 'var(--color-primary)' : '#EFF3F0',
                            color: isSelected ? '#FFFFFF' : 'var(--color-text-muted)',
                            marginBottom: '8px',
                          }}
                        >
                          {item.badge}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-primary)' }}>
                          {item.minutes} นาที
                        </div>
                      </div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                        {item.desc}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <Button variant="outline" onClick={() => setStep(2)} style={{ flex: 1 }}>
                  ย้อนกลับ
                </Button>
                <Button onClick={() => setStep(4)} style={{ flex: 2 }}>
                  ต่อไป <ArrowRight size={18} />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Confidence */}
          {step === 4 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-xs)' }}>
                <Sparkles size={18} color="var(--color-primary)" />
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                  ขั้นตอนที่ 4 จาก 4
                </span>
              </div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: '8px' }}>
                ความมั่นใจภาษาอังกฤษในตอนนี้
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-lg)' }}>
                การเลือกนี้เป็นเพียงความชอบส่วนตัว ไม่ใช่การวัดระดับมาตรฐาน (ไม่ใช่ผลสอบ CEFR)
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: 'var(--space-xl)' }}>
                {[
                  {
                    id: 'beginner',
                    title: 'เพิ่งเริ่มต้น (Beginner)',
                    desc: 'อยากฝึกคำศัพท์พื้นฐานและประโยคสั้นๆ ก่อน',
                  },
                  {
                    id: 'intermediate',
                    title: 'พอเข้าใจแต่ยังไม่คล่อง (Intermediate)',
                    desc: 'อ่านเข้าใจแต่เวลาพูดต้องใช้เวลาคิด อยากฝึกประโยคติดปาก',
                  },
                  {
                    id: 'advancing',
                    title: 'อยากพูดคล่องและเป็นธรรมชาติขึ้น (Advancing)',
                    desc: 'อยากได้สำนวนและการตอบโต้ที่ไหลลื่นขึ้นในที่ทำงาน',
                  },
                ].map((item) => {
                  const isSelected = confidence === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setConfidence(item.id as any)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-control)',
                        border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        backgroundColor: isSelected ? 'var(--color-primary-soft)' : '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{item.title}</div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                          {item.desc}
                        </div>
                      </div>
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: isSelected ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                          backgroundColor: isSelected ? 'var(--color-primary)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isSelected && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <Button variant="outline" onClick={() => setStep(3)} style={{ flex: 1 }}>
                  ย้อนกลับ
                </Button>
                <Button onClick={handleFinish} style={{ flex: 2 }}>
                  เริ่มบทเรียนแรกเลย <ArrowRight size={18} />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

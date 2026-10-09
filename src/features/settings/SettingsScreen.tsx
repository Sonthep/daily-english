import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Profile, DatabaseExport } from '../../types';
import { profileRepo, storageService } from '../../lib/storage/repositories';
import {
  Download,
  Upload,
  AlertTriangle,
  Info,
  Check,
  RotateCcw,
  Smartphone,
  Wifi,
  Volume2,
} from 'lucide-react';
import { usePwaInstall } from '../../lib/pwa/usePwaInstall';
import { speechService, getStoredVoiceGender, setStoredVoiceGender, getStoredVoiceURI, setStoredVoiceURI, clearStoredVoicePreferences, VoiceGender } from '../../lib/audio/speech';

export interface SettingsScreenProps {
  onProfileUpdated: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onProfileUpdated }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [learningGoal, setLearningGoal] = useState<'work' | 'daily' | 'gaming'>('daily');
  const [dailyMinutes, setDailyMinutes] = useState<5 | 15>(5);
  const [confidence, setConfidence] = useState<Profile['confidence']>('beginner');
  const [timezone, setTimezone] = useState('Asia/Bangkok');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Import State & Confirmation
  const [pendingImportData, setPendingImportData] = useState<DatabaseExport | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset Confirmation Modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmationText, setResetConfirmationText] = useState('');

  // PWA State
  const { canInstall, isInstalled, isOfflineReady, promptInstall } = usePwaInstall();

  // Voice Gender State
  const [voiceGender, setVoiceGender] = useState<VoiceGender>(() => getStoredVoiceGender());
  const [voiceURI, setVoiceURI] = useState(() => getStoredVoiceURI());
  const [englishVoices, setEnglishVoices] = useState<SpeechSynthesisVoice[]>(() => speechService.getEnglishVoices());

  const handleSelectVoiceGender = (gender: VoiceGender) => {
    setVoiceGender(gender);
    setStoredVoiceGender(gender);
    setVoiceURI('');
    setStoredVoiceURI('');
    speechService.speak(
      gender === 'male'
        ? "This is the male voice. Let's practice English together!"
        : "This is the female voice. Let's practice English together!",
      1.0,
      undefined,
      undefined,
      gender
    );
  };

  const handleSelectVoice = (selectedVoiceURI: string) => {
    setVoiceURI(selectedVoiceURI);
    setStoredVoiceURI(selectedVoiceURI);
    speechService.speak('Hello! Let us practice English together.', 1.0, undefined, undefined, voiceGender);
  };

  const handleTestVoice = () => {
    speechService.speak(
      voiceGender === 'male'
        ? 'Good job! Keep practicing English every day.'
        : 'Good job! Keep practicing English every day.',
      1.0,
      undefined,
      undefined,
      voiceGender
    );
  };

  useEffect(() => {
    const loadProfile = async () => {
      const p = (await profileRepo.getProfile()) || (await profileRepo.initDefaultProfile());
      setProfile(p);
      setDisplayName(p.displayName);
      setLearningGoal(p.goals.includes('work') ? 'work' : p.goals.includes('gaming') ? 'gaming' : 'daily');
      setDailyMinutes(p.dailyMinutes || 5);
      setConfidence(p.confidence);
      setTimezone(p.timezone || 'Asia/Bangkok');
    };
    loadProfile();
  }, []);

  useEffect(() => {
    const updateVoices = () => setEnglishVoices(speechService.getEnglishVoices());
    updateVoices();
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const updated: Profile = {
      ...profile,
      displayName: displayName.trim(),
      goals: [learningGoal],
      dailyMinutes,
      confidence,
      timezone,
      updatedAt: new Date().toISOString(),
    };

    await profileRepo.saveProfile(updated);
    setProfile(updated);
    setSaveSuccessNotice(true);
    onProfileUpdated();

    setTimeout(() => {
      setSaveSuccessNotice(false);
    }, 3000);
  };

  // Export JSON
  const handleExportJSON = async () => {
    const data = await storageService.exportDatabase();
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.download = `daily-english-backup-${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Trigger File Input for Import
  const handleSelectImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const validation = storageService.validateImportData(content);
      if (!validation.valid || !validation.data) {
        setImportError(validation.error || 'ไฟล์ JSON ไม่ถูกต้องตามรูปแบบ');
        return;
      }

      setPendingImportData(validation.data);
      setIsImportModalOpen(true);
    };

    reader.readAsText(file);
    // Reset file input so same file can be chosen again if needed
    e.target.value = '';
  };

  const handleConfirmImport = async () => {
    if (!pendingImportData) return;
    try {
      await storageService.importDatabase(pendingImportData);
      setIsImportModalOpen(false);
      setPendingImportData(null);
      onProfileUpdated();
      alert('นำเข้าข้อมูลสำเร็จเรียบร้อยแล้ว หน้าเว็บจะรีเฟรชเพื่อโหลดข้อมูลใหม่');
      window.location.reload();
    } catch (err: unknown) {
      setImportError(`เกิดข้อผิดพลาดในการนำเข้าข้อมูล: ${(err as Error).message}`);
    }
  };

  // Reset Database
  const handleConfirmReset = async () => {
    if (resetConfirmationText !== 'RESET') return;
    await storageService.resetDatabase();
    clearStoredVoicePreferences();
    setIsResetModalOpen(false);
    onProfileUpdated();
    alert('รีเซ็ตข้อมูลทั้งหมดเรียบร้อยแล้ว');
    window.location.reload();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)', maxWidth: '680px' }}>
      <div>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-text)', marginBottom: '4px' }}>
          การตั้งค่า (Settings)
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-base)' }}>
          จัดการโปรไฟล์ การสำรองข้อมูล และการตั้งค่าความเป็นส่วนตัว
        </p>
      </div>

      {/* Local Storage Privacy Note */}
      <div
        style={{
          padding: 'var(--space-md) var(--space-base)',
          borderRadius: 'var(--radius-control)',
          backgroundColor: '#EFF5F2',
          border: '1px solid rgba(36, 92, 79, 0.2)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        <Info size={20} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)' }}>
            ข้อมูลถูกเก็บในเครื่องของคุณ (Local-First)
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text)', marginTop: '2px', lineHeight: 1.5 }}>
            Daily English บันทึกประวัติและคลังคำศัพท์ทั้งหมดไว้ใน IndexedDB ของเบราว์เซอร์นี้ ข้อมูลจะไม่ถูกซิงค์ข้ามอุปกรณ์
            หากคุณต้องการย้ายเครื่อง สามารถใช้ฟังก์ชัน Export และ Import ด้านล่างได้ตลอดเวลาครับ
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <Card padding="lg">
        <h2 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text)', marginBottom: 'var(--space-md)' }}>
          ข้อมูลโปรไฟล์
        </h2>

        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div>
            <label
              htmlFor="display-name"
              style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '6px' }}
            >
              ชื่อที่อยากให้เรียก
            </label>
            <input
              id="display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--color-border)',
                outline: 'none',
                fontSize: 'var(--font-size-base)',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="learning-goal-select"
              style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '6px' }}
            >
              เป้าหมายหลักในการฝึก
            </label>
            <select
              id="learning-goal-select"
              value={learningGoal}
              onChange={(e) => setLearningGoal(e.target.value as 'work' | 'daily' | 'gaming')}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--color-border)',
                outline: 'none',
                backgroundColor: '#FFFFFF',
                fontSize: 'var(--font-size-base)',
              }}
            >
              <option value="work">การทำงาน</option>
              <option value="daily">ชีวิตประจำวัน</option>
              <option value="gaming">เล่นเกมและทำงานเป็นทีม</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="daily-minutes-select"
              style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '6px' }}
            >
              ระยะเวลาฝึกตั้งต้นต่อวัน
            </label>
            <select
              id="daily-minutes-select"
              value={dailyMinutes}
              onChange={(e) => setDailyMinutes(Number(e.target.value) as 5 | 15)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--color-border)',
                outline: 'none',
                backgroundColor: '#FFFFFF',
                fontSize: 'var(--font-size-base)',
              }}
            >
              <option value={5}>5 นาที (กระชับ รวดเร็ว)</option>
              <option value={15}>15 นาที (เข้มข้นขึ้น)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="confidence-select"
              style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '6px' }}
            >
              ระดับความมั่นใจในภาษาอังกฤษ
            </label>
            <select
              id="confidence-select"
              value={confidence}
              onChange={(e) => setConfidence(e.target.value as Profile['confidence'])}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--color-border)',
                outline: 'none',
                backgroundColor: '#FFFFFF',
                fontSize: 'var(--font-size-base)',
              }}
            >
              <option value="beginner">เริ่มต้น</option>
              <option value="intermediate">พอเข้าใจ</option>
              <option value="advancing">มั่นใจขึ้น</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="timezone-select"
              style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '6px' }}
            >
              เขตเวลา (Timezone) สำหรับจัดกลุ่มวัน
            </label>
            <select
              id="timezone-select"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--color-border)',
                outline: 'none',
                backgroundColor: '#FFFFFF',
                fontSize: 'var(--font-size-base)',
              }}
            >
              <option value="Asia/Bangkok">Asia/Bangkok (UTC+07:00)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (UTC+09:00)</option>
              <option value="Europe/London">Europe/London (UTC+00:00 / GMT)</option>
              <option value="America/New_York">America/New_York (UTC-05:00 / EST)</option>
            </select>
          </div>

          {/* English Voice Selection */}
          <div>
            <label
              htmlFor="english-voice-select"
              style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '8px' }}
            >
              เสียงอ่านภาษาอังกฤษ
            </label>
            <select
              id="english-voice-select"
              value={voiceURI}
              onChange={(event) => handleSelectVoice(event.target.value)}
              style={{ width: '100%', minHeight: '44px', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', background: '#FFFFFF', marginBottom: '10px' }}
            >
              <option value="">เสียงแนะนำอัตโนมัติ (เน้น Natural / Online)</option>
              {englishVoices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang}){voice.localService === false ? ' · Online' : ''}
                </option>
              ))}
            </select>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleSelectVoiceGender('male')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-control)',
                    border: voiceGender === 'male' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    backgroundColor: voiceGender === 'male' ? '#EFF5F2' : '#FFFFFF',
                    color: voiceGender === 'male' ? 'var(--color-primary)' : 'var(--color-text)',
                    fontWeight: voiceGender === 'male' ? 600 : 400,
                    fontSize: 'var(--font-size-sm)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    minHeight: 'var(--touch-target-min)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>👨 เสียงผู้ชาย (Male)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectVoiceGender('female')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-control)',
                    border: voiceGender === 'female' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    backgroundColor: voiceGender === 'female' ? '#EFF5F2' : '#FFFFFF',
                    color: voiceGender === 'female' ? 'var(--color-primary)' : 'var(--color-text)',
                    fontWeight: voiceGender === 'female' ? 600 : 400,
                    fontSize: 'var(--font-size-sm)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    minHeight: 'var(--touch-target-min)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>👩 เสียงผู้หญิง (Female)</span>
                </button>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestVoice}
              >
                <Volume2 size={15} /> ทดลองฟังเสียง
              </Button>
            </div>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '6px' }}>
              ใช้เสียง English ที่อุปกรณ์มีให้ หากมี Natural, Neural หรือ Online มักฟังเป็นธรรมชาติกว่า; คุณภาพและสำเนียงขึ้นกับ browser และระบบปฏิบัติการ
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
            {saveSuccessNotice ? (
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={16} /> บันทึกการเปลี่ยนแปลงแล้ว
              </span>
            ) : <span />}

            <Button type="submit" variant="primary">
              บันทึกข้อมูล
            </Button>
          </div>
        </form>
      </Card>

      {/* PWA & Offline Support Card */}
      <Card padding="lg">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Smartphone size={18} color="var(--color-primary)" />
            <h2 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text)' }}>
              แอปพลิเคชัน & การใช้งานออฟไลน์ (PWA)
            </h2>
          </div>
          {isInstalled ? (
            <Badge variant="success">ติดตั้งแล้ว (Installed)</Badge>
          ) : canInstall ? (
            <Badge variant="primary">พร้อมติดตั้ง</Badge>
          ) : (
            <Badge variant="neutral">เบราว์เซอร์</Badge>
          )}
        </div>

        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)', lineHeight: 1.5 }}>
          Daily English รองรับมาตรฐาน Progressive Web App (PWA) คุณสามารถติดตั้งเป็นแอปบนมือถือหรือเดสก์ท็อป เพื่อเปิดใช้งานได้ทันทีแม้ไม่มีอินเทอร์เน็ต
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: canInstall ? 'var(--space-md)' : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-size-xs)', color: 'var(--color-text)' }}>
            <Wifi size={14} color="var(--color-primary)" />
            <span>สถานะระบบแคชออฟไลน์: {isOfflineReady ? 'พร้อมเปิดฟีเจอร์หลักแบบออฟไลน์' : 'ยังแคชไฟล์แอปไม่ครบ กรุณาเชื่อมต่ออินเทอร์เน็ตและเปิดใหม่อีกครั้ง'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-size-xs)', color: 'var(--color-text)' }}>
            <Smartphone size={14} color="var(--color-primary)" />
            <span>สถานะการติดตั้ง: {isInstalled ? 'เปิดในโหมดแอปพลิเคชัน (Standalone)' : 'กำลังเปิดผ่านเบราว์เซอร์'}</span>
          </div>
        </div>

        {canInstall && (
          <Button variant="primary" onClick={() => promptInstall()}>
            <Smartphone size={16} /> ติดตั้ง Daily English ลงเครื่อง
          </Button>
        )}
      </Card>

      {/* Backup & Restore Card */}
      <Card padding="lg">
        <h2 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text)', marginBottom: '4px' }}>
          สำรองและกู้คืนข้อมูล (Backup & Restore)
        </h2>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-lg)' }}>
          ส่งออกข้อมูลเพื่อสำรองไว้ หรือนำเข้าไฟล์ JSON จากเครื่องอื่น
        </p>

        {importError && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--color-error-soft)',
              color: 'var(--color-error)',
              borderRadius: 'var(--radius-control)',
              fontSize: 'var(--font-size-sm)',
              marginBottom: 'var(--space-md)',
            }}
          >
            {importError}
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <Button variant="outline" onClick={handleExportJSON}>
            <Download size={16} /> Export ข้อมูล JSON
          </Button>

          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={16} /> Import ข้อมูล JSON
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleSelectImportFile}
            style={{ display: 'none' }}
          />
        </div>
      </Card>

      {/* Danger Zone: Reset Data */}
      <Card padding="lg" style={{ border: '1.5px solid #F8D7DA' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-error)', marginBottom: '4px' }}>
          <AlertTriangle size={18} />
          <h2 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-error)' }}>
            รีเซ็ตข้อมูลทั้งหมด (Reset Data)
          </h2>
        </div>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)' }}>
          การกระทำนี้จะล้างโปรไฟล์ ประวัติการฝึก บทเรียน/สื่อที่สร้าง คลังคำศัพท์ และการตั้งค่าเสียง แล้วเริ่มต้นใหม่
        </p>

        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            setResetConfirmationText('');
            setIsResetModalOpen(true);
          }}
        >
          <RotateCcw size={16} /> รีเซ็ตข้อมูลทั้งหมด
        </Button>
      </Card>

      {/* Import Confirmation Modal */}
      {pendingImportData && (
        <Modal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          title="ยืนยันการนำเข้าข้อมูล (Import)?"
          description="การนำเข้าจะแทนที่ข้อมูลโปรไฟล์ ประวัติการเรียน และคลังคำศัพท์ปัจจุบันทั้งหมดด้วยข้อมูลจากไฟล์สำรอง"
        >
          <div
            style={{
              padding: '12px',
              backgroundColor: '#FAFCFA',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--color-border)',
              fontSize: 'var(--font-size-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              marginBottom: 'var(--space-md)',
            }}
          >
            <div><strong>ชื่อผู้ใช้ในไฟล์:</strong> {pendingImportData.profile?.displayName}</div>
            <div><strong>จำนวนบทเรียนในประวัติ:</strong> {pendingImportData.sessions?.length || 0} เซสชัน</div>
            <div><strong>จำนวนวลีในคลัง:</strong> {pendingImportData.phrases?.length || 0} รายการ</div>
            <div><strong>วันที่สำรอง:</strong> {new Date(pendingImportData.exportedAt).toLocaleString('th-TH')}</div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => setIsImportModalOpen(false)}>
              ยกเลิก
            </Button>
            <Button variant="primary" onClick={handleConfirmImport}>
              ยืนยันนำเข้าข้อมูล
            </Button>
          </div>
        </Modal>
      )}

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="ต้องการลบข้อมูลทั้งหมดจริงหรือไม่?"
        description="การกระทำนี้ไม่สามารถย้อนกลับได้ กรุณาพิมพ์คำว่า RESET ในช่องด้านล่างเพื่อยืนยัน"
      >
        <div style={{ margin: 'var(--space-md) 0' }}>
          <input
            type="text"
            value={resetConfirmationText}
            onChange={(e) => setResetConfirmationText(e.target.value)}
            placeholder="พิมพ์ RESET เพื่อยืนยัน"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--color-border)',
              outline: 'none',
              fontSize: 'var(--font-size-base)',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={() => setIsResetModalOpen(false)}>
            ยกเลิก
          </Button>
          <Button
            variant="danger"
            disabled={resetConfirmationText !== 'RESET'}
            onClick={handleConfirmReset}
          >
            ยืนยันการรีเซ็ต
          </Button>
        </div>
      </Modal>
    </div>
  );
};

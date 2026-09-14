import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Profile, DatabaseExport } from '../../types';
import { profileRepo, storageService } from '../../lib/storage/repositories';
import {
  getStoredGeminiApiKey,
  setStoredGeminiApiKey,
  clearStoredGeminiApiKey,
  testGeminiApiKey,
} from '../../lib/ai/geminiProvider';
import {
  Download,
  Upload,
  AlertTriangle,
  Info,
  Check,
  RotateCcw,
  Sparkles,
  Eye,
  EyeOff,
  ExternalLink,
  Key,
} from 'lucide-react';

export interface SettingsScreenProps {
  onProfileUpdated: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onProfileUpdated }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [dailyMinutes, setDailyMinutes] = useState<5 | 15>(5);
  const [timezone, setTimezone] = useState('Asia/Bangkok');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // AI Coach (BYOK) State
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [showGeminiKey, setShowGeminiKey] = useState<boolean>(false);
  const [isTestingKey, setIsTestingKey] = useState<boolean>(false);
  const [keyTestResult, setKeyTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [keySaveNotice, setKeySaveNotice] = useState<boolean>(false);

  // Import State & Confirmation
  const [pendingImportData, setPendingImportData] = useState<DatabaseExport | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset Confirmation Modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmationText, setResetConfirmationText] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      const p = (await profileRepo.getProfile()) || (await profileRepo.initDefaultProfile());
      setProfile(p);
      setDisplayName(p.displayName);
      setDailyMinutes(p.dailyMinutes || 5);
      setTimezone(p.timezone || 'Asia/Bangkok');
      setGeminiKey(getStoredGeminiApiKey() || '');
    };
    loadProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const updated: Profile = {
      ...profile,
      displayName: displayName.trim() || 'ปุ๊ก',
      dailyMinutes,
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

  // AI Coach (BYOK) Handlers
  const handleSaveGeminiKey = (e: React.FormEvent) => {
    e.preventDefault();
    setStoredGeminiApiKey(geminiKey);
    setKeySaveNotice(true);
    setKeyTestResult(null);
    setTimeout(() => setKeySaveNotice(false), 3000);
  };

  const handleClearGeminiKey = () => {
    clearStoredGeminiApiKey();
    setGeminiKey('');
    setKeyTestResult(null);
    setKeySaveNotice(false);
  };

  const handleTestGeminiKey = async () => {
    setIsTestingKey(true);
    setKeyTestResult(null);
    const result = await testGeminiApiKey(geminiKey);
    setIsTestingKey(false);
    setKeyTestResult(result);
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

      {/* AI Coach (BYOK) Card */}
      <Card padding="lg">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#E8F3EE',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text)', margin: 0 }}>
                ผู้ช่วย AI Coach (Google Gemini BYOK)
              </h2>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', margin: 0 }}>
                ช่วยตรวจประโยคภาษาอังกฤษ แนะนำสำนวนที่เป็นธรรมชาติ และอธิบายไวยากรณ์สั้นๆ
              </p>
            </div>
          </div>

          <Badge variant={getStoredGeminiApiKey() ? 'success' : 'neutral'}>
            {getStoredGeminiApiKey() ? 'เปิดใช้งานแล้ว (Active)' : 'ใช้งานในเครื่องเท่านั้น (Local-Only)'}
          </Badge>
        </div>

        {/* Privacy Note & Free Link */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: '8px',
            backgroundColor: '#F8F9F5',
            border: '1px solid var(--color-border)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-muted)',
            lineHeight: 1.6,
            marginBottom: 'var(--space-md)',
          }}
        >
          <div>
            🔒 <strong>ความเป็นส่วนตัวและความปลอดภัย:</strong> API Key จะถูกบันทึกไว้ใน Browser LocalStorage ของเครื่องคุณเท่านั้น ไม่มีการส่งผ่านเซิร์ฟเวอร์คนกลาง
          </div>
          <div style={{ marginTop: '4px' }}>
            ✨ <strong>ใช้งานฟรี:</strong> คุณสามารถสมัครรับ API Key ฟรีได้จาก{' '}
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

        <form onSubmit={handleSaveGeminiKey} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div>
            <label
              htmlFor="gemini-key-input"
              style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '6px' }}
            >
              Google Gemini API Key:
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Key
                size={16}
                color="var(--color-text-muted)"
                style={{ position: 'absolute', left: '12px' }}
              />
              <input
                id="gemini-key-input"
                type={showGeminiKey ? 'text' : 'password'}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                style={{
                  width: '100%',
                  padding: '10px 42px 10px 38px',
                  borderRadius: 'var(--radius-control)',
                  border: '1px solid var(--color-border)',
                  outline: 'none',
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: showGeminiKey ? 'inherit' : 'monospace',
                }}
              />
              <button
                type="button"
                onClick={() => setShowGeminiKey(!showGeminiKey)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
                title={showGeminiKey ? 'ซ่อนรหัส' : 'แสดงรหัส'}
              >
                {showGeminiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Key test feedback */}
          {keyTestResult && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '6px',
                backgroundColor: keyTestResult.success ? '#E8F5E9' : 'var(--color-error-soft)',
                color: keyTestResult.success ? 'var(--color-primary)' : 'var(--color-error)',
                fontSize: 'var(--font-size-xs)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {keyTestResult.success ? <Check size={16} /> : <AlertTriangle size={16} />}
              <span>{keyTestResult.message}</span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!geminiKey.trim() || isTestingKey}
                onClick={handleTestGeminiKey}
              >
                {isTestingKey ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}
              </Button>

              {getStoredGeminiApiKey() && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearGeminiKey}
                  style={{ color: 'var(--color-error)', fontSize: '12px' }}
                >
                  ลบคีย์
                </Button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {keySaveNotice && (
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={14} /> บันทึก API Key สำเร็จ
                </span>
              )}
              <Button type="submit" variant="primary" size="sm">
                บันทึกคีย์
              </Button>
            </div>
          </div>
        </form>
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
          การกระทำนี้จะล้างประวัติการฝึก บทเรียนที่เรียนจบ และคลังคำศัพท์ทั้งหมดที่คุณสร้างไว้ และเริ่มต้นโปรไฟล์ใหม่
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

# Implementation Tasks & Progress Checklist

เอกสารนี้ใช้ติดตามความคืบหน้าของการพัฒนาโปรเจกต์ **Daily English** ตามข้อกำหนดใน Development Brief

---

## 🚀 Phase 1 — Usable Local MVP (COMPLETED)

### 1. Project Scaffolding & Design Foundation
- [x] สร้างชุดเอกสารมาตรฐานครบ 9 ฉบับใน `daily-english/docs/`, `README.md`, `AGENTS.md`, `.env.example`
- [x] ติดตั้ง React + TypeScript + Vite + Dependencies (`idb`, `lucide-react`, `canvas-confetti`)
- [x] กำหนด Design Tokens และ CSS Variables ใน `src/index.css` (สี, typography Sarabun, spacing, radius)
- [x] สร้าง Responsive AppShell (Desktop Sidebar 232px, Tablet Compact, Mobile BottomNav 64px)

### 2. Core Domain & Data Layer
- [x] กำหนด TypeScript Models (`Profile`, `Lesson`, `Session`, `Phrase`, `ReviewEvent`)
- [x] พัฒนา IndexedDB Storage Layer (Database wrapper, Schema versioning)
- [x] พัฒนา Repository Interfaces และ Implementation (`ProfileRepo`, `SessionRepo`, `PhraseRepo`, `ReviewRepo`)
- [x] พัฒนา Spaced Repetition Heuristic Scheduler พร้อม Timezone grouping
- [x] สร้าง Seed Lessons 3 บทเรียนคุณภาพสูง (Design feedback, Daily life, Gaming)

### 3. Audio & Helper Modules
- [x] พัฒนา Web SpeechSynthesis Service (Speed 0.75x/1x, sentence replay, voice fallback state)
- [x] พัฒนา Web MediaRecorder Service (In-memory audio, permission request, typed fallback, cleanup)
- [x] พัฒนาระบบ Active Duration Timer ที่หยุดนับอัตโนมัติเมื่อ `document.visibilityState === 'hidden'`
- [x] พัฒนา `ExampleTutorProvider` สำหรับ Phase 1 (ส่งคืนแนวทางคำตอบและเกณฑ์ Self-check)

### 4. Feature Implementation
- [x] **Onboarding Screen (`/onboarding`)**: 4 ขั้นตอน (ชื่อ, เป้าหมาย, เวลา 5/15 นาที, ความมั่นใจ) พร้อมปุ่มข้าม
- [x] **Today Screen (`/`)**: Hero Card 1-Click Launch, Duration switch (5/15m), 4-step list, due phrases count, 7-day progress
- [x] **Practice Screen (`/practice`)**: แสดงแคตตาล็อก 3 หมวด, ค้นหา, กรองหมวด, Badge สถานะ
- [x] **Lesson Screen (`/lesson/:lessonId`)**: 5 ขั้นตอนครบถ้วน:
  - [x] 1. Listen (ควบคุมเสียง, Transcript & คำแปล toggle, fallback)
  - [x] 2. Repeat (อัดเสียง, ฟังซ้ำ, ลองใหม่, typed fallback, โหมด 5m vs 15m)
  - [x] 3. Use it (คำถามปลายเปิด, คำตอบตัวอย่างพร้อมป้าย "ตัวอย่าง", self-check)
  - [x] 4. Review (Flashcard ปิดเฉลย นึกก่อนเปิด, ปุ่มผลลัพธ์จำได้/ยังจำไม่ได้)
  - [x] 5. Summary (เวลาฝึกจริง, วลีที่เก็บ, ปุ่มกลับหน้าหลัก)
  - [x] บันทึกและดึงสถานะ Session กลับมาเรียนต่อได้ (Save & Resume)
  - [x] Idempotent Session completion (จบซ้ำไม่เบิ้ลสถิติ)
- [x] **My Phrases Screen (`/phrases`)**: ค้นหาวลี, กรองหมวด/ถึงกำหนด, เพิ่มวลีเอง, แก้ไข, ลบ (Confirm/Undo), ฟังเสียง
- [x] **Flashcard Review Session**: หน้าต่างทบทวนคำศัพท์ Think-before-reveal พร้อมปุ่มประเมินผล Spaced Repetition (Again / Remembered)
- [x] **Custom Learning Resources (`/resources`)**: แนบวิดีโอ YouTube (เล่นในตัว), พอดแคสต์, เพลง, ซีนหนัง พร้อมโหมด Shadowing และปุ่ม 1-Click Save to My Phrases
- [x] **Bulk Text & Subtitle Parser**: นำเข้าข้อความชุดใหญ่, ซับไตเติล SRT/VTT, เวลา และประโยคคู่สองภาษาในคลิกเดียว
- [x] **AI Coach Mode (BYOK: Google Gemini)**: ระบบตรวจความถูกต้องและแนะนำสำนวนภาษาอังกฤษที่เป็นธรรมชาติ พร้อมคำอธิบายภาษาไทยและเสียงอ่าน TTS
- [x] **Progress Screen (`/progress`)**: สถิติจริง (เซสชัน, นาทีจริง, 7 วัน, ประวัติบทเรียน, Empty State)
- [x] **Settings Screen (`/settings`)**: โปรไฟล์, จัดการ Gemini API Key, Export JSON, Import JSON (Validation + Modal), Reset Data (Modal confirm)

### 5. Testing & Polish
- [x] เขียน Unit Tests ครอบคลุม 11 Test Suites (52 tests ผ่าน 100%):
  - Spaced Repetition Scheduler
  - Active Timer pause on visibility hidden
  - Storage/Import validation
  - Idempotency
  - Seed lessons integrity
  - Media & YouTube ID utils
  - Bulk text & Subtitle parser
  - AI Coach Gemini Provider & fallback parser
  - Pronunciation Matcher (Offline Levenshtein & Word Alignment)
  - Pronunciation AI Coach (Gemini BYOK & Offline Heuristics)
  - Date & Timezone utils
- [x] ทดสอบความเข้ากันได้ของ Responsive Layout ที่ 375px, 768px, และ 1440px
- [x] ตรวจสอบ Accessibility (Focus ring, Touch target >= 44px, Contrast, Reduced motion)
- [x] รัน `npm test` และ `npm run build` ตรวจสอบ 0 errors (ผ่าน 100%)

---

## 🔮 Future Roadmap (สิ่งที่พัฒนาต่อได้ในอนาคต)

- [x] **Speech-to-Text & Word Match**: ใช้ Web Speech API ถอดเสียงที่ผู้ใช้อัดเทียบกับประโยคต้นฉบับ คำนวณ Accuracy Score และไฮไลต์คำชัดเจน/ใกล้เคียง/ตกหล่น พร้อม AI Pronunciation Evaluation
- [ ] **PWA (Progressive Web App)**: สร้าง Web Manifest และ Service Worker ให้ติดตั้งลงในมือถือ/เดสก์ท็อปและใช้งานแบบ Offline ได้
- [ ] **AI Lesson Generator from Resources**: สกัดเนื้อหาจากคลิป YouTube หรือเนื้อเพลงที่ผู้ใช้แนบให้กลายเป็นบทเรียนฝึก 4 ขั้นตอนอัตโนมัติ
- [ ] **Multi-Provider BYOK**: รองรับ OpenAI (GPT-4o-mini), Anthropic (Claude 3.5 Haiku) และ Local Ollama เพิ่มเติม
- [ ] **Cloud Sync (Optional Phase 3)**: ระบบ Sync ข้อมูลข้ามอุปกรณ์ผ่าน Secure Backend Proxy สำหรับผู้ใช้ที่ต้องการใช้งานหลายเครื่องพร้อมกัน


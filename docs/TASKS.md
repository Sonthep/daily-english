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
- [x] **AI Coach Mode (BYOK: OpenRouter)**: ระบบตรวจความถูกต้องและแนะนำสำนวนภาษาอังกฤษที่เป็นธรรมชาติ พร้อมคำอธิบายภาษาไทยและเสียงอ่าน TTS
- [x] **Progress Screen (`/progress`)**: สถิติจริง (เซสชัน, นาทีจริง, 7 วัน, ประวัติบทเรียน, Empty State)
- [x] **Settings Screen (`/settings`)**: โปรไฟล์, จัดการ OpenRouter API Key, Export JSON, Import JSON (Validation + Modal), Reset Data (Modal confirm)

### 5. Testing & Polish
- [x] เขียน Unit Tests ครอบคลุม 11 Test Suites (52 tests ผ่าน 100%):
  - Spaced Repetition Scheduler
  - Active Timer pause on visibility hidden
  - Storage/Import validation
  - Idempotency
  - Seed lessons integrity
  - Media & YouTube ID utils
  - Bulk text & Subtitle parser
  - AI Coach OpenRouter Provider & fallback parser
  - Pronunciation Matcher (Offline Levenshtein & Word Alignment)
  - Pronunciation AI Coach (OpenRouter BYOK & Offline Heuristics)
  - Date & Timezone utils
- [x] ทดสอบความเข้ากันได้ของ Responsive Layout ที่ 375px, 768px, และ 1440px
- [x] ตรวจสอบ Accessibility (Focus ring, Touch target >= 44px, Contrast, Reduced motion)
- [x] รัน `npm test` และ `npm run build` ตรวจสอบ 0 errors (ผ่าน 100%)

---

## UX/UI refresh — 2026-09-16

- [x] จัดหน้า Today ใหม่: บทเรียนเด่น เลือกเวลา 5/15 นาที ขั้นตอนฝึก คลังวลี และกิจกรรม 7 วันจากข้อมูลจริง
- [x] ปรับโทนครีม–เขียว เมนูภาษาไทย สถานะหน้าปัจจุบัน และปุ่มข้ามไปเนื้อหาสำหรับคีย์บอร์ด
- [x] แก้เมนูที่หายบนแท็บเล็ตและกริดที่กว้างเกินหน้าจอมือถือ
- [x] เขียน Unit Tests ครอบคลุม 14 Test Suites (65 tests ผ่าน 100%):
  - Spaced Repetition Scheduler
  - Active Timer pause on visibility hidden
  - Storage/Import validation
  - Idempotency
  - Seed lessons integrity
  - Media & YouTube ID utils
  - Bulk text & Subtitle parser
  - AI Coach OpenRouter Provider & fallback parser
  - Pronunciation Matcher (Offline Levenshtein & Word Alignment)
  - Pronunciation AI Coach (OpenRouter BYOK & Offline Heuristics)
  - Date & Timezone utils
  - UI Layout and responsive design
  - AI Lesson Generator from Resources
  - Custom Lessons & Repository Storage
- [x] ทดสอบความเข้ากันได้ของ Responsive Layout ที่ 375px, 768px, และ 1440px
- [x] ตรวจสอบ Accessibility (Focus ring, Touch target >= 44px, Contrast, Reduced motion)
- [x] รัน `npm test` และ `npm run build` ตรวจสอบ 0 errors (ผ่าน 100%)

## Product adjustment — 2026-09-28

- [x] เอาหน้า onboarding ออกจากเส้นทางเริ่มต้น ให้ผู้ใช้ใหม่เข้า Today ด้วยโปรไฟล์ค่าเริ่มต้น
- [x] รองรับโปรไฟล์เดิมที่ยังมีสถานะ onboarding ไม่เสร็จ โดยทำเครื่องหมายว่าเสร็จเมื่อเปิดแอป

## AI feedback reliability — 2026-09-29

- [x] ป้องกัน AI feedback fallback หรือผลประเมินที่ขาด field ไม่ให้แสดงว่าผู้ใช้สื่อความหมายเข้าใจ
- [x] แยก label ของ AI feedback กับตัวอย่าง Self-check และเพิ่ม regression tests

## Reliability and release checks — 2026-09-29

- [x] ตรวจสอบ import schema v1/v2 และข้อมูลทุก record ก่อนเปิด transaction พร้อม regression tests
- [x] ย้าย OpenRouter API Key จาก URL ไป HTTPS Bearer header และยกเลิกการอ่านคีย์จาก `VITE_*`
- [x] ปรับเอกสาร BYOK ให้ระบุข้อจำกัดของ LocalStorage และอัปเดตคำเตือนใน UI
- [x] เปลี่ยนโปรไฟล์เริ่มต้นเป็นกลาง และเปิดให้แก้เป้าหมายกับระดับความมั่นใจใน Settings
- [x] เพิ่ม Playwright smoke tests สำหรับ first launch, profile settings และการคงค่าเมื่อ refresh
- [x] Lazy-load route screens ลด main bundle จากประมาณ 527 kB เหลือ 274 kB
- [x] อัปเดต Vitest และ happy-dom ตาม advisories; `npm audit` ไม่พบช่องโหว่

## Common vocabulary bank — 2026-09-29

- [x] เพิ่มรายการคำอังกฤษ 3,000 คำเรียงตามความถี่ พร้อม attribution และ CC BY-SA 4.0
- [x] เพิ่มหน้าค้นหา/แบ่งหน้าในคลังวลี และเลือกคำเข้าแบบฟอร์ม flashcard โดยต้องเติมคำแปลก่อนบันทึก
- [x] ป้องกันคำที่มีอยู่แล้วถูกเพิ่มซ้ำ และเพิ่ม tests สำหรับข้อมูล การค้นหา และ pagination

## Vocabulary-to-lesson practice — 2026-09-29

- [x] เลือกคำ 3–5 คำและบริบทเพื่อสร้างบทเรียนผ่าน OpenRouter BYOK
- [x] ตรวจผลลัพธ์ให้มีทุกคำเป้าหมาย พร้อม preview คำแปล/ประโยค/โจทย์ก่อนบันทึก
- [x] ปฏิเสธ fallback เมื่อไม่มีคีย์หรือผล AI ไม่ครบ และเพิ่มตัวเลือกบันทึกหรือเริ่มฝึกทันที
- [x] ลด latency ด้วย OpenRouter free Qwen/DeepSeek routing, no-paid-fallback และ retry แบบจำกัด

## Local-only product mode — 2026-10-09

- [x] Remove API-key setup and OpenRouter proxy/client; clear keys saved by earlier versions
- [x] Keep answer feedback and pronunciation tips as clearly labeled local examples/self-checks
- [x] Generate Resource and vocabulary lessons from local templates; parse pasted transcripts locally
- [x] Preserve backup/import/delete behavior for locally generated custom lessons
- [x] Replace API-dependent tests with local-only and no-network regression tests

## Resource deletion reliability — 2026-10-09

- [x] Seed Resources only when the IndexedDB resources store is first created, so deleting the last Resource persists across reads and reloads
- [x] Add a Playwright regression test for deleting the final Resource

---

## 🔮 Future Roadmap (สิ่งที่พัฒนาต่อได้ในอนาคต)

- [x] **Speech-to-Text & Word Match**: ใช้ Web Speech API ถอดเสียงที่ผู้ใช้อัดเทียบกับประโยคต้นฉบับ คำนวณ Accuracy Score และไฮไลต์คำชัดเจน/ใกล้เคียง/ตกหล่น พร้อม AI Pronunciation Evaluation
- [x] **PWA (Progressive Web App)**: สร้าง Web Manifest และ Service Worker ให้ติดตั้งลงในมือถือ/เดสก์ท็อปและใช้งานแบบ Offline ได้ พร้อมปุ่มแจ้งเตือนการติดตั้ง
- [x] **AI Lesson Generator from Resources**: สกัดเนื้อหาจากคลิป YouTube หรือเนื้อเพลงที่ผู้ใช้แนบให้กลายเป็นบทเรียนฝึก 5 ขั้นตอนอัตโนมัติ พร้อมบันทึกเข้าสู่คลังบทเรียนและเริ่มเรียนได้ทันที
- [ ] **Cloud Sync (Optional Phase 3)**: ระบบ Sync ข้อมูลข้ามอุปกรณ์ผ่าน Secure Backend Proxy สำหรับผู้ใช้ที่ต้องการใช้งานหลายเครื่องพร้อมกัน

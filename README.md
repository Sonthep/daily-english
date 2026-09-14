# Daily English

> เว็บแอปพลิเคชันฝึกภาษาอังกฤษส่วนตัว เรียบสงบ สบายตา เริ่มฝึกได้ทันทีใน 1 คลิก พร้อมระบบทบทวนคำศัพท์ (Spaced Repetition) และบทเรียนสำหรับคนทำงานสายกราฟิกและการตลาด

Daily English ถูกออกแบบมาเพื่อตอบโจทย์ผู้ใช้ที่ต้องการฝึกภาษาอังกฤษจากเรื่องใกล้ตัว ใช้เวลาสั้นๆ เพียงวันละ 5 หรือ 15 นาที โดยไม่สร้างความกดดัน ไม่มี gamification ที่เกินจำเป็น และเน้นความต่อเนื่องในชีวิตจริง

---

## 🌟 คุณสมบัติเด่น (Features)

- **1-Click Start**: เริ่มฝึกบทเรียนประจำวันได้ทันทีจากหน้า Today โดยไม่ต้องตั้งค่าซ้ำซ้อน
- **Flexible Modes**: เลือกระยะเวลาฝึกได้ระหว่าง 5 นาที (เร็ว กระชับ) หรือ 15 นาที (เข้มข้นขึ้น)
- **5-Step Practical Lesson Flow**:
  1. **Listen**: ฟังประโยคภาษาอังกฤษด้วย Web Speech Synthesis, ปรับความเร็ว 0.75x / 1.0x, ซ่อน/แสดงคำแปล
  2. **Repeat**: ฝึกพูดตามพร้อมระบบอัดเสียงเพื่อฟังเสียงตัวเอง หรือเลือกพิมพ์ตอบ (Typed Fallback) หากไม่สะดวกใช้ไมโครโฟน
  3. **Use it**: ฝึกนำประโยคไปประยุกต์ตอบคำถามเกี่ยวกับตัวเอง พร้อมคำตอบตัวอย่าง หรือขอคำแนะนำจาก AI Coach
  4. **Review**: ทบทวนวลีสำคัญในบทเรียนผ่าน Flashcard แบบนึกก่อนเปิดเฉลย
  5. **Summary**: สรุปเวลาที่ฝึกจริง (ระบบหยุดนับเวลาอัตโนมัติเมื่อซ่อนแท็บ) และบันทึกวลีเข้าคลังอัตโนมัติ
- **คลังสื่อเรียนรู้ที่แนบได้เอง (Custom Learning Resources)**:
  - แนบลิงก์วิดีโอ YouTube (เล่นในตัว ไม่เก็บคุกกี้), พอดแคสต์, เพลง หรือบทความที่คุณสนใจ
  - โหมด **Shadowing** ฝึกฟังและอัดเสียงพูดตามประโยคสำคัญของสื่อนั้น
  - **Bulk Text & Subtitle Parser**: วางเนื้อเพลง ซับไตเติล (SRT) หรือประโยคสองภาษา (EN/TH) พร้อมกันได้ในคลิกเดียว
  - ปุ่ม 1-Click บันทึกวลีเด่นเข้าคลังคำศัพท์ทันที
- **ผู้ช่วย AI Coach (Bring Your Own Key — Google Gemini)**:
  - รองรับการใส่ Google Gemini API Key ของผู้ใช้เอง (ฟรีจาก Google AI Studio)
  - เก็บรักษา API Key ใน Browser LocalStorage 100% ปลอดภัย ไม่ส่งผ่านเซิร์ฟเวอร์คนกลาง
  - ช่วยตรวจประโยค แนะนำสำนวนที่เป็นธรรมชาติแบบเจ้าของภาษา พร้อมคำอธิบายภาษาไทยและเสียงอ่าน TTS
- **Personal Phrase Bank & Spaced Repetition**:
  - คลังคำศัพท์/วลีส่วนตัว เพิ่ม ลบ แก้ไข ฟังเสียง และระบบคำนวณรอบทบทวน (Heuristic Stage 0..5)
  - **Flashcard Review Session**: หน้าต่างทบทวนคำศัพท์ที่ครบกำหนดแบบ Think-before-reveal
- **Local-First & Data Ownership**: ข้อมูลทั้งหมดถูกเก็บไว้ในเบราว์เซอร์ของคุณผ่าน IndexedDB พร้อมฟังก์ชัน Export และ Import ข้อมูล JSON อย่างปลอดภัย
- **Progress Tracking จากข้อมูลจริง**: แสดงจำนวนบทเรียนที่จบ เวลาฝึกจริง วลีที่ต้องทบทวน โดยไม่มีสถิติที่แต่งขึ้นหรือการอ้างอิงระดับ CEFR หลอกลวง

---

## 🛠️ ความต้องการของระบบ (Prerequisites)

- **Node.js**: เวอร์ชัน `>= 18.0.0` (แนะนำ LTS หรือ Node 20+)
- **NPM**: เวอร์ชัน `>= 9.0.0`
- **เบราว์เซอร์**: Chrome, Edge, Safari หรือ Firefox รุ่นใหม่ที่รองรับ IndexedDB, Web SpeechSynthesis API และ MediaRecorder API

---

## 🚀 วิธีติดตั้งและเริ่มต้นใช้งาน

### 1. ติดตั้ง Dependencies
เปิด Terminal เข้าสู่โฟลเดอร์ `daily-english`:
```bash
npm install
```

### 2. รันแอปพลิเคชันใน Development Mode
```bash
npm run dev
```
ระบบจะแสดง URL บนหน้าจอ (โดยปกติคือ `http://localhost:5173/`) สามารถเปิดใช้งานผ่านเบราว์เซอร์ได้ทันที

### 3. รัน Unit Tests
```bash
npm test
```

### 4. Build สำหรับ Production
```bash
npm run build
```
ไฟล์ Production จะถูกสร้างไว้ในโฟลเดอร์ `dist/` และสามารถทดสอบรันผล build ได้ด้วยคำสั่ง:
```bash
npm run preview
```

---

## 📋 ข้อจำกัดและข้อแนะนำด้านเทคนิค (Technical Notes)

1. **Local Storage Only**: ข้อมูลบันทึกอยู่ใน IndexedDB ของเครื่องและเบราว์เซอร์ปัจจุบัน ไม่มีการเชื่อมต่อคลาวด์หรือซิงค์ข้ามอุปกรณ์ หากต้องการย้ายเครื่องให้ใช้ฟังก์ชัน **Export JSON** ในหน้า Settings
2. **In-Memory Audio**: ไฟล์เสียงที่บันทึกขณะฝึกบทเรียน (Repeat / Shadowing) จะถูกเก็บไว้ใน Memory ชั่วคราว และจะถูกเคลียร์เมื่อออกจากหน้าหรือรีเฟรชหน้าเว็บ เพื่อความเป็นส่วนตัวและประหยัดพื้นที่จัดเก็บ
3. **AI Coach (BYOK)**: รองรับการใส่ Google Gemini API Key ของตนเองได้ฟรีในหน้า Settings โดยระบบจะเก็บคีย์ไว้ในเครื่องของผู้ใช้เท่านั้น หากไม่มีคีย์ ระบบจะใช้ Local Example & Self-Check แทนอัตโนมัติ
4. **Voice Synthesizer**: คุณภาพและสำเนียงเสียงอ่านภาษาอังกฤษขึ้นอยู่กับเสียงที่ติดตั้งอยู่ในระบบปฏิบัติการและเบราว์เซอร์ของผู้ใช้

---

## 📂 โครงสร้างเอกสารเพิ่มเติม

- **[HANDOVER.md](HANDOVER.md)** — **คู่มือ Handover สำหรับย้ายไป Environment อื่น และ Roadmap พัฒนาต่อ**
- [AGENTS.md](AGENTS.md) — กติกาและข้อพึงปฏิบัติสำหรับ AI Agent ที่พัฒนาต่อ
- [docs/PRD.md](docs/PRD.md) — Product Requirements Document รายละเอียดฟีเจอร์และ User Stories
- [docs/UX-UI.md](docs/UX-UI.md) — Design Tokens, Typography, Layout และ Interactions
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — สถาปัตยกรรมระบบ ขอบเขตโมดูล และ Repositories
- [docs/DATA-MODEL.md](docs/DATA-MODEL.md) — โครงสร้างข้อมูล IndexedDB และอัลกอริทึม Spaced Repetition
- [docs/TASKS.md](docs/TASKS.md) — Checklist สถานะการพัฒนางานตาม Phase และ Future Roadmap
- [docs/TEST-PLAN.md](docs/TEST-PLAN.md) — แผนการทดสอบและเกณฑ์การตรวจรับ (Acceptance Criteria)
- [docs/AI-INTEGRATION.md](docs/AI-INTEGRATION.md) — ขอบเขต AI Tutor และข้อกำหนดความปลอดภัย

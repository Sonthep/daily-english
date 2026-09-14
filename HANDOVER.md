# Daily English — Project Handover & Environment Setup Guide

> **สถานะโครงการ**: พร้อมใช้งานจริง (Production-Ready MVP + Custom Resources + AI Coach BYOK)  
> **อัปเดตล่าสุด**: กันยายน 2026  
> **ชุดการทดสอบ**: ผ่าน 100% (9 Test Suites, 39 Automated Tests)  
> **TypeScript & Build**: ผ่าน 100% (0 Errors)

เอกสารฉบับนี้จัดทำขึ้นเพื่อให้ผู้พัฒนาหรือ AI Agent คนถัดไปสามารถ **clone / ย้ายโปรเจกต์ไปยัง Environment อื่น (เช่น เครื่องใหม่, เซิร์ฟเวอร์อื่น, หรือ Docker)** แล้วสามารถติดตั้ง รัน ทดสอบ และพัฒนาฟีเจอร์ที่เหลือต่อได้ทันทีโดยไม่ต้องเสียเวลาไล่โค้ดใหม่

---

## ⚡ Quick Start: รันใน Environment ใหม่ทันที

### 1. ความต้องการของระบบ (Prerequisites)
- **Node.js**: เวอร์ชัน `>= 18.0.0` (แนะนำ Node 20 LTS)
- **NPM**: เวอร์ชัน `>= 9.0.0`
- **เบราว์เซอร์**: Chrome, Edge, Safari หรือ Firefox รุ่นใหม่ (รองรับ IndexedDB, Web SpeechSynthesis, Web Audio MediaRecorder)

### 2. คำสั่งเริ่มต้นทำงาน (CLI Commands)
```bash
# 1. เข้าสู่โฟลเดอร์โปรเจกต์
cd daily-english

# 2. ติดตั้ง Dependencies ทั้งหมด
npm install

# 3. รันเซิร์ฟเวอร์สำหรับพัฒนา (Development Server)
npm run dev
# เข้าใช้งานที่: http://localhost:5173/

# 4. รันชุดทดสอบอัตโนมัติ (Automated Unit Tests)
npm test

# 5. ตรวจสอบ Typecheck และสร้าง Production Bundle
npm run build

# 6. พรีวิว Production Build ในเครื่อง
npm run preview
```

---

## 📊 สถานะการพัฒนาปัจจุบัน (What is Built & Completed)

ระบบได้รับการพัฒนาและทดสอบครอบคลุมทุกเลเยอร์ตามข้อกำหนด:

| หมวดหมู่ฟังก์ชัน | สถานะ | รายละเอียด |
|---|---|---|
| **1. Core AppShell & UI Foundation** | ✅ เสร็จสมบูรณ์ | Responsive เต็มรูปแบบ (Desktop Sidebar 232px, Tablet, Mobile BottomNav 64px), ธีมสีมินิมอลสบายตา (#F8F9F5, #245C4F), ฟอนต์ Sarabun, Focus-visible ครบ |
| **2. Local Storage Layer** | ✅ เสร็จสมบูรณ์ | IndexedDB Schema v2 (`idb`), Repositories สำหรับ Profile, Lessons, Sessions, Phrases, Reviews, Resources พร้อมระบบ Export / Import JSON และ Reset Data |
| **3. Lesson Flow 5 ขั้นตอน** | ✅ เสร็จสมบูรณ์ | Listen (Web Speech TTS, สปีด 0.75x/1.0x), Repeat (อัดเสียงใน RAM + Typed Fallback), Use it (ประยุกต์ตอบ), Review (Flashcard ปิดเฉลย), Summary (นับเวลาจริง หยุดเมื่อซ่อนแท็บ) |
| **4. Spaced Repetition Scheduler** | ✅ เสร็จสมบูรณ์ | อัลกอริทึม Heuristic 6 ระดับ (Stage 0 ถึง 5: 10m, +1d, +3d, +7d, +14d, +30d) พร้อม Timezone Grouping และคำนวณ Due Phrases อัตโนมัติ |
| **5. Flashcard Review Modal** | ✅ เสร็จสมบูรณ์ | หน้าต่างทบทวนคำศัพท์คลัง My Phrases แบบ Think-before-reveal พร้อมประเมิน Again / Remembered และอัปเดตสถานะใน IndexedDB ทันที |
| **6. Custom Learning Resources** | ✅ เสร็จสมบูรณ์ | แนบวิดีโอ YouTube (เล่นในตัว ไม่เก็บคุกกี้), พอดแคสต์, เพลง, ซีนหนัง พร้อมโหมด Shadowing อัดเสียงเทียบ และปุ่ม 1-Click Save to My Phrases |
| **7. Bulk Text & Subtitle Parser** | ✅ เสร็จสมบูรณ์ | วางเนื้อเพลง, ซับไตเติล SRT/VTT, เวลา (เช่น 01:24), ประโยคสองภาษา (EN/TH) ระบบตัดแบ่งและสกัดคำแปลให้อัตโนมัติในคลิกเดียว |
| **8. AI Coach (BYOK: Gemini 1.5 Flash)** | ✅ เสร็จสมบูรณ์ | เก็บ API Key ใน Browser LocalStorage 100% ปลอดภัย, มีหน้าต่างตรวจคีย์ใน Settings, AI ให้คำแนะนำสำนวนที่เป็นธรรมชาติใน Step 3 และ Resource Reflection พร้อมเสียงอ่าน TTS |
| **9. Automated Test Suite** | ✅ เสร็จสมบูรณ์ | 9 ไฟล์ทดสอบ (39 tests ผ่าน 100%) ครอบคลุม Storage, Scheduler, Idempotency, Active Timer, Resources, Bulk Parser, และ AI Coach |

---

## 🗂️ แผนผังโครงสร้างซอร์สโค้ด (Source Code Map)

```
daily-english/
├── docs/                           # เอกสารข้อกำหนดระบบ (PRD, UX-UI, Architecture, Data-Model, etc.)
├── tests/                          # Automated Unit Tests (Vitest)
│   ├── activeTimer.test.ts         # ทดสอบตัวจับเวลาหยุดนับเมื่อซ่อนแท็บ
│   ├── aiCoach.test.ts             # ทดสอบ AI Coach, Storage และ JSON Parser
│   ├── bulkParser.test.ts          # ทดสอบตัวแปลงข้อความชุดใหญ่และซับไตเติล
│   ├── dateUtils.test.ts           # ทดสอบการแปลงเวลาและ Timezone
│   ├── idempotency.test.ts         # ทดสอบ Session Idempotency
│   ├── resources.test.ts           # ทดสอบ YouTube ID Parser และ Media Utils
│   ├── scheduler.test.ts           # ทดสอบ Spaced Repetition Stage progression
│   ├── seedLessons.test.ts         # ทดสอบโครงสร้างบทเรียนตั้งต้น
│   └── storageValidation.test.ts   # ทดสอบการนำเข้าไฟล์สำรอง JSON
├── src/
│   ├── types/index.ts              # Single Source of Truth สำหรับ Data Types
│   ├── data/
│   │   ├── lessons.ts              # Seed Lessons: Design feedback, Daily life, Gaming
│   │   └── seedResources.ts        # Seed Resource: Jack Ma YouTube Speech
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── types.ts            # TextFeedbackResponse, ITutorProvider
│   │   │   ├── geminiProvider.ts   # Google Gemini REST Client & Local Storage Key Manager
│   │   │   └── provider.ts         # Active Tutor Provider Factory (Gemini vs Example Fallback)
│   │   ├── audio/
│   │   │   ├── speech.ts           # Web SpeechSynthesis Controller
│   │   │   └── recorder.ts         # In-memory MediaRecorder with fallback
│   │   ├── resources/
│   │   │   ├── mediaUtils.ts       # YouTube Regex extractor & embed builder
│   │   │   └── bulkParser.ts       # Bulk transcript / SRT / bilingual line parser
│   │   ├── review/
│   │   │   ├── scheduler.ts        # Spaced Repetition calculations
│   │   │   └── dateUtils.ts        # Thai relative dates & 7-day aggregation
│   │   └── storage/
│   │       ├── db.ts               # IndexedDB Schema definition (v2)
│   │       └── repositories.ts     # Repositories & StorageService (Export/Import/Reset)
│   ├── components/
│   │   ├── ui/                     # UI Primitives: Button, Card, Badge, Modal, Toast, EmptyState
│   │   ├── layout/                 # AppShell, Desktop Sidebar, Mobile BottomNav
│   │   └── ai/
│   │       └── AICoachFeedbackCard.tsx # การ์ดแสดงคำแนะนำประโยคเป็นธรรมชาติและเสียงอ่าน
│   └── features/
│       ├── onboarding/             # Onboarding Screen 4 สเต็ป
│       ├── today/                  # หน้าแรก 1-Click Launch & Daily Status
│       ├── practice/               # แคตตาล็อกบทเรียน
│       ├── lesson/                 # หน้าเล่นบทเรียน 5 สเต็ป (พร้อม AI Coach ใน Use it)
│       ├── phrases/                # คลังคำศัพท์ + Flashcard Review Session Modal
│       ├── resources/              # คลังสื่อเรียนรู้ + หน้าจอศึกษา + Shadowing + Bulk Paste
│       ├── progress/               # สถิติเวลาจริงและประวัติการเรียน
│       └── settings/               # ตั้งค่าโปรไฟล์, AI Coach Gemini Key, Backup/Restore JSON
```

---

## 🔮 สิ่งที่เหลือและแนวทางการพัฒนาต่อ (Remaining Roadmap)

หากต้องการพัฒนาฟีเจอร์เพิ่มในรอบถัดไป แนะนำทำตามลำดับความคุ้มค่า (Impact/Effort) ดังนี้:

### 1. ระบบเทียบเสียงพูดจริง (Speech-to-Text & Word Match)
- **เป้าหมาย**: เมื่อผู้ใช้อัดเสียงในโหมด Shadowing ให้ถอดเสียงออกมาเปรียบเทียบกับประโยคต้นฉบับ
- **เทคโนโลยี**: ใช้ `webkitSpeechRecognition` / `SpeechRecognition` API ในเบราว์เซอร์ (ฟรี 100% ไม่ต้องต่อเน็ต/ไม่เสียเงิน)
- **สิ่งที่ต้องทำ**: ไฮไลต์คำที่ออกเสียงตรงกันเป็นสีเขียว และคำที่ตกหล่นเป็นสีเทา

### 2. ติดตั้งเป็นแอป PWA (Progressive Web App)
- **เป้าหมาย**: ให้ผู้ใช้กด "Add to Home Screen" ติดตั้งลงในมือถือ iOS / Android หรือเดสก์ท็อปเสมือนแอป Native
- **สิ่งที่ต้องทำ**:
  - สร้าง `public/manifest.json` พร้อม App Icons
  - เพิ่ม Service Worker สำหรับ Cache Static Assets (`vite-plugin-pwa` หรือ Custom Worker)
  - ใช้งานแบบ Offline ได้ 100%

### 3. ระบบสร้างบทเรียน 4 สเต็ปจาก Resource อัตโนมัติ (Lesson Generator)
- **เป้าหมาย**: นำ Resource ที่ผู้ใช้แนบ (เช่น คลิป YouTube หรือเนื้อเพลง) มาแปลงเป็นบทเรียน 4 ขั้นตอน (Warm-up, Shadowing, Rephrase, Reflection) ผ่าน AI Coach
- **สิ่งที่ต้องทำ**: เพิ่มฟังก์ชันใน `geminiProvider.ts` ให้ช่วยสกัด Prompt คำถามและคำศัพท์เป้าหมายจากประโยคของสื่อ

### 4. ตัวเลือกเชื่อมต่อ AI เพิ่มเติม (Multi-Provider BYOK)
- **เป้าหมาย**: นอกจาก Google Gemini แล้ว ให้ผู้ใช้สามารถเลือกใส่คีย์ของ **OpenAI (GPT-4o-mini)**, **Anthropic (Claude 3.5 Haiku)** หรือ **Local Ollama** ได้ตามความชอบ

---

## 🔒 กฎเหล็กและข้อพึงระวังในการพัฒนาต่อ (Important Constraints)

1. **ห้ามบันทึก Secret / API Key ลงใน Code หรือ Git เด็ดขาด**:
   - คีย์ AI ของผู้ใช้จะต้องถูกเก็บใน `localStorage` ของผู้ใช้เท่านั้น หรือส่งผ่าน Header ของ Client
2. **Local-First & Data Privacy**:
   - ข้อมูลคำศัพท์และบทเรียนต้องทำงานได้บน IndexedDB ของเครื่องผู้ใช้เสมอ หากไม่มีอินเทอร์เน็ต แอปจะต้องไม่พังและยังเข้าเรียนได้ตามปกติ
3. **Audio In-Memory Lifecycle**:
   - เมื่ออัดเสียงเสร็จหรือออกจากหน้าจอ ต้องสั่ง `recorder.cleanup()` และ `stream.getTracks().forEach(t => t.stop())` เสมอ เพื่อป้องกันปัญหาไมโครโฟนค้างและ Memory Leak
4. **TypeScript Strictness**:
   - โปรเจกต์เปิด `noUnusedLocals: true` ดังนั้นอย่าประกาศตัวแปรหรือ Import ทิ้งไว้โดยไม่ได้ใช้งาน
5. **Aesthetic Minimal Warmth**:
   - คงเอกลักษณ์ความสงบ สบายตา สีเขียวใบชา `#245C4F` แบ็กกราวด์ `#F8F9F5` และใช้ฟอนต์ `Sarabun` เสมอ ห้ามใส่สีฉูดฉาดหรือเสียงแจ้งเตือนที่กดดันผู้ใช้

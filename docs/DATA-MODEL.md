# Data Model Specification — Daily English

## 1. ข้อมูลโมเดลหลัก (TypeScript Interfaces)

ข้อมูลทั้งหมดจะถูกจัดเก็บใน **IndexedDB** ภายใต้ชื่อฐานข้อมูล `daily_english_db` และมีหมายเลข `schemaVersion: 1`

### 1.1 Profile (`profiles` store)
เก็บบัญชีและการตั้งค่าของผู้ใช้:
```typescript
export interface Profile {
  id: string;                         // Unique ID (เช่น 'default-user')
  displayName: string;                // ชื่อที่อยากให้เรียก (เช่น 'ปุ๊ก')
  goals: string[];                    // เป้าหมาย เช่น ['work', 'daily', 'gaming']
  dailyMinutes: 5 | 15;               // ระยะเวลาฝึกตั้งต้น: 5 หรือ 15 นาที
  confidence: 'beginner' | 'intermediate' | 'advancing'; // ความมั่นใจ
  timezone: string;                   // ค่ามาตรฐาน 'Asia/Bangkok'
  onboardingCompleted: boolean;       // สถานะว่าผ่าน Onboarding หรือยัง
  createdAt: string;                  // ISO 8601 UTC
  updatedAt: string;                  // ISO 8601 UTC
}
```

### 1.2 Lesson (`lessons` store)
ข้อมูลบทเรียน (รวมทั้ง Seed lessons และบทเรียนเพิ่มเติม):
```typescript
export interface LessonSentence {
  id: string;                         // เช่น 's1'
  en: string;                         // ประโยคภาษาอังกฤษ
  th: string;                         // คำแปลภาษาไทย
}

export interface LessonPrompt {
  id: string;                         // เช่น 'p1'
  questionEn: string;                 // คำถามภาษาอังกฤษ
  questionTh: string;                 // คำถามภาษาไทย
  sampleAnswer: string;               // ตัวอย่างคำตอบ (มีป้าย "ตัวอย่าง" เสมอ)
}

export interface TargetPhrase {
  id: string;                         // เช่น 'tp1'
  en: string;                         // วลีภาษาอังกฤษ
  th: string;                         // คำแปลภาษาไทย
  example: string;                    // ประโยคตัวอย่าง
  category: string;                   // หมวดหมู่
}

export interface Lesson {
  id: string;                         // เช่น 'design-feedback'
  titleTh: string;                    // ชื่อภาษาไทย
  titleEn: string;                    // ชื่อภาษาอังกฤษ
  category: 'Design & Marketing' | 'Daily Life' | 'Gaming';
  objectiveTh: string;                // สิ่งที่จะทำได้หลังฝึก
  sentences: LessonSentence[];        // ประโยคสำหรับ Listen & Repeat
  prompts: LessonPrompt[];            // คำถามสำหรับ Use it
  targetPhrases: TargetPhrase[];      // วลีเป้าหมายสำหรับ Review
  createdAt: string;                  // ISO 8601 UTC
}
```

### 1.3 Session (`sessions` store)
บันทึกสถานะการเรียนบทเรียน เพื่อให้สามารถกลับมาฝึกต่อได้ (Resume) หลังรีเฟรช:
```typescript
export interface UserAnswer {
  promptId: string;
  answerText: string;
  answeredAt: string;                 // ISO 8601 UTC
}

export interface Session {
  id: string;                         // Unique Session UUID
  lessonId: string;                   // อ้างอิง ID ของบทเรียน
  modeMinutes: 5 | 15;                // โหมดเวลาที่เลือกสำหรับเซสชันนี้
  currentStep: 'listen' | 'repeat' | 'use_it' | 'review' | 'summary';
  currentItemIndex: number;           // ดัชนีของประโยคหรือคำถามปัจจุบัน
  answers: UserAnswer[];              // คำตอบที่พิมพ์ใน Use it
  reviewedPhraseIds: string[];        // รายชื่อวลีที่ทบทวนแล้ว
  activeDurationSeconds: number;      // เวลาเรียนจริง (หยุดเมื่อแท็บถูกซ่อน)
  startedAt: string;                  // ISO 8601 UTC
  updatedAt: string;                  // ISO 8601 UTC
  completedAt: string | null;         // ISO 8601 UTC หรือ null หากยังไม่จบ
}
```

### 1.4 Phrase (`phrases` store)
คลังคำศัพท์และวลีที่ผู้ใช้บันทึกไว้ทบทวน:
```typescript
export interface Phrase {
  id: string;                         // Unique Phrase UUID
  en: string;                         // วลีภาษาอังกฤษ
  th: string;                         // คำแปลภาษาไทย
  example: string;                    // ประโยคตัวอย่าง
  category: string;                   // หมวดหมู่ เช่น 'Design & Marketing'
  sourceLessonId: string | null;      // ID บทเรียนต้นทาง (null ถ้าผู้ใช้เพิ่มเอง)
  reviewStage: number;                // 0, 1, 2, 3, 4, 5+
  dueAt: string;                      // ISO 8601 UTC กำหนดวันทบทวนรอบถัดไป
  createdAt: string;                  // ISO 8601 UTC
  updatedAt: string;                  // ISO 8601 UTC
}
```

### 1.5 ReviewEvent (`review_events` store)
ประวัติการกดทบทวนคำศัพท์แต่ละครั้ง:
```typescript
export interface ReviewEvent {
  id: string;                         // Unique Event UUID
  phraseId: string;                   // อ้างอิง Phrase ID
  result: 'again' | 'remembered';     // ผลลัพธ์
  reviewedAt: string;                 // ISO 8601 UTC
  previousStage: number;              // ขั้นก่อนหน้า
  nextStage: number;                  // ขั้นถัดไป
}
```

---

## 2. อัลกอริทึมการนัดหมายทบทวน (Spaced Repetition Heuristic)

ระบบใช้กฎง่าย (Heuristic) ไม่ซับซ้อน เพื่อให้คาดเดาได้และตรงไปตรงมา:

| ผลลัพธ์ที่กด | Stage ปัจจุบัน | Stage ถัดไป | ระยะเวลาจนถึงรอบถัดไป |
|---|---|---|---|
| **วลีใหม่แรกเริ่ม** | - | `0` | ครบกำหนดทันที (`dueAt = now`) |
| **จำได้ (Remembered)** | `0` | `1` | +1 วัน (`now + 24 ชั่วโมง`) |
| **จำได้ (Remembered)** | `1` | `2` | +3 วัน (`now + 72 ชั่วโมง`) |
| **จำได้ (Remembered)** | `2` | `3` | +7 วัน (`now + 168 ชั่วโมง`) |
| **จำได้ (Remembered)** | `3` | `4` | +14 วัน (`now + 336 ชั่วโมง`) |
| **จำได้ (Remembered)** | `4` หรือ `5+` | `min(stage + 1, 5)` | +30 วัน (`now + 720 ชั่วโมง`) |
| **ยังจำไม่ได้ (Again)** | ทุก Stage | `0` | +10 นาที (`now + 600 วินาที`) |

- **การจัดเรียง**: รายการวลีที่ต้องทบทวนจะเรียงตาม `dueAt` เก่าที่สุดขึ้นก่อน (Oldest Due First)

---

## 3. กฎการจัดการเวลาและ Timezone (Timezone & Idempotency)

1. **บันทึกในรูปแบบ UTC เสมอ**:
   - วันที่และเวลาทั้งหมดที่บันทึกลงใน IndexedDB ต้องอยู่ในรูปแบบ ISO 8601 UTC string (เช่น `2026-09-14T15:30:00.000Z`)
2. **การจัดกลุ่ม 7 วันในหน้า Today / Progress**:
   - เมื่อต้องการจัดกลุ่มประวัติการเรียนเป็นรายวัน จะแปลงเวลา UTC ไปเป็นเวลาท้องถิ่นตาม Timezone ของผู้ใช้ (Default: `Asia/Bangkok`) ก่อนนับจำนวนในแต่ละวัน
3. **Idempotent Session Completion**:
   - เมื่อผู้ใช้กดจบเซสชัน (`completeSession`) ฟังก์ชันจะตรวจสอบว่า `completedAt` มีค่าอยู่แล้วหรือไม่ หากมีอยู่แล้วจะไม่เพิ่มประวัติหรือสถิติซ้ำซ้อน

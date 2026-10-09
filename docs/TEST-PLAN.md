# Test Plan & Acceptance Criteria — Daily English

เอกสารนี้ระบุกรอบการทดสอบและกรณีทดสอบ (Test Cases) สำหรับตรวจสอบความถูกต้องของระบบ **Daily English** ตามข้อกำหนดใน Development Brief

---

## 🎯 Acceptance Criteria Matrix

| รหัส | ข้อกำหนดที่ต้องผ่าน (Acceptance Criteria) | ประเภทการทดสอบ | สถานะ |
|---|---|---|---|
| **AC-01** | ผู้ใช้ใหม่เปิดแอปแล้วเข้า Today ได้ทันที โดยไม่แสดง Onboarding | E2E / Functional | ผ่าน (Playwright) |
| **AC-02** | ทำบทเรียนครบ 5 ขั้นตอนแล้วสามารถกดปุ่ม "กลับหน้าหลัก" ได้จริง | Functional | รอทดสอบ |
| **AC-03** | รีเฟรชหน้าเว็บแล้ว ข้อมูล Profile, Phrases และ Session คงอยู่ครบ | Storage / E2E | รอทดสอบ |
| **AC-04** | การกด Complete Session ซ้ำ จะไม่เพิ่มประวัติหรือสถิตินาทีเบิ้ล (Idempotency) | Unit / Integration | ผ่าน (Unit) |
| **AC-05** | หากปฏิเสธสิทธิ์ไมโครโฟนหรือไม่พร้อมใช้งาน จะมี Typed Fallback ให้ฝึกต่อได้ | UI / Audio | รอทดสอบ |
| **AC-06** | ฟีเจอร์ฝึกหลักทำงานโดยไม่เรียก AI API ภายนอก; feedback ระบุชัดว่าเป็นตัวอย่าง Self-check | Integration | รอทดสอบ |
| **AC-07** | หน้า Progress หากยังไม่มีประวัติ จะแสดง Empty State ที่สุภาพ ไม่แสดงตัวเลขปลอม | UI State | รอทดสอบ |
| **AC-08** | เมื่อกดทบทวนวลี (Remembered / Again) ค่า `dueAt` และ `stage` เปลี่ยนตามสูตร | Unit Test | ผ่าน (Unit) |
| **AC-09** | Export ข้อมูลเป็น JSON แล้ว Import กลับเข้ามา ข้อมูลยังคงความสมบูรณ์ครบถ้วน | Unit / Integration | รอทดสอบ |
| **AC-10** | การ Import ไฟล์ JSON ที่ผิดรูปแบบ (Invalid) จะถูกปฏิเสธก่อนเปิด transaction | Unit / Integration | ผ่าน (Unit) |
| **AC-11** | Layout แสดงผลถูกต้องที่ความกว้าง 375px (Mobile), 768px (Tablet), และ 1440px (Desktop) | Visual / Responsive | รอทดสอบ |
| **AC-12** | รองรับการใช้งานผ่านคีย์บอร์ด (Tab/Enter/Space/Esc) และคืน Focus หลังปิด Modal | Accessibility | รอทดสอบ |
| **AC-13** | ข้อความคำแปลภาษาไทยและภาษาอังกฤษมีความยาวเหมาะสม ไม่ล้นขอบการ์ดในทุกขนาดจอ | Responsive / CSS | รอทดสอบ |
| **AC-14** | ตัวจับเวลา Active Duration จะหยุดนับอัตโนมัติเมื่อผู้ใช้ซ่อนแท็บเบราว์เซอร์ | Unit / Integration | ผ่าน (Unit) |
| **AC-15** | คำสั่ง `npm test` (Unit Tests) และ `npm run build` (TypeScript check) ผ่าน 100% | CI / Automated | ผ่าน (Vitest + Build) |
| **AC-16** | ผู้ใช้เปลี่ยนเป้าหมายและระดับความมั่นใจใน Settings แล้วค่าอยู่หลัง refresh | E2E | ผ่าน (Playwright) |

---

## 🧪 Detailed Test Scenarios

### 1. Spaced Repetition Algorithm (Unit Test)
- **Test Case 1.1**: New Phrase เริ่มต้นที่ `stage = 0` และ `dueAt <= now`
- **Test Case 1.2**: กด `remembered` ที่ stage 0 -> ได้ `stage 1`, `dueAt = now + 1 day`
- **Test Case 1.3**: กด `remembered` ที่ stage 1 -> ได้ `stage 2`, `dueAt = now + 3 days`
- **Test Case 1.4**: กด `remembered` ที่ stage 2 -> ได้ `stage 3`, `dueAt = now + 7 days`
- **Test Case 1.5**: กด `remembered` ที่ stage 3 -> ได้ `stage 4`, `dueAt = now + 14 days`
- **Test Case 1.6**: กด `remembered` ที่ stage 4 หรือ 5 -> ได้ `stage 5`, `dueAt = now + 30 days`
- **Test Case 1.7**: กด `again` ที่ stage ใดๆ -> รีเซ็ตเป็น `stage 0`, `dueAt = now + 10 minutes`

### 2. Time Tracker & Tab Visibility (Unit & Integration)
- **Test Case 2.1**: เมื่อแท็บอยู่ในสถานะ `visible` เวลาสะสมเพิ่มขึ้นตามวินาทีจริง
- **Test Case 2.2**: เมื่อเกิดอีเวนต์ `visibilitychange` เป็น `hidden` ตัวจับเวลาต้องไม่เพิ่มค่าเวลา
- **Test Case 2.3**: เมื่อแท็บกลับมาเป็น `visible` ตัวจับเวลาเริ่มนับต่อจากค่าเดิมอย่างถูกต้อง

### 3. Data Storage & Migration (Integration Test)
- **Test Case 3.1**: บันทึกข้อมูลลงใน IndexedDB ผ่าน Repository แล้วดึงกลับมาได้ตรงกัน
- **Test Case 3.2**: Export ข้อมูลออกมาเป็น JSON string ตรวจสอบว่ามีคีย์ `schemaVersion`, `profile`, `sessions`, `phrases`, `reviewEvents` ครบถ้วน
- **Test Case 3.3**: Validate JSON นำเข้า — หากโครงสร้างขาดคีย์สำคัญ ให้ Reject และแจ้งเตือน Error
- **Test Case 3.4**: การ Reset ข้อมูล เคลียร์ตารางใน IndexedDB แล้วสร้างค่าเริ่มต้นใหม่อย่างปลอดภัย

### 4. Audio Fallback & State Testing (UI Interaction)
- **Test Case 4.1**: เมื่อเบราว์เซอร์ไม่มีไมโครโฟนหรือผู้ใช้กดยกเลิกสิทธิ์ แสดงกล่องข้อความและสลับเป็น Typed input ทันที
- **Test Case 4.2**: เมื่อผู้ใช้อัดเสียงและกดหยุด เสียงเล่นซ้ำได้ และเคลียร์ URL blob เมื่อออกจากหน้า
- **Test Case 4.3**: ตรวจสอบปุ่มปรับความเร็วเสียง 0.75x และ 1.0x

### 5. Browser Smoke Tests (Playwright)
- เปิด `/#/onboarding` แบบ legacy แล้วต้องเข้า Today โดยไม่แสดงหน้าตั้งค่า
- เลือกโหมดฝึก 15 นาที รีเฟรชหน้า แล้วค่าโหมดยังคงอยู่
- เปลี่ยนเป้าหมายและระดับความมั่นใจใน Settings รีเฟรชแล้วค่าต้องคงอยู่

---

## 📋 คำแนะนำการรันการทดสอบ

```bash
# รัน Unit Tests ทั้งหมด
npm test

# ติดตั้ง Chromium ครั้งแรกและรัน Browser Smoke Tests
npx playwright install chromium
npm run test:e2e

# รัน Type check และ Build ทดสอบ
npm run build
```

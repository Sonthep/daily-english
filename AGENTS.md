# AGENTS.md — Working Rules for AI Agents

เอกสารนี้ระบุกฎเหล็ก ข้อพึงปฏิบัติ และมาตรฐานการทำงานสำหรับ AI Agent และนักพัฒนาที่เข้ามารับช่วงต่อในการดูแลหรือพัฒนาโปรเจกต์ **Daily English**

---

## 🛡️ กฎเหล็ก (Core Inviolable Principles)

1. **อ่านเอกสารก่อนเริ่มแก้ไขโค้ด**:
   - ให้อ่าน [docs/PRD.md](docs/PRD.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) และ [docs/DATA-MODEL.md](docs/DATA-MODEL.md) ให้เข้าใจขอบเขตก่อนทุกครั้ง
2. **ห้ามสร้างข้อมูลเท็จ (No Fake Data / No Hallucinated Metrics)**:
   - ห้ามแสดงคะแนน Streak ปลอม, Leaderboard ปลอม, หรือยอดผู้ใช้จำลอง
   - ห้ามเคลมระดับมาตรฐาน เช่น "CEFR B2" โดยไม่มีการวัดผลมาตรฐานที่ถูกต้อง
   - หากผู้ใช้ยังไม่มีข้อมูลการฝึก (เช่น หน้า Progress หรือ Phrases) ให้แสดง Empty State ที่สุภาพ ไม่สร้างกราฟหรือสถิติขึ้นมาเอง
3. **ห้ามแอบอ้างผลตรวจ AI ใน Phase 1**:
   - ระบบในขั้นตอน Use it ต้องติดป้ายอย่างชัดเจนว่า "ตัวอย่างแนวทางการตอบ (Example)" หรือ "Self-check"
   - ห้ามสร้างระบบจำลองที่ตอบรับประโยคผู้ใช้ว่าเป็นผลตรวจ grammar จริงจาก AI หากยังไม่ได้เชื่อมต่อ Provider ที่แท้จริง
4. **ความปลอดภัยและค่าใช้จ่าย (Zero Secret & No Unauthorized Services)**:
   - ห้าม hardcode API keys หรือความลับใดๆ ลงใน client-side code, Git history หรือ `.env.example`
   - ห้ามลงทะเบียนหรือผูกบัตรเครดิตกับบริการ Cloud/AI ภายนอกโดยไม่ได้รับความยินยอมอย่างชัดเจนจากผู้ใช้
   - ห้าม deploy โค้ดขึ้น public server โดยไม่ได้รับคำสั่ง
5. **ความซื่อสัตย์เรื่องการทดสอบ (Verification Honesty)**:
   - ห้ามรายงานว่า Unit tests หรือ Build ผ่าน หากยังไม่ได้รันคำสั่งจริงใน Terminal
   - หากมีข้อผิดพลาดหรือติดขัด ให้รายงานสาเหตุและระบุสิ่งที่ยังใช้งานได้ตามความเป็นจริง

---

## 🏗️ แนวทางการพัฒนาโค้ด (Coding & Architecture Standards)

1. **Modularity & Loose Coupling**:
   - โค้ดใน UI (components/features) ห้ามเรียกต่อ IndexedDB โดยตรง ให้เรียกผ่าน Repository interfaces ใน `lib/storage/`
   - ฟังก์ชัน AI หรือ Tutor ให้เรียกผ่าน `ITutorProvider` ใน `lib/ai/` เพื่อให้สามารถสลับระหว่าง `ExampleTutorProvider` (Phase 1) และ `RemoteTutorProvider` (Phase 2) ได้ง่าย
2. **Design Tokens First**:
   - ทุก Component ต้องใช้สีและ Spacing จาก CSS Variables ใน `src/index.css` เท่านั้น (เช่น `var(--color-primary)`, `var(--space-md)`)
   - รักษารูปลักษณ์และอารมณ์: Minimal, Warm, Mature, Editorial
   - ทดสอบ Contrast เสมอ และรองรับ Accessibility (Touch target >= 44px, Focus outline, prefers-reduced-motion)
3. **Spaced Repetition Integrity**:
   - รักษากฎการคำนวณ Due Date ของคลังคำศัพท์:
     - Stage 0 -> 1 วัน
     - Stage 1 -> 3 วัน
     - Stage 2 -> 7 วัน
     - Stage 3 -> 14 วัน
     - Stage 4, 5+ -> 30 วัน
     - "Again / ยังจำไม่ได้" -> Stage 0 และนัดทบทวนใน 10 นาที
4. **Time Tracking & Visibility**:
   - จับเวลาการเรียนรู้เฉพาะช่วงเวลาที่แท็บของเบราว์เซอร์เปิดใช้งานอยู่ (ตรวจจับผ่าน `document.visibilityState`) หากผู้ใช้สลับแท็บหรือย่อหน้าจอ ต้องหยุดการนับเวลาทันที
5. **Idempotency**:
   - การบันทึก Session จบบทเรียน (`completeSession`) ต้องมี Idempotency ป้องกันไม่ให้การกดปุ่มซ้ำหรือการ refresh หน้า Summary ไปเพิ่มประวัติและจำนวนนาทีฝึกเบิ้ล

---

## 📋 ขั้นตอนการส่งมอบงานในแต่ละรอบ

เมื่อเสร็จสิ้นงานแต่ละครั้ง Agent ต้อง:
1. อัปเดตสถานะใน [docs/TASKS.md](docs/TASKS.md) ตามความเป็นจริง
2. รันคำสั่ง `npm test` และ `npm run build` เพื่อพิสูจน์ความถูกต้อง
3. สรุปผลการเปลี่ยนแปลง:
   - สิ่งที่ทำสำเร็จ (What was delivered)
   - สิ่งที่ได้ทำการทดสอบ (Verification performed)
   - สิ่งที่ยังไม่ได้ทำหรือข้อจำกัดในปัจจุบัน (Out of scope / Limitations)
   - วิธีการทดสอบสำหรับผู้ใช้ (How the user can test)

# AI Integration & Tutor Architecture — Daily English

เอกสารนี้ระบุข้อกำหนดด้านความปลอดภัย สถาปัตยกรรม และสัญญาระหว่างส่วนต่อประสาน (Interface Contracts) สำหรับการทำงานของระบบ AI Tutor ทั้งใน **Phase 1 (Example & Self-Check)** และ **Phase 2 (Remote AI ผ่าน Secure Backend)**

---

## 1. ปรัชญาและขอบเขตความรับผิดชอบ (Principles & Boundaries)

1. **Phase 1 ไม่ใช้บริการ AI ภายนอก**:
   - เพื่อความปลอดภัย ความเป็นส่วนตัว และป้องกันค่าใช้จ่ายโดยไม่ตั้งใจ Phase 1 จะทำงานผ่าน `ExampleTutorProvider` ซึ่งให้คำตอบตัวอย่างและเกณฑ์ประเมินตนเอง (Self-check) 100% ภายในเครื่องของผู้ใช้
   - ห้ามใส่ API Key ของ OpenAI, Anthropic, Google Gemini หรือผู้ให้บริการรายใดลงใน Client Code, Frontend Environment หรือ LocalStorage โดยเด็ดขาด
2. **Phase 2 ต้องทำงานผ่าน Secure Backend**:
   - การเชื่อมต่อ AI ใน Phase 2 จะต้องมี Backend Service คั่นกลาง (Backend Proxy) เพื่อ:
     - ปกป้อง Secret API Keys ไม่ให้รั่วไหล
     - จัดการ Authentication และ Access Control
     - ทำ Rate Limiting ป้องกันค่าใช้จ่ายบานปลาย
     - ตรวจสอบความยาวและทำ Sanitization ข้อมูล Input ของผู้ใช้
3. **การป้องกัน Prompt Injection**:
   - คำตอบหรือข้อความที่ผู้ใช้พิมพ์เข้ามาจะถือเป็น **Data (ข้อมูล)** เท่านั้น ไม่ถือเป็น System Prompt หรือคำสั่งชี้นำโมเดล
4. **ความโปร่งใสและไม่หลอกลวง**:
   - ห้ามเคลมว่าการถอดเสียง (Transcription) แปลว่า "ออกเสียงถูกต้อง (Pronunciation Accuracy)"
   - แยกฟังก์ชัน Speech-to-Text, Grammar Checking, และ Pronunciation Coaching ออกจากกันอย่างชัดเจน

---

## 2. โครงสร้างข้อมูลตอบกลับของ AI (Text Feedback Contract)

ไม่ว่าจะมาจาก Example Provider หรือ Remote AI Provider ข้อมูลตอบกลับจะต้องสอดคล้องกับ TypeScript Interface นี้เสมอ:

```typescript
export interface FeedbackCorrection {
  original: string;
  improved: string;
  reasonTh: string;
}

export interface TextFeedbackResponse {
  source: 'example' | 'ai';
  meaningUnderstood: boolean | null;    // null หากเป็น example
  correctedSentence: string | null;     // ประโยคที่ปรับแก้ให้เป็นธรรมชาติขึ้น
  explanationTh: string;                // คำอธิบายภาษาไทยเข้าใจง่าย
  corrections: FeedbackCorrection[];     // รายการจุดปรับแก้ สูงสุดไม่เกิน 2 ข้อ
  suggestedRetry: string | null;        // แนวทางหรือประโยคที่แนะนำให้ผู้ใช้ลองพูด/พิมพ์ใหม่
}
```

---

## 3. สถาปัตยกรรม Provider Abstraction

```typescript
// src/lib/ai/provider.ts

export interface ITutorProvider {
  /**
   * ส่งคำตอบของผู้ใช้เพื่อขอคำแนะนำหรือดูตัวอย่าง
   */
  getFeedback(
    questionEn: string,
    questionTh: string,
    userAnswer: string,
    sampleAnswer: string
  ): Promise<TextFeedbackResponse>;
}
```

### ตัวอย่างการทำงานของ `ExampleTutorProvider` (Phase 1):
```typescript
export class ExampleTutorProvider implements ITutorProvider {
  async getFeedback(
    questionEn: string,
    questionTh: string,
    userAnswer: string,
    sampleAnswer: string
  ): Promise<TextFeedbackResponse> {
    // ส่งคืนตัวอย่างแนวทางการตอบและ Checklist ทบทวนตนเอง
    return {
      source: 'example',
      meaningUnderstood: null,
      correctedSentence: sampleAnswer,
      explanationTh: 'ลองเปรียบเทียบคำตอบของคุณกับตัวอย่างประโยคด้านล่าง โดยสังเกตการเลือกใช้คำและโครงสร้างประโยค',
      corrections: [],
      suggestedRetry: sampleAnswer,
    };
  }
}
```

---

## 4. ข้อกำหนดการจัดการเสียง (Audio & Recording Policies)

### 4.1 Phase 1 (In-Memory Only)
- การบันทึกเสียงในบทเรียนจะถูกเก็บเป็น Blob ในหน่วยความจำ (RAM) ของ Session ปัจจุบันเท่านั้น
- เมื่อผู้ใช้กดหยุดอัด หรือสลับประโยค หรือออกจากหน้าบทเรียน ระบบจะ:
  - สั่งปิดไมโครโฟนทันที (`stream.getTracks().forEach(track => track.stop())`)
  - คืนหน่วยความจำของ URL (`URL.revokeObjectURL(audioUrl)`)
- แสดงคำชี้แจงแก่ผู้ใช้: "ไฟล์เสียงที่อัดจะถูกล้างเมื่อออกจากหน้าบทเรียนหรือรีเฟรช"

### 4.2 Phase 2 (Remote Transcription & Coaching)
- **Explicit Consent**: ก่อนส่งไฟล์เสียงขึ้นเซิร์ฟเวอร์เพื่อประมวลผล ต้องมีหน้าต่างขอความยินยอมอย่างชัดเจนทุกครั้ง
- **No Permanent Retention**: เซิร์ฟเวอร์ต้องประมวลผลเสียงแบบ ephemeral (ทำ transcription แล้วลบไฟล์เสียงทิ้งทันที) เว้นแต่ผู้ใช้จะตั้งค่าเปิดบันทึกด้วยตนเอง
- **Degraded Network Fallback**: หากเน็ตหลุดหรือเซิร์ฟเวอร์ AI ล่าช้าเกิน 5 วินาที ระบบต้องมีปุ่มให้ผู้ใช้เลือก "สลับไปใช้โหมด Self-Check" ได้ทันทีโดยไม่ต้องรอ

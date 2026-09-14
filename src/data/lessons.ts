import { Lesson } from '../types';

export const SEED_LESSONS: Lesson[] = [
  {
    id: 'design-feedback',
    titleTh: 'การรับฟีดแบ็กงานดีไซน์',
    titleEn: 'Design Feedback & Revisions',
    category: 'Design & Marketing',
    objectiveTh: 'สื่อสารเรื่องการปรับแก้ชิ้นงานกับลูกค้าหรือทีมได้อย่างชัดเจนและเป็นมืออาชีพ',
    createdAt: '2026-09-01T00:00:00.000Z',
    sentences: [
      {
        id: 'df-s1',
        en: 'Could you make the logo a little bigger?',
        th: 'ช่วยขยายโลโก้อีกนิดได้ไหม',
      },
      {
        id: 'df-s2',
        en: "I'll send the revised version this afternoon.",
        th: 'ฉันจะส่งฉบับแก้ไขให้บ่ายนี้',
      },
      {
        id: 'df-s3',
        en: "Could you clarify what you'd like me to change?",
        th: 'ช่วยอธิบายเพิ่มเติมได้ไหมว่าอยากให้ฉันแก้ตรงไหน',
      },
    ],
    prompts: [
      {
        id: 'df-p1',
        questionEn: 'What did you design today?',
        questionTh: 'วันนี้คุณได้ออกแบบอะไรบ้าง หรือทำงานส่วนไหนอยู่?',
        sampleAnswer: 'Today I designed a social media banner for a new campaign.',
      },
      {
        id: 'df-p2',
        questionEn: 'How would you ask a colleague to change a background?',
        questionTh: 'คุณจะบอกเพื่อนร่วมทีมอย่างไร ถ้าอยากให้ช่วยเปลี่ยนสีพื้นหลัง?',
        sampleAnswer: 'Could you try using a warmer background color for this slide?',
      },
    ],
    targetPhrases: [
      {
        id: 'tp-df-1',
        en: 'make ... a little bigger',
        th: 'ช่วยขยาย...ให้ใหญ่ขึ้นอีกนิด',
        example: 'Could you make the logo a little bigger on this poster?',
        category: 'Design & Marketing',
      },
      {
        id: 'tp-df-2',
        en: 'revised version',
        th: 'ฉบับแก้ไข / เวอร์ชั่นปรับปรุง',
        example: "I'll send the revised version to you by 3 PM.",
        category: 'Design & Marketing',
      },
      {
        id: 'tp-df-3',
        en: 'clarify what you would like to change',
        th: 'อธิบายเพิ่มเติมว่าต้องการให้ปรับแก้ตรงไหน',
        example: 'Could you clarify what you would like me to adjust?',
        category: 'Design & Marketing',
      },
    ],
  },
  {
    id: 'daily-life',
    titleTh: 'กิจวัตรประจำวันและการพักผ่อน',
    titleEn: 'Daily Routine & Work-Life',
    category: 'Daily Life',
    objectiveTh: 'เล่ากิจวัตรประจำวัน สิ่งที่ทำไปแล้ว และแผนการพักผ่อนกับเพื่อนหรือเพื่อนร่วมงานได้คล่องขึ้น',
    createdAt: '2026-09-02T00:00:00.000Z',
    sentences: [
      {
        id: 'dl-s1',
        en: 'I usually start work at nine.',
        th: 'ปกติฉันเริ่มงานตอนเก้าโมง',
      },
      {
        id: 'dl-s2',
        en: 'I made dinner at home yesterday.',
        th: 'เมื่อวานฉันทำอาหารเย็นที่บ้าน',
      },
      {
        id: 'dl-s3',
        en: "I'm planning to get some rest tonight.",
        th: 'คืนนี้ฉันวางแผนจะพักผ่อน',
      },
    ],
    prompts: [
      {
        id: 'dl-p1',
        questionEn: 'What do you usually do after work?',
        questionTh: 'ปกติหลังเลิกงานคุณชอบทำอะไร?',
        sampleAnswer: 'I usually cook dinner and watch a movie to relax.',
      },
      {
        id: 'dl-p2',
        questionEn: 'What did you do yesterday evening?',
        questionTh: 'เมื่อวานช่วงเย็นคุณทำอะไรไปบ้าง?',
        sampleAnswer: 'Yesterday evening I went for a walk in the park.',
      },
    ],
    targetPhrases: [
      {
        id: 'tp-dl-1',
        en: 'usually start work at ...',
        th: 'ปกติเริ่มงานตอน...',
        example: 'I usually start work at nine in the morning.',
        category: 'Daily Life',
      },
      {
        id: 'tp-dl-2',
        en: 'make dinner at home',
        th: 'ทำอาหารเย็นทานที่บ้าน',
        example: 'We made dinner at home and had pasta.',
        category: 'Daily Life',
      },
      {
        id: 'tp-dl-3',
        en: 'get some rest',
        th: 'พักผ่อนสักหน่อย',
        example: "You've worked hard today, get some rest.",
        category: 'Daily Life',
      },
    ],
  },
  {
    id: 'gaming',
    titleTh: 'การสื่อสารในเกมและการเล่นเป็นทีม',
    titleEn: 'Gaming & Team Communication',
    category: 'Gaming',
    objectiveTh: 'พูดสื่อสาร นัดแนะตำแหน่ง และขอความช่วยเหลือขณะเล่นเกมเป็นทีมได้อย่างรวดเร็ว',
    createdAt: '2026-09-03T00:00:00.000Z',
    sentences: [
      {
        id: 'gm-s1',
        en: 'Where should we go next?',
        th: 'เราควรไปไหนต่อ',
      },
      {
        id: 'gm-s2',
        en: 'I need a moment to recover.',
        th: 'ฉันขอเวลาฟื้นตัวสักครู่',
      },
      {
        id: 'gm-s3',
        en: "Let's stay together.",
        th: 'อยู่ด้วยกันไว้เถอะ',
      },
    ],
    prompts: [
      {
        id: 'gm-p1',
        questionEn: 'How would you ask your teammate for help?',
        questionTh: 'คุณจะขอกำลังเสริมหรือความช่วยเหลือจากเพื่อนร่วมทีมอย่างไร?',
        sampleAnswer: 'I need backup at the main gate right now!',
      },
      {
        id: 'gm-p2',
        questionEn: 'What would you say before moving to another area?',
        questionTh: 'คุณจะบอกเพื่อนร่วมทีมอย่างไรก่อนจะย้ายไปยังจุดถัดไป?',
        sampleAnswer: "I'm heading to the next zone, cover me please.",
      },
    ],
    targetPhrases: [
      {
        id: 'tp-gm-1',
        en: 'Where should we go next?',
        th: 'เราควรไปตรงไหนต่อดี?',
        example: 'The safe zone is shrinking, where should we go next?',
        category: 'Gaming',
      },
      {
        id: 'tp-gm-2',
        en: 'need a moment to recover',
        th: 'ขอเวลาฟื้นพลัง/ฟื้นตัวสักครู่',
        example: 'My health is low, I need a moment to recover.',
        category: 'Gaming',
      },
      {
        id: 'tp-gm-3',
        en: 'stay together',
        th: 'อยู่เกาะกลุ่มกันไว้',
        example: "Don't wander off alone, let's stay together.",
        category: 'Gaming',
      },
    ],
  },
];

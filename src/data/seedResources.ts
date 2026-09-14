import { LearningResource } from '../types';

export const SEED_RESOURCES: LearningResource[] = [
  {
    id: 'jack-ma-english-fluency',
    title: 'Jack Ma: Why Most People Never Speak English Fluently',
    type: 'youtube',
    sourceUrl: 'https://www.youtube.com/watch?v=Ii4EeIIJrIY',
    embedUrl: 'https://www.youtube-nocookie.com/embed/Ii4EeIIJrIY',
    notes:
      'สุนทรพจน์สร้างแรงบันดาลใจจาก Jack Ma เล่าถึงวิธีที่เขาฝึกภาษาอังกฤษด้วยตัวเอง โดยเน้นความสม่ำเสมอและความกล้าพูดโดยไม่กลัวความผิดพลาด',
    createdAt: '2026-09-14T00:00:00.000Z',
    updatedAt: '2026-09-14T00:00:00.000Z',
    reflectionQuestion:
      'What is your main challenge when speaking English, and how will you practice every day?',
    sentences: [
      {
        id: 'jm-1',
        en: 'If you want to speak good English, you have to practice every single day.',
        th: 'ถ้าคุณอยากพูดภาษาอังกฤษได้ดี คุณต้องลงมือฝึกฝนในทุกๆ วัน',
        timestamp: '00:15',
      },
      {
        id: 'jm-2',
        en: 'I was not born with talent; I just never gave up on speaking.',
        th: 'ฉันไม่ได้เกิดมาพร้อมพรสวรรค์ ฉันแค่ไม่เคยยอมแพ้ที่จะพูดออกมา',
        timestamp: '00:48',
      },
      {
        id: 'jm-3',
        en: "Don't be afraid of making mistakes, because mistakes are the best teachers.",
        th: 'อย่ากลัวที่จะทำผิดพลาด เพราะความผิดพลาดคือครูที่ดีที่สุดของเรา',
        timestamp: '01:20',
      },
      {
        id: 'jm-4',
        en: 'You have to open your mouth and dare to speak out loud.',
        th: 'คุณต้องกล้าเปิดปากและกล้าเปล่งเสียงพูดออกมาดังๆ',
        timestamp: '02:05',
      },
    ],
    targetPhrases: [
      {
        id: 'tp-jm-1',
        en: 'practice every single day',
        th: 'ฝึกฝนในทุกๆ วันอย่างสม่ำเสมอ',
        example: 'Consistency is key; practice every single day.',
        category: 'Inspiration',
      },
      {
        id: 'tp-jm-2',
        en: 'never gave up on speaking',
        th: 'ไม่เคยยอมแพ้ในการพูด',
        example: 'Even when it was difficult, I never gave up on speaking.',
        category: 'Inspiration',
      },
      {
        id: 'tp-jm-3',
        en: 'make mistakes',
        th: 'ทำผิดพลาด',
        example: "Don't worry if you make mistakes while learning.",
        category: 'General',
      },
      {
        id: 'tp-jm-4',
        en: 'dare to speak out loud',
        th: 'กล้าพูดออกมาดังๆ / กล้าเปล่งเสียง',
        example: 'To improve your pronunciation, dare to speak out loud.',
        category: 'Speaking',
      },
    ],
  },
];

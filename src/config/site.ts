/** Single place for site-wide constants. vite.config.ts reads REPO_NAME too. */
export const REPO_NAME = 'Nihongo_Notes';
export const SITE_NAME = 'Nihongo Notes';

export type NavItem = {
  to: string;
  label: string;
};

/** Thai labels shown to students, see UI-SPEC.md section 3. */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'คำศัพท์' },
  { to: '/exam', label: 'แนวสอบ' },
  { to: '/quiz', label: 'แบบทดสอบ' },
];

/**
 * Content registry, in the order of the set chips (lowest chapter first). Keys are Markdown file
 * names without extension under content/<collection>/. A test checks that this list matches the
 * files on disk and the `order` in their front matter.
 */
export const VOCAB_FILES = ['ch1-2', 'ch3-4', 'ch5-6'] as const;
export const EXAM_FILES = ['quiz1-ch1-2', 'quiz2-ch3-4'] as const;

/**
 * Where each question pattern of the current quiz points on the vocabulary page: the pattern's
 * position in the exam table, the `?set=` value and the heading number of the group to open.
 */
export const PATTERN_LINKS: readonly { set: string; group: string }[] = [
  { set: '3-4', group: '1.1' }, // Koko wa doko desuka? -> places
  { set: '3-4', group: '2.2' }, // Ima nan ji desuka? -> telling the time
  { set: '3-4', group: '3.1' }, // phone number -> numbers 1-100
  { set: '3-4', group: '3.2' }, // Kore wa ikura desuka? -> hundreds to millions
  { set: '3-4', group: '2.2' }, // Shigoto wa nanji kara nanji made desuka? -> telling the time
];

/** Other student-facing strings, see UI-SPEC.md section 3. */
export const UI_TEXT = {
  loading: 'กำลังโหลด...',
  loadError: 'โหลดเนื้อหาไม่สำเร็จ',
  retry: 'ลองอีกครั้ง',
  notFound: 'ไม่พบหน้านี้',
  backToVocab: 'กลับหน้าคำศัพท์',
  share: 'แชร์เว็บไซต์',
  shareHint: 'สแกน QR หรือคัดลอกลิงก์',
  copyLink: 'คัดลอกลิงก์',
  linkCopied: 'คัดลอกลิงก์แล้ว',
  dismiss: 'ปิด',
  contentsHide: 'ซ่อนสารบัญ',
  contentsShow: 'แสดงสารบัญ',
  chooseVocab: 'เลือกบทที่ต้องการเรียน',
  chooseExam: 'เลือกชุดข้อสอบที่ต้องการดู',
  chooseQuiz: 'เลือกบทที่ต้องการฝึก',
  quizIntro: 'สุ่มโจทย์แบบเดียวกับสอบพูด ตอบออกเสียงเอง แล้วเปิดดูเฉลย',
  quizKinds: 'เลือกแบบโจทย์',
  allKinds: 'สุ่มทุกแบบ',
  reveal: 'ดูเฉลย',
  hideAnswer: 'ดูโจทย์',
  roll: 'สุ่มข้อใหม่',
  known: 'ตอบได้',
  again: 'ยังไม่ได้',
  selfCheck: 'ตอบได้ไหม',
  sayInJapanese: 'พูดเป็นภาษาญี่ปุ่น',
  tapToFlip: 'แตะการ์ดเพื่อดูเฉลย',
  cardNumber: 'ข้อที่',
  orAlso: 'หรือ',
  tip: 'เคล็ดจำ',
  solution: 'เฉลย',
  offlineReady: 'ใช้งานออฟไลน์ได้แล้ว',
  updated: 'อัปเดตเป็นเวอร์ชันล่าสุดแล้ว',
  tableLink: 'ดูตาราง',
  answer: 'ตอบ',
  example: 'ตัวอย่าง',
} as const;

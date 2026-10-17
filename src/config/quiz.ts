/**
 * Flash-card quiz: which card kinds each chapter set has and where their words come from.
 * Question sentences are copied verbatim from the slides (tests/quiz.test.ts checks that each one
 * appears in the content of its set); the words come from the vocabulary file at runtime.
 */

export type QuizKind =
  | 'vocab'
  | 'thing'
  | 'country'
  | 'person'
  | 'magazine'
  | 'kochira'
  | 'place'
  | 'time'
  | 'phone'
  | 'price'
  | 'hours'
  | 'counter'
  | 'month'
  | 'day'
  | 'weekday'
  | 'date'
  | 'verb'
  | 'sentence';

/** Chip label and the short reminder shown with the answer. */
export const QUIZ_KINDS: Record<QuizKind, { label: string; tip?: string }> = {
  vocab: { label: 'คำศัพท์' },
  thing: { label: 'สิ่งของ' },
  country: { label: 'มาจากประเทศ' },
  person: { label: 'อาชีพ' },
  magazine: { label: 'นิตยสารภาษา' },
  kochira: { label: 'ทางนี้คือ' },
  place: { label: 'สถานที่' },
  time: { label: 'บอกเวลา', tip: 'อย่าลืม gozen (ก่อนเที่ยง) หรือ gogo (หลังเที่ยง)' },
  phone: { label: 'เบอร์โทร', tip: 'พูดเลขทีละตัว คั่นกลุ่มด้วย no ไม่ต้องใส่ en' },
  price: { label: 'ราคา', tip: 'อย่าลืม en ก่อน desu' },
  hours: { label: 'เวลาเริ่ม-เลิก', tip: 'อย่าลืม gozen หรือ gogo ทั้งเวลาเริ่มและเวลาเลิก' },
  counter: {
    label: 'ลักษณนาม',
    tip: 'ของทั่วไปใช้ hitotsu..., แผ่น/ตัวใช้ ..-mai, ขวด/ด้าม/แท่งใช้ ..-hon (1, 6, 8, 10 อ่านพิเศษ)',
  },
  month: {
    label: 'เดือน',
    tip: 'เดือน = เลข + gatsu: เมษายน = shi gatsu, กันยายน = ku gatsu, กรกฎาคม = shichi / nana gatsu',
  },
  day: {
    label: 'วันที่',
    tip: 'วันที่ 1-10 ใช้ -ka อ่านพิเศษทั้งหมด, 14 และ 24 = yok-ka, 20 = hatsu-ka, 19 และ 29 = ku-nichi',
  },
  weekday: { label: 'วันในสัปดาห์', tip: 'ชื่อวัน + yōbi: getsu, ka, sui, moku, kin, do, nichi' },
  date: {
    label: 'วัน เดือน ปี',
    tip: 'ญี่ปุ่นเรียง ปี เดือน วันที่ วัน และปีต้องเป็น ค.ศ. (ปีไทย พ.ศ. ลบ 543)',
  },
  verb: {
    label: 'ไป มา กลับ',
    tip: 'รากกริยา (iki, ki, kaeri) + masu / masen / mashita / masendeshita',
  },
  sentence: { label: 'ประโยค' },
};

/** Items of the counter card: the word, its Thai name and the counter it takes (from the slides). */
export type CounterItem = { word: string; thai: string; counter: 'general' | 'mai' | 'hon' };

export type QuizSetConfig = {
  /** Kinds in chip order. */
  kinds: QuizKind[];
  /** `##` part numbers whose vocabulary tables feed the `vocab` kind. */
  vocabParts: string[];
  /** `###` section number that holds the words of a sentence kind. */
  groups: Partial<Record<QuizKind, string>>;
  /** Question sentence per kind, as written in the slides. */
  questions: Partial<Record<QuizKind, string>>;
  /** Subjects of the start-end time question (`hours`), with the Thai word shown on the card. */
  hoursSubjects?: { question: string; thai: string }[];
  /** Things to order with a counter (`counter` kind). */
  counters?: CounterItem[];
};

/** Keyed by vocabulary file key (`ch1-2`), so the set chips of the vocabulary page are reused. */
export const QUIZ_SETS: Record<string, QuizSetConfig> = {
  'ch1-2': {
    kinds: ['vocab', 'thing', 'person', 'country', 'magazine', 'kochira', 'phone'],
    vocabParts: ['1'],
    groups: { thing: '1.5', person: '1.2', country: '1.4', magazine: '1.4', kochira: '1.3' },
    questions: {
      thing: 'Kore wa nan desuka?',
      person: 'Anohito wa dare desuka?',
      country: 'Anohito wa doko kara kimashitaka?',
      magazine: 'Kore wa nan no zasshi desuka?',
      kochira: 'Kochira wa nan desuka?',
      phone: 'Denwa-bangō wa nan-ban desuka?',
    },
  },
  'ch3-4': {
    kinds: ['vocab', 'place', 'time', 'phone', 'price', 'hours'],
    vocabParts: ['1', '2'],
    groups: { place: '1.1' },
    questions: {
      place: 'Koko wa doko desuka?',
      time: 'Ima nan ji desuka?',
      phone: 'Anata no denwa bangō wa nan desuka?',
      price: 'Kore wa ikura desuka?',
    },
    hoursSubjects: [
      { question: 'Shigoto wa nanji kara nanji made desuka?', thai: 'งาน' },
      { question: 'Kaigi wa nan-ji kara nan-ji made desuka?', thai: 'การประชุม' },
    ],
  },
  'ch5-6': {
    kinds: ['vocab', 'counter', 'price', 'month', 'day', 'weekday', 'date', 'verb', 'sentence'],
    vocabParts: ['1'],
    groups: { sentence: '5' },
    questions: {
      price: 'Sono akai T-shatsu wa ikura desu ka.',
      month: 'Nan gatsu desuka?',
      day: 'Nan nichi desuka?',
      weekday: 'Nan yōbi desuka?',
    },
    // Counters as used in the exercises and dialogues of chapter 5
    counters: [
      { word: 'ringo', thai: 'แอปเปิ้ล', counter: 'general' },
      { word: 'kōhī kappu', thai: 'แก้วกาแฟ', counter: 'general' },
      { word: 'shūkurīmu', thai: 'ครีมพัฟ', counter: 'general' },
      { word: 'T-shatsu', thai: 'เสื้อยืด', counter: 'mai' },
      { word: 'taoru', thai: 'ผ้าขนหนู', counter: 'mai' },
      { word: 'hagaki', thai: 'โปสการ์ด', counter: 'mai' },
      { word: 'kasa', thai: 'ร่ม', counter: 'hon' },
      { word: 'bīru', thai: 'เบียร์', counter: 'hon' },
      { word: 'wain', thai: 'ไวน์', counter: 'hon' },
    ],
  },
};

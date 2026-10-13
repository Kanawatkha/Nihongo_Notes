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
  | 'hours';

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
};

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
};

/**
 * Flash-card quiz: for each set, the parts of the exam and the question patterns of each part.
 * A set mirrors one exam guide: its parts and patterns are the ones that are asked in that exam.
 * Question sentences are copied verbatim from the slides (tests/quiz.test.ts checks that each one
 * appears in the content of its set); the words come from the vocabulary files at runtime.
 */

export type QuizKind =
  | 'intro'
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
  | 'origin'
  | 'adjective'
  | 'counter'
  | 'dateAsk'
  | 'birthday'
  | 'today'
  // chapter 5-6 practice cards that are not asked in the exam; kept for later use
  | 'month'
  | 'day'
  | 'weekday'
  | 'date'
  | 'verb'
  | 'sentence';

/** Chip label and the short reminder shown with the answer. */
export const QUIZ_KINDS: Record<QuizKind, { label: string; tip?: string }> = {
  intro: { label: 'แนะนำตัว', tip: 'บทพูดแนะนำตัว 5 บรรทัด ท่องให้ครบตามลำดับ' },
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
  origin: {
    label: 'สิ่งของจากประเทศ',
    tip: 'ชื่อประเทศ + no + คำนาม: Kore wa [ประเทศ] no [คำนาม] desu.',
  },
  adjective: {
    label: 'สี / ขนาด',
    tip: 'คำคุณศัพท์สีหรือขนาดอยู่หน้าคำนาม: Kore wa [สี/ขนาด] [คำนาม] desu.',
  },
  counter: {
    label: 'สั่งของ',
    tip: 'ขึ้นต้นด้วย Sono เสมอ: แผ่น/ตัวใช้ ..-mai, ขวด/ด้าม/แท่งใช้ ..-hon (1, 6, 8, 10 อ่านพิเศษ), ของทั่วไปใช้ hitotsu...',
  },
  dateAsk: {
    label: 'เดือน-วันที่ (จากภาพ)',
    tip: 'เรียงเดือนก่อนวันที่: เมษายน = shi gatsu, กันยายน = ku gatsu, วันที่ 1-10 อ่านแบบ -ka ทั้งหมด',
  },
  birthday: {
    label: 'วันเกิด',
    tip: 'พูดแค่เดือนและวันที่ เรียงเดือนก่อนวันที่ ถ้ายังไม่ได้ตั้งวันเกิด การ์ดใช้วันที่ตัวอย่างแบบสุ่ม',
  },
  today: {
    label: 'วันนี้',
    tip: 'ตอบตามจริง พูดแค่เดือนและวันที่ เปิด "สุ่มวัน" เพื่อฝึกกับวันที่อื่น',
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

export type ThaiWord = { word: string; thai: string };

export type QuizSectionId = 'intro' | 'vocab' | 'answer';

/** One part of the exam, with its points and the question patterns that are asked in it. */
export type QuizSection = {
  id: QuizSectionId;
  label: string;
  points: number;
  kinds: QuizKind[];
  /** How many questions each pattern has in the exam (default 1), for the random mix. */
  kindWeights?: Partial<Record<QuizKind, number>>;
};

export type QuizSetConfig = {
  /** Chip label and `?set=` value. */
  label: string;
  param: string;
  /** Vocabulary files that feed the set, the first one is the default for `groups`. */
  files: string[];
  /** The parts of the exam in order. */
  sections: QuizSection[];
  /** `##` part numbers of the first file whose vocabulary tables feed the `vocab` kind. */
  vocabParts?: string[];
  /** Section number that holds the words of a kind: `1.4`, or `ch1-2:1.4` for another file. */
  groups: Partial<Record<QuizKind, string>>;
  /** Chip label of a kind in this set, when it differs from the default. */
  labels?: Partial<Record<QuizKind, string>>;
  /** Question sentence per kind, as written in the slides. */
  questions: Partial<Record<QuizKind, string>>;
  /** Subjects of the start-end time question (`hours`), with the Thai word shown on the card. */
  hoursSubjects?: { question: string; thai: string }[];
  /** Things to order with a counter (`counter` kind). */
  counters?: CounterItem[];
  /** Things and countries of the `origin` kind. */
  origins?: { items: ThaiWord[]; countries: ThaiWord[] };
  /** Nouns and adjectives of the `adjective` kind. */
  adjectives?: { nouns: ThaiWord[]; adjectives: ThaiWord[] };
  /** The five lines of the self-introduction (`intro` kind), from the exam 1 guide. */
  introLines?: { thai: string; romaji: string }[];
};

/** Every kind a set deals, in chip order. */
export const setKinds = (config: QuizSetConfig): QuizKind[] =>
  config.sections.flatMap((section) => section.kinds);

const PICTURE_COUNTERS: CounterItem[] = [
  { word: 'ringo', thai: 'แอปเปิ้ล', counter: 'general' },
  { word: 'kōhī kappu', thai: 'แก้วกาแฟ', counter: 'general' },
  { word: 'shūkurīmu', thai: 'ครีมพัฟ', counter: 'general' },
  { word: 'T-shatsu', thai: 'เสื้อยืด', counter: 'mai' },
  { word: 'taoru', thai: 'ผ้าขนหนู', counter: 'mai' },
  { word: 'hagaki', thai: 'โปสการ์ด', counter: 'mai' },
  { word: 'kasa', thai: 'ร่ม', counter: 'hon' },
  { word: 'bīru', thai: 'เบียร์', counter: 'hon' },
  { word: 'wain', thai: 'ไวน์', counter: 'hon' },
];

const ADJECTIVES = {
  nouns: [
    { word: 'tokei', thai: 'นาฬิกา' },
    { word: 'kasa', thai: 'ร่ม' },
    { word: 'enpitsu', thai: 'ดินสอ' },
    { word: 'T-shatsu', thai: 'เสื้อยืด' },
    { word: 'kaban', thai: 'กระเป๋า' },
    { word: 'kamera', thai: 'กล้องถ่ายรูป' },
    { word: 'ringo', thai: 'แอปเปิ้ล' },
    { word: 'taoru', thai: 'ผ้าขนหนู' },
  ],
  adjectives: [
    { word: 'akai', thai: 'สีแดง' },
    { word: 'aoi', thai: 'สีฟ้า' },
    { word: 'kuroi', thai: 'สีดำ' },
    { word: 'shiroi', thai: 'สีขาว' },
    { word: 'kiiroi', thai: 'สีเหลือง' },
    { word: 'ōkii', thai: 'ใหญ่' },
    { word: 'chiisai', thai: 'เล็ก' },
  ],
};

const INTRO_LINES = [
  { thai: 'ยินดีที่ได้รู้จัก', romaji: 'Hajimemashite.' },
  { thai: 'ฉันชื่อ...', romaji: 'Watashi wa (ชื่อ) desu.' },
  { thai: 'เป็นนักศึกษาปัญญาภิวัฒน์', romaji: 'Panyapiwatto no gakusei desu.' },
  {
    thai: 'งานอดิเรกคือ การ์ตูนญี่ปุ่น / การอ่านหนังสือ / ภาพยนตร์',
    romaji: 'Shumi wa manga / dokusho / eiga desu.',
  },
  { thai: 'ขอฝากเนื้อฝากตัวด้วย', romaji: 'Dōzo yoroshiku o-negai itashimasu.' },
];

/**
 * Keyed by set. Exam 1 (บท 1-2): self-introduction 5, words 5, picture questions 5. Exam 2 (บท
 * 3-4): words 5, questions 10. Exam 3 (บท 5-6): words 5, questions 10. Final (บท 1-6): speaking
 * 15, from the patterns of exams 1-3 named in the final exam slides.
 */
export const QUIZ_SETS: Record<string, QuizSetConfig> = {
  'ch1-2': {
    label: 'บท 1-2',
    param: '1-2',
    files: ['ch1-2'],
    sections: [
      { id: 'intro', label: 'แนะนำตัว', points: 5, kinds: ['intro'] },
      { id: 'vocab', label: 'คำศัพท์', points: 5, kinds: ['vocab'] },
      {
        id: 'answer',
        label: 'ตอบคำถามจากรูป',
        points: 5,
        kinds: ['thing', 'country', 'person', 'magazine', 'kochira'],
      },
    ],
    vocabParts: ['1'],
    groups: { thing: '1.5', person: '1.2', country: '1.4', magazine: '1.4', kochira: '1.3' },
    questions: {
      thing: 'Kore wa nan desuka?',
      person: 'Anohito wa dare desuka?',
      country: 'Anohito wa doko kara kimashitaka?',
      magazine: 'Kore wa nan no zasshi desuka?',
      kochira: 'Kochira wa nan desuka?',
    },
    introLines: INTRO_LINES,
  },
  'ch3-4': {
    label: 'บท 3-4',
    param: '3-4',
    files: ['ch3-4'],
    sections: [
      { id: 'vocab', label: 'คำศัพท์', points: 5, kinds: ['vocab'] },
      {
        id: 'answer',
        label: 'ตอบคำถาม',
        points: 10,
        kinds: ['place', 'time', 'phone', 'price', 'hours'],
      },
    ],
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
    label: 'บท 5-6',
    param: '5-6',
    files: ['ch5-6'],
    sections: [
      { id: 'vocab', label: 'คำศัพท์', points: 5, kinds: ['vocab'] },
      {
        id: 'answer',
        label: 'ตอบคำถาม',
        points: 10,
        kinds: ['origin', 'adjective', 'counter', 'dateAsk', 'birthday', 'today'],
        kindWeights: { origin: 2, adjective: 2, counter: 2, dateAsk: 2, birthday: 1, today: 1 },
      },
    ],
    vocabParts: ['1'],
    // Not asked in the exam, but kept so the practice cards of chapter 5-6 can be switched back on
    groups: { sentence: '5' },
    questions: {
      adjective: 'Kore wa nan desuka?',
      counter: 'Irasshaimase!',
      dateAsk: 'Kore wa nan gatsu nan nichi desuka?',
      birthday: 'O tanjōbi wa nan gatsu nan nichi desuka?',
      today: 'Kyō wa nan gatsu nan nichi desuka?',
      month: 'Nan gatsu desuka?',
      day: 'Nan nichi desuka?',
      weekday: 'Nan yōbi desuka?',
    },
    // Items, countries and counters as used in the exam slides, exercises and dialogues of ch. 5
    origins: {
      items: [
        { word: 'tokei', thai: 'นาฬิกา' },
        { word: 'pasokon', thai: 'คอมพิวเตอร์' },
        { word: 'dejikame', thai: 'กล้องดิจิทัล' },
        { word: 'bīru', thai: 'เบียร์' },
        { word: 'wain', thai: 'ไวน์' },
        { word: 'kōhī kappu', thai: 'แก้วกาแฟ' },
        { word: 'taoru', thai: 'ผ้าขนหนู' },
      ],
      countries: [
        { word: 'Suisu', thai: 'สวิตเซอร์แลนด์' },
        { word: 'Indo', thai: 'อินเดีย' },
        { word: 'Igirisu', thai: 'อังกฤษ' },
        { word: 'Doitsu', thai: 'เยอรมนี' },
        { word: 'Roshia', thai: 'รัสเซีย' },
        { word: 'Itaria', thai: 'อิตาลี' },
        { word: 'Kankoku', thai: 'เกาหลี' },
        { word: 'Furansu', thai: 'ฝรั่งเศส' },
      ],
    },
    adjectives: ADJECTIVES,
    counters: PICTURE_COUNTERS,
  },
  final: {
    label: 'ปลายภาค (บท 1-6)',
    param: '1-6',
    files: ['ch1-2', 'ch3-4', 'ch5-6'],
    sections: [
      {
        id: 'answer',
        label: 'สอบพูด',
        points: 15,
        kinds: [
          'country',
          'person',
          'magazine',
          'place',
          'time',
          'phone',
          'price',
          'adjective',
          'counter',
          'today',
        ],
      },
    ],
    groups: {
      person: 'ch1-2:1.2',
      country: 'ch1-2:1.4',
      magazine: 'ch1-2:1.4',
      place: 'ch3-4:1.1',
    },
    labels: {
      country: 'ครั้งที่ 1 · ประเทศ',
      person: 'ครั้งที่ 1 · อาชีพ',
      magazine: 'ครั้งที่ 1 · นิตยสาร',
      place: 'ครั้งที่ 2 · สถานที่',
      time: 'ครั้งที่ 2 · เวลา',
      phone: 'ครั้งที่ 2 · เบอร์โทร',
      price: 'ครั้งที่ 2 · ราคา',
      adjective: 'ครั้งที่ 3 · สี / ขนาด',
      counter: 'ครั้งที่ 3 · สั่งของ',
      today: 'ครั้งที่ 3 · วันนี้',
    },
    questions: {
      person: 'Anohito wa dare desuka?',
      country: 'Anohito wa doko kara kimashitaka?',
      magazine: 'Kore wa nan no zasshi desuka?',
      place: 'Koko wa doko desuka?',
      time: 'Ima nan ji desuka?',
      phone: 'Anata no denwa bangō wa nan desuka?',
      price: 'Kore wa ikura desuka?',
      adjective: 'Kore wa nan desuka?',
      counter: 'Irasshaimase!',
      today: 'Kyō wa nan gatsu nan nichi desuka?',
    },
    adjectives: ADJECTIVES,
    counters: PICTURE_COUNTERS,
  },
};

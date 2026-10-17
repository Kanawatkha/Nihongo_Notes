# CONTENT-SCHEMA

Rules for turning the Markdown in `content/` into typed data. This is the contract between the content and `scripts/build-content`. Based on the two study files written on 13 Oct 2026 (`ch1-2-vocab.md`, `ch3-4-vocab.md` at the course root).

## 1. Source files

The two study files were split by page on 13 Oct 2026 (files now in `content/`). Text is moved, never rewritten. The original two files stay at the course root outside the repository.

| Collection | File | Taken from | Page |
|---|---|---|---|
| `vocab` | `ch3-4.md` | `ch3-4-vocab.md`, re-grouped by topic on 13 Oct 2026 (parts `1.` words, `2.` time, `3.` numbers and money, `4.` sentences and dialogues; chapters 3 and 4 are merged) | Vocabulary, set "บท 3-4" |
| `vocab` | `ch5-6.md` | `บทที่ 5 การซื้อของ 2` and `บทที่ 6 การยืนยันตารางงาน` slides (PDF), merged by topic on 17 Oct 2026: parts `1.` words, `2.` counters, `3.` dates, `4.` going, coming, returning, `5.` sentences and dialogues. The slides have no Thai meanings for the picture words; the meanings were taken from the pictures and the Thai notes and confirmed by the user | Vocabulary, set "บท 5-6" |
| `vocab` | `ch1-2.md` | `ch1-2-vocab.md`, sections 1 to 3 except `2.7` | Vocabulary, set "บท 1-2" |
| `exam` | `quiz2-ch3-4.md` | `ch3-4-vocab.md`, section 0 and "ฝึกจากตัวอย่างในแนวข้อสอบ" | Exam guide, set "สอบครั้งที่ 2 (บท 3-4)" |
| `exam` | `quiz1-ch1-2.md` | `ch1-2-vocab.md`, section 0 (self-introduction) and `2.7` | Exam guide, set "สอบครั้งที่ 1 (บท 1-2)" |

Heading levels are demoted by one where needed so every file has exactly one `#` title (the current `ch3-4-vocab.md` has two `#` chapter headings; they become `##`).

## 2. Front matter

Optional, at the very top, `key: value` lines between `---` fences. No nesting, no lists.

```
---
label: บท 3-4
order: 2
facts: พุธ 14 ต.ค. 2569 · 15 คะแนน · คนละ 3 นาที · ไม่มีสอบซ่อม
---
```

| Key | Used by | Meaning |
|---|---|---|
| `label` | set switch, exam page | Short label shown on chips (required) |
| `order` | set switch | Chip order, lowest first, unique within a collection (required). No set is open by default; the visitor chooses one |
| `facts` | exam hero (exam files only) | One line of exam facts shown under the exam title |

Unknown keys are build errors.

## 3. Markdown constructs the parser supports

| Construct | Markdown form | Notes |
|---|---|---|
| Title | `# Title` | Exactly one per file, first content line |
| Headings | `##`, `###`, `####` | Build the tree. Numbered headings (`## 3.3 ...`) keep their number |
| Paragraph | plain lines | Thai and romaji, inline formatting |
| Strong | `**...**` | In a vocab or grid cell: marks an irregular reading (section 4) |
| Emphasis | `*...*` | |
| Inline code | `` `...` `` | Sentence patterns such as `Koko wa [สถานที่] desu.` |
| Unordered / ordered list | `- item`, `1. item` | Single level |
| Dialogue | a paragraph that is only `**title**`, followed by a list whose every item is `Speaker: line` | Becomes a `dialogue` block |
| Pipe table | header, alignment row, body | Classified in section 4 |
| Blockquote | `> text` | A memory tip callout. Consecutive lines join into one tip |
| Horizontal rule | `---` | Separator, ignored for structure |
| Escapes | `\*`, `\|` | Un-escaped in output |

Anything else is a **parse error** with file and line. Extend this table and the parser instead of bending the content.

## 4. Table classification

Checked in this order; the first match wins.

| Kind | Rule | Example in content |
|---|---|---|
| `vocab` | Exactly 2 columns, header `โรมาจิ \| ความหมาย` | Most word lists |
| `pairs` | Exactly 5 columns where the middle column (header and all cells) is empty; it splits the table into two halves, each `readings`-shaped (second header `โรมาจิ`). A half may have fewer rows: only **trailing** empty rows are dropped, an empty cell before the last row is a build error | Minutes table (2.2), yen table (3.5) |
| `readings` | Exactly 2 columns, the second header is `โรมาจิ` (a label and how to read it) | `ตัวเลข \| โรมาจิ` tables in 3.2 and 3.4 |
| `grid` | Exactly one body row, and every header cell is a number-like label (digits, commas, dots, `/`, optional `น.`) | 1-10, 11-19, hours, hundreds, thousands |
| `table` | Anything else | Ko-So-A table, score table, question patterns, worked examples |

Cell rules:
- A `vocab` table's header is fixed (`โรมาจิ | ความหมาย`) and is not stored in the data; the round-trip check accounts for it.
- If the whole romaji (or reading) cell is `**bold**`, the entry is `irregular: true` and the bold markers are not kept as text. This applies to `vocab`, `readings`, `pairs` and `grid`.
- Inside cells, `A = B` (for example `konpyūtā = pasokon`) stays as text; the UI may style the `=` as a separator.
- A few 2-column word tables use another first header (for example `คำ \| ความหมาย` in ch1-2 section 2.8). Normalizing such headers to `โรมาจิ \| ความหมาย` is proposed in Phase 2 and needs the user's approval.

## 5. Output data model (TypeScript)

Defined in `src/content/types.ts` and shared with the scripts.

```ts
type Inline =
  | { t: 'text'; v: string }
  | { t: 'strong'; c: Inline[] }
  | { t: 'em'; c: Inline[] }
  | { t: 'code'; v: string };

type VocabEntry = { romaji: Inline[]; meaning: Inline[]; irregular: boolean };
type Reading = { label: Inline[]; reading: Inline[]; irregular: boolean };
type Readings = { head: [Inline[], Inline[]]; rows: Reading[] };

type Block =
  | { t: 'p'; c: Inline[] }
  | { t: 'list'; ordered: boolean; items: Inline[][] }
  | { t: 'vocab'; entries: VocabEntry[] }
  | ({ t: 'readings' } & Readings)
  | { t: 'pairs'; halves: [Readings, Readings] }
  | { t: 'grid'; cells: Reading[] }
  | { t: 'table'; align: ('n' | 'l' | 'c' | 'r')[]; head: Inline[][]; rows: Inline[][][] }
  | { t: 'tip'; c: Inline[][] }
  | { t: 'dialogue'; title: Inline[]; lines: { speaker: string; text: Inline[] }[] };

type ContentNode = {
  id: string;            // "vocab/ch3-4/1.1", stable
  level: 2 | 3 | 4;
  number?: string;       // "1.1" when numbered
  title: Inline[];
  blocks: Block[];       // blocks before the first child heading
  children: ContentNode[];
  wordCount: number;     // vocab entries in this node and below (readings, pairs and grids are counted separately as readingCount)
  readingCount: number;
  source: { file: string; line: number };
};

type ContentFile = {
  collection: 'vocab' | 'exam';
  key: string;           // "ch3-4"
  meta: { label?: string; order?: number; facts?: string };
  title: Inline[];
  intro: Block[];        // blocks between the # title and the first ##
  nodes: ContentNode[];
};
```

## 6. Tree rules

1. `#` is the file title.
2. Each `##`, `###`, `####` becomes a node under the nearest higher heading. Skipping a level (for example `##` straight to `####`) is a build error.
3. Blocks belong to the nearest heading above them.
4. A heading carries a number only when it starts with `N.` or `N.N[.N]` followed by a space (`3.1 Title`, `1. Title`); `5 รูปแบบ` has no number. The number is kept as written in `number`; the id strips a trailing dot. Ids use the heading number when present (`vocab/ch3-4/2.2`), otherwise the position (`vocab/ch3-4/h2-2.h3-1`). Ids are unique per file; duplicates fail the build.
5. Order is source order.

## 7. Validation (all fail the build)

1. Every file parses; unknown constructs are errors.
2. **No kana or kanji anywhere** (Unicode ranges Hiragana, Katakana, CJK Unified Ideographs, Halfwidth and Fullwidth Forms).
3. Every `vocab` romaji cell contains at least one Latin letter. Thai is allowed in romaji cells only as a placeholder (for example `chōdo + เวลา`).
4. Macrons use precomposed characters (`ā ī ū ē ō`), not a letter plus a combining mark.
5. Node ids are unique.
6. Front matter keys are known; every file has a `label` and an `order`, orders are unique within a collection, and the registry in `config/site.ts` lists the files in `order`.
7. Parser limits (errors with line number): HTML, fenced code, links and images, indented lines, `+`/`*` list markers, `N)` markers, setext headings, trailing double space, headings deeper than `####`, table rows with the wrong number of cells.
8. Round trip: data converted back to normalized text equals the normalized Markdown (see `TESTING.md`).

Warnings (in `report.txt`, do not fail): the same romaji appearing twice in one file with different meanings.

## 8. Generated output

```
src/content/generated/
  manifest.json          # files, labels, order, heading index, word counts
  vocab/<key>.json       # ContentFile
  exam/<key>.json
  report.txt             # counts per file and section, warnings
```

Git-ignored. Regenerate with `npm run content`. The word counts in the report are reviewed by the user against the Markdown in Phase 2.

## 9. Author rules

- One `#` title per file. Number parts as `## 1. ...` and sections as `### 1.1 ...`. Group vocabulary by topic, not by lecturer chapter.
- Word lists are 2-column tables with the header `โรมาจิ | ความหมาย`.
- Mark irregular readings by making the whole romaji cell bold.
- Memory tips start with `>`.
- Never add kana, kanji or images.
- Never change a reading or meaning without the user's confirmation.
- The quiz (`src/config/quiz.ts`) finds its words by section number (`1.1` places, `1.5` things...). Renumbering a section means updating `QUIZ_SETS`; `tests/quiz.test.ts` fails if a kind loses its words or a question sentence no longer appears in the slides.

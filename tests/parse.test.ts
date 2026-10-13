// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { ContentError } from '../scripts/build-content/errors.ts';
import { convertSource } from '../scripts/build-content/index.ts';
import { parseFrontMatter } from '../scripts/build-content/frontmatter.ts';
import { parseInline, scanMarkdown, textOf } from '../scripts/build-content/parse.ts';

const FILE = 'test.md';

/** Wraps a body in a valid file: title plus one `##` section. */
function convert(body: string, collection: 'vocab' | 'exam' = 'vocab') {
  return convertSource(collection, 'sample', `# Title\n\n## Section\n\n${body}\n`, FILE);
}

function firstBlock(body: string) {
  const content = convert(body);
  const block = content.nodes[0]?.blocks[0];
  if (!block) throw new Error('no block');
  return block;
}

describe('inline parser', () => {
  it('parses strong, emphasis, code and escapes', () => {
    const inlines = parseInline('a **b** *c* `d` \\* e', FILE, 1);
    expect(inlines).toEqual([
      { t: 'text', v: 'a ' },
      { t: 'strong', c: [{ t: 'text', v: 'b' }] },
      { t: 'text', v: ' ' },
      { t: 'em', c: [{ t: 'text', v: 'c' }] },
      { t: 'text', v: ' ' },
      { t: 'code', v: 'd' },
      { t: 'text', v: ' * e' },
    ]);
    expect(textOf(inlines)).toBe('a b c d * e');
  });

  it('rejects unclosed markers', () => {
    expect(() => parseInline('a **b', FILE, 3)).toThrow(ContentError);
    expect(() => parseInline('a *b', FILE, 3)).toThrow(ContentError);
    expect(() => parseInline('a `b', FILE, 3)).toThrow(ContentError);
  });
});

describe('front matter', () => {
  it('reads known keys', () => {
    const result = parseFrontMatter('---\nlabel: บท 3-4\norder: 2\nfacts: a · b\n---\n# T\n', FILE);
    expect(result.meta).toEqual({ label: 'บท 3-4', order: 2, facts: 'a · b' });
    expect(result.bodyStartLine).toBe(6);
  });

  it('rejects unknown keys and bad values', () => {
    expect(() => parseFrontMatter('---\nfoo: 1\n---\n', FILE)).toThrow(/unknown front matter key/);
    expect(() => parseFrontMatter('---\norder: x\n---\n', FILE)).toThrow(/positive integer/);
    expect(() => parseFrontMatter('---\narchived: true\n---\n', FILE)).toThrow(
      /unknown front matter key/,
    );
    expect(() => parseFrontMatter('---\nlabel: a\n', FILE)).toThrow(/not closed/);
  });
});

describe('scanner', () => {
  it('rejects unsupported constructs with a line number', () => {
    expect(() => scanMarkdown('# T\n<div>x</div>\n', FILE, 1)).toThrow(/test\.md:2/);
    expect(() => scanMarkdown('# T\n```\ncode\n```\n', FILE, 1)).toThrow(/fenced code/);
    expect(() => scanMarkdown('# T\n[a](b)\n', FILE, 1)).toThrow(/image or link/);
    expect(() => scanMarkdown('# T\n##### deep\n', FILE, 1)).toThrow(/deeper/);
    expect(() => scanMarkdown('# T\n| a | b |\n| 1 | 2 |\n', FILE, 1)).toThrow(/alignment/);
  });
});

describe('table classification', () => {
  it('detects a vocab table and marks irregular readings', () => {
    const block = firstBlock(
      '| โรมาจิ | ความหมาย |\n| :-- | :-- |\n| **yo-ji** | สี่โมง |\n| go-ji | ห้าโมง |',
    );
    expect(block.t).toBe('vocab');
    if (block.t !== 'vocab') return;
    expect(block.entries).toHaveLength(2);
    expect(block.entries[0]?.irregular).toBe(true);
    expect(textOf(block.entries[0]?.romaji ?? [])).toBe('yo-ji');
    expect(block.entries[1]?.irregular).toBe(false);
  });

  it('detects a readings table', () => {
    const block = firstBlock(
      '| ตัวเลข | โรมาจิ |\n| :-- | :-- |\n| 300 | **san byaku** |\n| 400 | yon hyaku |',
    );
    expect(block.t).toBe('readings');
    if (block.t !== 'readings') return;
    expect(block.rows[0]?.irregular).toBe(true);
  });

  it('splits a pairs table and allows uneven trailing rows', () => {
    const block = firstBlock(
      '| นาที | โรมาจิ | | นาที | โรมาจิ |\n| :-: | :-- | :-: | :-: | :-- |\n| 1 | ip-pun | | 7 | nana-fun |\n| 2 | ni-fun | | 8 | hap-pun |\n| | | | 9 | kyū-fun |',
    );
    expect(block.t).toBe('pairs');
    if (block.t !== 'pairs') return;
    expect(block.halves[0].rows).toHaveLength(2);
    expect(block.halves[1].rows).toHaveLength(3);
  });

  it('rejects an empty cell before the last row of a pairs half', () => {
    expect(() =>
      convert(
        '| นาที | โรมาจิ | | นาที | โรมาจิ |\n| :-: | :-- | :-: | :-: | :-- |\n| | | | 7 | nana-fun |\n| 2 | ni-fun | | 8 | hap-pun |',
      ),
    ).toThrow(/empty cell/);
  });

  it('detects a number grid', () => {
    const block = firstBlock(
      '| 1 | 2 | 1,000 | 9.00 น. |\n| :-: | :-: | :-: | :-: |\n| ichi | **ni** | sen | ku-ji |',
    );
    expect(block.t).toBe('grid');
    if (block.t !== 'grid') return;
    expect(block.cells).toHaveLength(4);
    expect(block.cells[1]?.irregular).toBe(true);
  });

  it('falls back to a generic table', () => {
    const block = firstBlock(
      '| ประโยค | ความหมาย |\n| :-- | --: |\n| Ima nanji desuka? | ตอนนี้กี่โมง |',
    );
    expect(block.t).toBe('table');
    if (block.t !== 'table') return;
    expect(block.align).toEqual(['l', 'r']);
  });

  it('rejects rows with the wrong number of cells', () => {
    expect(() => convert('| a | b |\n| :-- | :-- |\n| x |')).toThrow(/cells/);
  });
});

describe('other blocks', () => {
  it('detects a dialogue and a tip', () => {
    const content = convert(
      '**Shop**\n\n- Sumisu: Kore o kudasai.\n- Mise no hito: Hai.\n\n> เคล็ดจำ: ข้อ 1\n> ข้อ 2',
    );
    const blocks = content.nodes[0]?.blocks ?? [];
    expect(blocks[0]?.t).toBe('dialogue');
    if (blocks[0]?.t === 'dialogue') {
      expect(blocks[0].lines[0]?.speaker).toBe('Sumisu');
      expect(textOf(blocks[0].lines[1]?.text ?? [])).toBe('Hai.');
    }
    expect(blocks[1]?.t).toBe('tip');
    if (blocks[1]?.t === 'tip') expect(blocks[1].c).toHaveLength(2);
  });

  it('keeps a bold paragraph without speaker lines as a paragraph', () => {
    const content = convert('**Title**\n\n- plain item');
    expect(content.nodes[0]?.blocks.map((block) => block.t)).toEqual(['p', 'list']);
  });
});

describe('tree rules', () => {
  it('uses heading numbers for ids and keeps them as written', () => {
    const content = convertSource(
      'vocab',
      'sample',
      '# T\n\n## 1. One\n\n### 1.1 Sub\n\n## Two\n',
      FILE,
    );
    expect(content.nodes[0]?.id).toBe('vocab/sample/1');
    expect(content.nodes[0]?.number).toBe('1.');
    expect(content.nodes[0]?.children[0]?.id).toBe('vocab/sample/1.1');
    expect(content.nodes[1]?.id).toBe('vocab/sample/h2-2');
  });

  it('does not treat "5 รูปแบบ" as a number', () => {
    const content = convertSource('vocab', 'sample', '# T\n\n## A\n\n### 5 รูปแบบ\n', FILE);
    expect(content.nodes[0]?.children[0]?.number).toBeUndefined();
  });

  it('rejects skipped heading levels, duplicate titles and duplicate ids', () => {
    expect(() => convertSource('vocab', 's', '# T\n\n## A\n\n#### B\n', FILE)).toThrow(
      /cannot follow/,
    );
    expect(() => convertSource('vocab', 's', '# T\n\n# U\n', FILE)).toThrow(/more than one/);
    expect(() => convertSource('vocab', 's', '# T\n\n## 1.1 A\n\n## 1.1 B\n', FILE)).toThrow(
      /duplicate node id/,
    );
  });
});

describe('romaji rules', () => {
  it('rejects kana, kanji and full-width characters', () => {
    expect(() => convert('こんにちは')).toThrow(/romaji only/);
    expect(() => convert('日本')).toThrow(/romaji only/);
    expect(() => convert('ＡＢＣ')).toThrow(/romaji only/);
  });

  it('rejects combining marks', () => {
    expect(() => convert('ō')).toThrow(/NFC|combining/);
  });

  it('rejects a romaji cell without a Latin letter', () => {
    expect(() => convert('| โรมาจิ | ความหมาย |\n| :-- | :-- |\n| 123 | หนึ่ง |')).toThrow(
      /no Latin letter/,
    );
  });
});

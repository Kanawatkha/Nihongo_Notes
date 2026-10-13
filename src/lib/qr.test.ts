import { describe, expect, it } from 'vitest';
import { QR_MAX_BYTES, formatBits, qrMatrix } from './qr';

describe('qrMatrix', () => {
  const matrix = qrMatrix('https://kanawatkha.github.io/Nihongo_Notes/');

  it('is square with a size that belongs to a QR version (21 + 4 per step)', () => {
    expect(matrix.every((row) => row.length === matrix.length)).toBe(true);
    expect((matrix.length - 21) % 4).toBe(0);
  });

  it('draws the three finder patterns and the dark module', () => {
    const last = matrix.length - 1;
    for (const [top, left] of [
      [0, 0],
      [0, last - 6],
      [last - 6, 0],
    ] as const) {
      for (let dy = 0; dy < 7; dy++) {
        for (let dx = 0; dx < 7; dx++) {
          const ring = dy === 0 || dy === 6 || dx === 0 || dx === 6;
          const core = dy >= 2 && dy <= 4 && dx >= 2 && dx <= 4;
          expect(matrix[top + dy]?.[left + dx]).toBe(ring || core);
        }
      }
    }
    expect(matrix[last - 7]?.[8]).toBe(true);
  });

  it('is deterministic and differs for different text', () => {
    expect(qrMatrix('a')).toEqual(qrMatrix('a'));
    expect(qrMatrix('a')).not.toEqual(qrMatrix('b'));
  });

  it('rejects text longer than the largest supported version', () => {
    expect(() => qrMatrix('x'.repeat(QR_MAX_BYTES))).not.toThrow();
    expect(() => qrMatrix('x'.repeat(QR_MAX_BYTES + 1))).toThrow();
  });

  it('computes the format bits listed in the QR standard for level M', () => {
    expect(formatBits(0)).toBe(0b101010000010010);
    expect(formatBits(1)).toBe(0b101000100100101);
    expect(formatBits(2)).toBe(0b101111001111100);
  });
});

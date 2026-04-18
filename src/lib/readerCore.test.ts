import { describe, expect, it } from 'vitest';
import { buildParsedDocument, buildParsedDocumentFromBlocks, getPivotIndex, getTokenDurationMs } from './readerCore';

describe('buildParsedDocument', () => {
  it('creates reader tokens with structural pauses and pivot letters', () => {
    const document = buildParsedDocument(
      'Chapter One\n\nThis is fast, focused reading.\n\nSecond paragraph.',
      'sample.txt',
      'txt'
    );

    expect(document.sourceName).toBe('sample.txt');
    expect(document.blocks).toHaveLength(3);
    expect(document.tokens.map((token) => token.text)).toEqual([
      'Chapter',
      'One',
      'This',
      'is',
      'fast,',
      'focused',
      'reading.',
      'Second',
      'paragraph.'
    ]);
    expect(document.tokens[1]).toMatchObject({
      pauseKind: 'heading',
      pauseMultiplier: 4,
      pivotIndex: 1
    });
    expect(document.tokens[4]).toMatchObject({
      pauseKind: 'comma',
      pauseMultiplier: 1.6
    });
    expect(document.tokens[6]).toMatchObject({
      pauseKind: 'paragraph',
      pauseMultiplier: 3.2
    });
    expect(document.tokens[8]).toMatchObject({
      pauseKind: 'sentence',
      pauseMultiplier: 2.2
    });
  });
});

describe('getTokenDurationMs', () => {
  it('applies base timing, punctuation pauses, and long-word adjustment', () => {
    expect(
      getTokenDurationMs({
        text: 'reading.',
        normalizedText: 'reading',
        pivotIndex: 2,
        pauseKind: 'sentence',
        pauseMultiplier: 2.2,
        blockIndex: 1
      }, 500)
    ).toBeCloseTo(264, 0);

    expect(
      getTokenDurationMs({
        text: 'hypercommunication',
        normalizedText: 'hypercommunication',
        pivotIndex: 4,
        pauseKind: 'none',
        pauseMultiplier: 1,
        blockIndex: 1
      }, 500)
    ).toBeCloseTo(138, 0);
  });
});

describe('buildParsedDocumentFromBlocks', () => {
  it('keeps explicit block kinds and upgrades trailing pauses for page breaks', () => {
    const document = buildParsedDocumentFromBlocks(
      [
        {
          text: 'Chapter One',
          kind: 'heading',
          pageBreakAfter: false
        },
        {
          text: 'This page ends here.',
          kind: 'paragraph',
          pageBreakAfter: true
        },
        {
          text: 'New page starts.',
          kind: 'paragraph',
          pageBreakAfter: false
        }
      ],
      'book.pdf',
      'pdf'
    );

    expect(document.blocks.map((block) => block.kind)).toEqual(['heading', 'paragraph', 'paragraph']);
    expect(document.tokens[1]).toMatchObject({
      text: 'One',
      pauseKind: 'heading',
      pauseMultiplier: 4
    });
    expect(document.tokens[5]).toMatchObject({
      text: 'here.',
      pauseKind: 'page',
      pauseMultiplier: 4
    });
  });
});

describe('getPivotIndex', () => {
  it('uses ORP positions that stay left-of-center as words get longer', () => {
    expect(getPivotIndex('I')).toBe(0);
    expect(getPivotIndex('read')).toBe(1);
    expect(getPivotIndex('reader')).toBe(2);
    expect(getPivotIndex('understand')).toBe(3);
    expect(getPivotIndex('hypercommunication')).toBe(4);
  });
});

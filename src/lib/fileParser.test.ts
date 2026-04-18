import { describe, expect, it } from 'vitest';
import { buildPdfDocumentFromPages, parseFile } from './fileParser';

describe('parseFile', () => {
  it('parses local txt files into reader tokens', async () => {
    const file = new File(['Read this faster.'], 'sample.txt', {
      type: 'text/plain'
    });

    const document = await parseFile(file);

    expect(document.sourceType).toBe('txt');
    expect(document.tokens.map((token) => token.text)).toEqual(['Read', 'this', 'faster.']);
  });

  it('rejects unsupported file types with a clear message', async () => {
    const file = new File(['fake'], 'sample.epub', {
      type: 'application/epub+zip'
    });

    await expect(parseFile(file)).rejects.toThrow('Only .txt and text-based .pdf files are supported.');
  });
});

describe('buildPdfDocumentFromPages', () => {
  it('preserves likely headings, paragraph gaps, and page-break pauses', () => {
    const document = buildPdfDocumentFromPages(
      [
        [
          { text: 'Chapter One', fontSize: 24, y: 760 },
          { text: 'This is the first paragraph.', fontSize: 12, y: 700 },
          { text: 'Still the same paragraph.', fontSize: 12, y: 686 },
          { text: 'Fresh section begins here.', fontSize: 12, y: 620 }
        ],
        [{ text: 'Next page starts now.', fontSize: 12, y: 760 }]
      ],
      'chapter.pdf'
    );

    expect(document.sourceType).toBe('pdf');
    expect(document.blocks.map((block) => block.kind)).toEqual([
      'heading',
      'paragraph',
      'paragraph',
      'paragraph'
    ]);
    expect(document.tokens[1]).toMatchObject({
      text: 'One',
      pauseKind: 'heading'
    });
    expect(document.tokens[14]).toMatchObject({
      text: 'here.',
      pauseKind: 'page',
      pauseMultiplier: 4
    });
  });

  it('drops repeated edge headers and footers while surfacing figure captions', () => {
    const document = buildPdfDocumentFromPages(
      [
        [
          { text: 'Deep Work Handbook', fontSize: 10, y: 790 },
          { text: 'Figure 1. Reading lane alignment diagram', fontSize: 11, y: 730 },
          { text: 'Chapter One', fontSize: 24, y: 690 },
          { text: 'Actual reading text starts here.', fontSize: 12, y: 640 },
          { text: '12', fontSize: 10, y: 25 }
        ],
        [
          { text: 'Deep Work Handbook', fontSize: 10, y: 790 },
          { text: 'Second page keeps only real content.', fontSize: 12, y: 680 },
          { text: '13', fontSize: 10, y: 25 }
        ]
      ],
      'figures.pdf'
    );

    expect(document.tokens.map((token) => token.text)).not.toContain('12');
    expect(document.tokens.map((token) => token.text)).not.toContain('13');
    expect(document.tokens.map((token) => token.text)).not.toContain('Handbook');
    expect(document.captions).toContain('Figure 1. Reading lane alignment diagram');
    expect(document.parsingNotes.join(' ')).toMatch(/images and diagrams are ignored/i);
    expect(document.parsingNotes.join(' ')).toMatch(/removed 2 repeated header/i);
  });
});

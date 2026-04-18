import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import { buildParsedDocument, buildParsedDocumentFromBlocks, type StructuredBlockInput } from './readerCore';
import type { ParsedDocument } from './types';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const CAPTION_RE = /^(figure|fig\.|table|diagram|illustration|image)\s+\d+/i;

export interface PdfPageLine {
  text: string;
  fontSize: number;
  y: number;
}

interface ExtractedPdfItem {
  str: string;
  width: number;
  height: number;
  x: number;
  y: number;
  hasEOL?: boolean;
}

export async function parseFile(file: File): Promise<ParsedDocument> {
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith('.txt')) {
    const text = await readFileAsText(file);
    return buildParsedDocument(text, file.name, 'txt');
  }

  if (lowerName.endsWith('.pdf')) {
    return parsePdfFile(file);
  }

  throw new Error('Only .txt and text-based .pdf files are supported.');
}

export function buildPdfDocumentFromPages(pages: PdfPageLine[][], sourceName: string): ParsedDocument {
  const preparedPages = pages.map((pageLines) =>
    [...pageLines]
      .filter((line) => line.text.trim().length > 0)
      .sort((left, right) => right.y - left.y)
  );
  const fontSizes = preparedPages
    .flat()
    .map((line) => line.fontSize)
    .filter((fontSize) => Number.isFinite(fontSize) && fontSize > 0);
  const medianFontSize = getMedian(fontSizes) || 12;
  const repeatedTopLines = getRepeatedEdgeTexts(preparedPages, 'top');
  const repeatedBottomLines = getRepeatedEdgeTexts(preparedPages, 'bottom');
  const blocks: StructuredBlockInput[] = [];
  const captions: string[] = [];
  let removedRepeatedEdgeLines = 0;
  let removedPageNumberLines = 0;

  preparedPages.forEach((pageLines, pageIndex) => {
    const filteredLines = pageLines.filter((line, lineIndex) => {
      const isTopLine = lineIndex === 0;
      const isBottomLine = lineIndex === pageLines.length - 1;
      const normalizedText = normalizeEdgeText(line.text);

      if ((isTopLine || isBottomLine) && isLikelyPageNumber(line.text)) {
        removedPageNumberLines += 1;
        return false;
      }

      if (isTopLine && normalizedText && repeatedTopLines.has(normalizedText)) {
        removedRepeatedEdgeLines += 1;
        return false;
      }

      if (isBottomLine && normalizedText && repeatedBottomLines.has(normalizedText)) {
        removedRepeatedEdgeLines += 1;
        return false;
      }

      return true;
    });
    const pageBlocks: Array<{ lines: PdfPageLine[]; kind: StructuredBlockInput['kind'] }> = [];

    filteredLines.forEach((line) => {
      if (CAPTION_RE.test(line.text.trim())) {
        captions.push(line.text.trim());
      }

      const blockKind = inferPdfBlockKind(line, medianFontSize);
      const previousBlock = pageBlocks[pageBlocks.length - 1];
      const previousLine = previousBlock?.lines[previousBlock.lines.length - 1];
      const verticalGap = previousLine ? previousLine.y - line.y : 0;
      const paragraphThreshold = Math.max(previousLine?.fontSize ?? line.fontSize, line.fontSize) * 1.7;
      const startsNewBlock =
        !previousBlock ||
        blockKind === 'heading' ||
        previousBlock.kind === 'heading' ||
        verticalGap > paragraphThreshold;

      if (startsNewBlock) {
        pageBlocks.push({
          lines: [line],
          kind: blockKind
        });
        return;
      }

      previousBlock.lines.push(line);
    });

    pageBlocks.forEach((block, blockIndex) => {
      blocks.push({
        text: block.lines.map((line) => line.text.trim()).join(' '),
        kind: block.kind,
        pageBreakAfter: pageIndex < pages.length - 1 && blockIndex === pageBlocks.length - 1
      });
    });
  });

  const parsedDocument = buildParsedDocumentFromBlocks(blocks, sourceName, 'pdf');
  const parsingNotes = ['Images and diagrams are ignored unless the PDF exposes extractable caption text beneath them.'];

  if (removedRepeatedEdgeLines > 0) {
    parsingNotes.push(`Removed ${removedRepeatedEdgeLines} repeated header/footer lines.`);
  }

  if (removedPageNumberLines > 0) {
    parsingNotes.push(`Ignored ${removedPageNumberLines} standalone page-number lines.`);
  }

  if (captions.length > 0) {
    parsingNotes.push(`Captured ${captions.length} figure/table caption lines for reference.`);
  }

  return {
    ...parsedDocument,
    captions,
    parsingNotes
  };
}

async function parsePdfFile(file: File): Promise<ParsedDocument> {
  try {
    const data = await file.arrayBuffer();
    const pdf = await getDocument({ data }).promise;
    const pages: PdfPageLine[][] = [];

    for (let pageIndex = 0; pageIndex < pdf.numPages; pageIndex += 1) {
      const page = await pdf.getPage(pageIndex + 1);
      const textContent = await page.getTextContent();
      const rawItems = textContent.items
        .map((item) => normalizePdfItem(item))
        .filter((item): item is ExtractedPdfItem => item !== null);
      const pageLines = groupPdfItemsIntoLines(rawItems);

      if (pageLines.length > 0) {
        pages.push(pageLines);
      }
    }

    if (pages.length === 0 || pages.every((page) => page.length === 0)) {
      throw new Error('This PDF looks scanned or image-based. v1 supports text-based PDFs only.');
    }

    return buildPdfDocumentFromPages(pages, file.name);
  } catch (error) {
    if (error instanceof Error) {
      if (/password|encrypted/i.test(error.message)) {
        throw new Error('Encrypted PDFs are not supported yet.');
      }

      throw error;
    }

    throw new Error('Unable to read this PDF file.');
  }
}

function normalizePdfItem(item: unknown): ExtractedPdfItem | null {
  if (!item || typeof item !== 'object' || !('str' in item) || typeof item.str !== 'string') {
    return null;
  }

  const maybeItem = item as Record<string, unknown>;
  const transform = Array.isArray(maybeItem.transform) ? (maybeItem.transform as number[]) : [0, 0, 0, 0, 0, 0];
  const width = typeof maybeItem.width === 'number' ? maybeItem.width : 0;
  const height =
    typeof maybeItem.height === 'number'
      ? maybeItem.height
      : Math.abs(transform[0]) || Math.abs(transform[3]) || 12;

  return {
    str: maybeItem.str as string,
    width,
    height,
    x: transform[4] ?? 0,
    y: transform[5] ?? 0,
    hasEOL: typeof maybeItem.hasEOL === 'boolean' ? maybeItem.hasEOL : false
  };
}

function groupPdfItemsIntoLines(items: ExtractedPdfItem[]): PdfPageLine[] {
  const sortedItems = [...items].sort((left, right) => {
    if (Math.abs(right.y - left.y) > 2) {
      return right.y - left.y;
    }

    return left.x - right.x;
  });

  const lines: Array<{ y: number; items: ExtractedPdfItem[]; fontSize: number }> = [];

  sortedItems.forEach((item) => {
    const candidate = lines.find((line) => Math.abs(line.y - item.y) <= Math.max(2, item.height * 0.35));

    if (!candidate) {
      lines.push({
        y: item.y,
        items: [item],
        fontSize: Math.max(item.height, Math.abs(item.width) || 0, 10)
      });
      return;
    }

    candidate.items.push(item);
    candidate.fontSize = Math.max(candidate.fontSize, item.height, 10);
  });

  return lines
    .map((line) => {
      const sortedLineItems = [...line.items].sort((left, right) => left.x - right.x);
      let text = '';
      let previousRight = 0;

      sortedLineItems.forEach((item, index) => {
        const trimmed = item.str.replace(/\s+/g, ' ').trim();

        if (!trimmed) {
          return;
        }

        const shouldAddSpace =
          index > 0 && (item.x - previousRight > Math.max(2, line.fontSize * 0.18) || item.hasEOL);

        text += `${shouldAddSpace ? ' ' : ''}${trimmed}`;
        previousRight = item.x + item.width;
      });

      return {
        text: text.trim(),
        fontSize: line.fontSize,
        y: line.y
      };
    })
    .filter((line) => line.text.length > 0)
    .sort((left, right) => right.y - left.y);
}

function inferPdfBlockKind(line: PdfPageLine, medianFontSize: number): StructuredBlockInput['kind'] {
  const wordCount = line.text.split(/\s+/).filter(Boolean).length;
  const looksLikeHeading =
    !CAPTION_RE.test(line.text.trim()) &&
    line.fontSize >= medianFontSize * 1.35 &&
    wordCount <= 8 &&
    !/[.!?]$/.test(line.text);

  return looksLikeHeading ? 'heading' : 'paragraph';
}

function getMedian(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

async function readFileAsText(file: File): Promise<string> {
  if (typeof file.text === 'function') {
    return file.text();
  }

  if (typeof file.arrayBuffer === 'function') {
    const buffer = await file.arrayBuffer();
    return new TextDecoder().decode(buffer);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Unable to read the uploaded text file.'));
    };
    reader.onload = () => {
      resolve(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.readAsText(file);
  });
}

function getRepeatedEdgeTexts(pages: PdfPageLine[][], position: 'top' | 'bottom'): Set<string> {
  const counts = new Map<string, number>();

  pages.forEach((page) => {
    const edgeLine = position === 'top' ? page[0] : page[page.length - 1];
    const normalizedText = edgeLine ? normalizeEdgeText(edgeLine.text) : '';

    if (!normalizedText || isLikelyPageNumber(edgeLine.text) || edgeLine.text.split(/\s+/).length > 12) {
      return;
    }

    counts.set(normalizedText, (counts.get(normalizedText) ?? 0) + 1);
  });

  return new Set(
    [...counts.entries()].filter(([, count]) => count >= 2).map(([text]) => text)
  );
}

function normalizeEdgeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

function isLikelyPageNumber(text: string): boolean {
  return /^(page\s+)?\d+$/.test(text.trim().toLowerCase());
}

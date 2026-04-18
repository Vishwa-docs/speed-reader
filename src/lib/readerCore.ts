import type { ParsedDocument, ReaderBlock, ReaderPauseKind, ReaderToken, SourceType } from './types';

const BLOCK_BREAK_RE = /\n\s*\n+/;

export interface HighlightContext {
  beforeText: string;
  focusText: string;
  afterText: string;
  excerpt: string;
}

export interface StructuredBlockInput {
  text: string;
  kind: ReaderBlock['kind'];
  pageBreakAfter?: boolean;
}

export function buildParsedDocument(
  text: string,
  sourceName: string,
  sourceType: SourceType
): ParsedDocument {
  const blocks = splitBlocks(text);
  const tokens = blocks.flatMap((block, blockIndex) =>
    tokenizeBlock(block, blockIndex, blockIndex === blocks.length - 1)
  );

  return {
    documentId: createDocumentId(sourceName, sourceType, tokens),
    sourceName,
    sourceType,
    blocks,
    tokens,
    captions: [],
    parsingNotes: []
  };
}

export function buildParsedDocumentFromBlocks(
  blockInputs: StructuredBlockInput[],
  sourceName: string,
  sourceType: SourceType
): ParsedDocument {
  const blocks = blockInputs
    .map((block) => ({
      ...block,
      text: block.text.trim()
    }))
    .filter((block) => block.text.length > 0)
    .map((block, index) => ({
      ...block,
      index
    }));
  const tokens = blocks.flatMap((block, blockIndex) =>
    tokenizeBlock(block, blockIndex, blockIndex === blocks.length - 1)
  );

  return {
    documentId: createDocumentId(sourceName, sourceType, tokens),
    sourceName,
    sourceType,
    blocks,
    tokens,
    captions: [],
    parsingNotes: []
  };
}

export function getTokenDurationMs(token: ReaderToken, wordsPerMinute: number): number {
  const baseDuration = 60000 / wordsPerMinute;
  const lengthMultiplier = token.normalizedText.length >= 13 ? 1.15 : 1;

  return baseDuration * token.pauseMultiplier * lengthMultiplier;
}

export function buildHighlightContext(
  tokens: ReaderToken[],
  tokenIndex: number,
  before = 8,
  after = 12
): HighlightContext {
  const start = Math.max(0, tokenIndex - before);
  const end = Math.min(tokens.length, tokenIndex + after + 1);
  const beforeText = tokens
    .slice(start, tokenIndex)
    .map((token) => token.text)
    .join(' ');
  const focusText = tokens[tokenIndex]?.text ?? '';
  const afterText = tokens
    .slice(tokenIndex + 1, end)
    .map((token) => token.text)
    .join(' ');
  const excerpt = [beforeText, focusText, afterText].filter(Boolean).join(' ');

  return {
    beforeText,
    focusText,
    afterText,
    excerpt
  };
}

export function buildContextExcerpt(tokens: ReaderToken[], tokenIndex: number, before = 8, after = 12): string {
  return buildHighlightContext(tokens, tokenIndex, before, after).excerpt;
}

function splitBlocks(text: string): ReaderBlock[] {
  return text
    .replace(/\r\n/g, '\n')
    .split(BLOCK_BREAK_RE)
    .map((rawBlock) => rawBlock.trim())
    .filter(Boolean)
    .map((rawBlock, index) => ({
      text: rawBlock
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .join(' '),
      kind: inferBlockKind(rawBlock, index),
      index,
      pageBreakAfter: false
    }));
}

function inferBlockKind(rawBlock: string, index: number): ReaderBlock['kind'] {
  const cleaned = rawBlock
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ');
  const words = cleaned.split(/\s+/).filter(Boolean);
  const looksLikeShortHeading = words.length > 0 && words.length <= 8 && !/[.!?]/.test(cleaned);
  const titleCaseRatio =
    words.filter((word) => /^[A-Z0-9][A-Za-z0-9'’-]*$/.test(stripOuterPunctuation(word))).length /
    words.length;

  if (looksLikeShortHeading && (index === 0 || titleCaseRatio >= 0.75)) {
    return 'heading';
  }

  return 'paragraph';
}

function tokenizeBlock(block: ReaderBlock, blockIndex: number, isLastBlock: boolean): ReaderToken[] {
  const parts = block.text.split(/\s+/).filter(Boolean);

  return parts
    .map((part, tokenIndex) => createToken(part, block, blockIndex, tokenIndex === parts.length - 1, isLastBlock))
    .filter((token): token is ReaderToken => token !== null);
}

function createToken(
  text: string,
  block: ReaderBlock,
  blockIndex: number,
  isLastTokenInBlock: boolean,
  isLastBlock: boolean
): ReaderToken | null {
  const normalizedText = stripOuterPunctuation(text);

  if (!normalizedText) {
    return null;
  }

  const pause = inferPause(text, block.kind, block.pageBreakAfter ?? false, isLastTokenInBlock, isLastBlock);

  return {
    text,
    normalizedText,
    pivotIndex: getPivotIndex(normalizedText),
    pauseKind: pause.pauseKind,
    pauseMultiplier: pause.pauseMultiplier,
    blockIndex
  };
}

function inferPause(
  text: string,
  blockKind: ReaderBlock['kind'],
  pageBreakAfter: boolean,
  isLastTokenInBlock: boolean,
  isLastBlock: boolean
): { pauseKind: ReaderPauseKind; pauseMultiplier: number } {
  if (isLastTokenInBlock && blockKind === 'heading') {
    return { pauseKind: 'heading', pauseMultiplier: 4 };
  }

  if (isLastTokenInBlock && pageBreakAfter) {
    return { pauseKind: 'page', pauseMultiplier: 4 };
  }

  if (isLastTokenInBlock && !isLastBlock) {
    return { pauseKind: 'paragraph', pauseMultiplier: 3.2 };
  }

  if (/[.!?]["')\]]*$/.test(text)) {
    return { pauseKind: 'sentence', pauseMultiplier: 2.2 };
  }

  if (/[,;:]["')\]]*$/.test(text)) {
    return { pauseKind: 'comma', pauseMultiplier: 1.6 };
  }

  return { pauseKind: 'none', pauseMultiplier: 1 };
}

export function getPivotIndex(word: string): number {
  const length = [...word].length;

  if (length <= 1) {
    return 0;
  }

  if (length <= 5) {
    return 1;
  }

  if (length <= 9) {
    return 2;
  }

  if (length <= 13) {
    return 3;
  }

  return 4;
}

function stripOuterPunctuation(word: string): string {
  return word.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '');
}

function createDocumentId(sourceName: string, sourceType: SourceType, tokens: ReaderToken[]): string {
  const seed = `${sourceType}:${sourceName}:${tokens.map((token) => token.text).join(' ')}`;
  let hash = 2166136261;

  for (const character of seed) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return `doc-${(hash >>> 0).toString(16)}`;
}

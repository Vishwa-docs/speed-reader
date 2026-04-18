export type SourceType = 'txt' | 'pdf';

export type ReaderPauseKind =
  | 'none'
  | 'comma'
  | 'sentence'
  | 'paragraph'
  | 'heading'
  | 'page';

export interface ReaderBlock {
  text: string;
  kind: 'heading' | 'paragraph';
  index: number;
  pageBreakAfter?: boolean;
}

export interface ReaderToken {
  text: string;
  normalizedText: string;
  pivotIndex: number;
  pauseKind: ReaderPauseKind;
  pauseMultiplier: number;
  blockIndex: number;
}

export interface ParsedDocument {
  documentId: string;
  sourceName: string;
  sourceType: SourceType;
  blocks: ReaderBlock[];
  tokens: ReaderToken[];
  captions: string[];
  parsingNotes: string[];
}

export interface SavedHighlight {
  id: string;
  documentId: string;
  sourceName: string;
  tokenIndex: number;
  focusText: string;
  beforeContext?: string;
  afterContext?: string;
  excerpt: string;
  createdAt: number;
}

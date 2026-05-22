const STORAGE_KEY = 'speed-reader/progress';

type ProgressMap = Record<string, { tokenIndex: number; updatedAt: number }>;

function read(): ProgressMap {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

function write(map: ProgressMap) {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Quota or serialization failure: progress is best-effort, don't disrupt reading.
  }
}

export function loadProgress(documentId: string): number | null {
  const entry = read()[documentId];
  return entry ? entry.tokenIndex : null;
}

export function saveProgress(documentId: string, tokenIndex: number) {
  const map = read();
  map[documentId] = { tokenIndex, updatedAt: Date.now() };
  write(map);
}

export function clearProgress(documentId: string) {
  const map = read();
  delete map[documentId];
  write(map);
}

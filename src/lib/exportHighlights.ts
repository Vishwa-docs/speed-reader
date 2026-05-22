import type { SavedHighlight } from './types';

export function highlightsToMarkdown(sourceName: string, highlights: SavedHighlight[]): string {
  const sorted = [...highlights].sort((a, b) => a.tokenIndex - b.tokenIndex);
  const lines: string[] = [
    `# Highlights — ${sourceName}`,
    '',
    `_${highlights.length} highlight${highlights.length === 1 ? '' : 's'}, exported ${new Date().toISOString()}_`,
    ''
  ];

  for (const h of sorted) {
    const before = h.beforeContext?.trim() ?? '';
    const after = h.afterContext?.trim() ?? '';
    const passage = [before, `**${h.focusText}**`, after].filter(Boolean).join(' ');
    lines.push(`- ${passage || h.excerpt}`);
    lines.push(`  _word #${h.tokenIndex + 1} · saved ${new Date(h.createdAt).toLocaleString()}_`);
    lines.push('');
  }

  return lines.join('\n');
}

export function downloadMarkdown(filename: string, contents: string) {
  if (typeof document === 'undefined') return;
  const blob = new Blob([contents], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function suggestedHighlightsFilename(sourceName: string): string {
  const stem = sourceName.replace(/\.[^.]+$/, '').replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '');
  return `${stem || 'highlights'}-highlights.md`;
}

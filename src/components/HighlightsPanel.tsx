import type { SavedHighlight } from '../lib/types';

interface HighlightsPanelProps {
  highlights: SavedHighlight[];
  isOpen: boolean;
  onClose: () => void;
  onJumpToHighlight: (tokenIndex: number) => void;
  onDeleteHighlight: (id: string) => void;
}

export function HighlightsPanel({
  highlights,
  isOpen,
  onClose,
  onJumpToHighlight,
  onDeleteHighlight
}: HighlightsPanelProps) {
  return (
    <aside className={isOpen ? 'highlights-panel highlights-panel--open' : 'highlights-panel'} aria-label="Highlights">
      <div className="highlights-panel__header">
        <div>
          <p className="reader-shell__eyebrow">Saved points</p>
          <strong>Highlights</strong>
        </div>
        <button className="ghost-button" type="button" onClick={onClose}>
          Close
        </button>
      </div>

      {highlights.length === 0 ? (
        <p className="highlights-panel__empty">
          Save a point with <kbd>H</kbd> or the mark button to keep your place without breaking reading flow.
        </p>
      ) : (
        <div className="highlights-panel__list">
          {highlights.map((highlight) => (
            <article key={highlight.id} className="highlights-panel__card">
              <button
                className="highlights-panel__jump"
                type="button"
                onClick={() => onJumpToHighlight(highlight.tokenIndex)}
              >
                <strong>{highlight.focusText}</strong>
                {highlight.beforeContext || highlight.afterContext ? (
                  <p className="highlights-panel__context">
                    {highlight.beforeContext ? (
                      <span className="highlights-panel__context-copy">... {highlight.beforeContext}</span>
                    ) : null}
                    <span className="highlights-panel__context-focus">{highlight.focusText}</span>
                    {highlight.afterContext ? (
                      <span className="highlights-panel__context-copy">{highlight.afterContext} ...</span>
                    ) : null}
                  </p>
                ) : (
                  <span>{highlight.excerpt}</span>
                )}
              </button>

              <div className="highlights-panel__card-meta">
                <time dateTime={new Date(highlight.createdAt).toISOString()}>
                  {new Date(highlight.createdAt).toLocaleString()}
                </time>
                <button className="ghost-button" type="button" onClick={() => onDeleteHighlight(highlight.id)}>
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </aside>
  );
}

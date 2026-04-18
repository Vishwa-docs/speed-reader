interface ReaderControlsProps {
  documentName: string;
  currentIndex: number;
  tokenCount: number;
  highlightCount: number;
  isHighlightsOpen: boolean;
  wordsPerMinute: number;
  presets: readonly number[];
  isPlaying: boolean;
  onTogglePlayback: () => void;
  onRestart: () => void;
  onStepBackward: () => void;
  onStepForward: () => void;
  onMarkPoint: () => void;
  onToggleHighlights: () => void;
  onPresetSelect: (value: number) => void;
  onAdjustWordsPerMinute: (delta: number) => void;
  onExit: () => void;
}

export function ReaderControls({
  documentName,
  currentIndex,
  tokenCount,
  highlightCount,
  isHighlightsOpen,
  wordsPerMinute,
  presets,
  isPlaying,
  onTogglePlayback,
  onRestart,
  onStepBackward,
  onStepForward,
  onMarkPoint,
  onToggleHighlights,
  onPresetSelect,
  onAdjustWordsPerMinute,
  onExit
}: ReaderControlsProps) {
  return (
    <>
      <header className="reader-shell__header">
        <button className="ghost-button" type="button" onClick={onExit}>
          Change file
        </button>
        <div className="reader-shell__meta">
          <span className="reader-shell__eyebrow">Local playback</span>
          <strong>{documentName}</strong>
          <span>
            {Math.min(currentIndex + 1, tokenCount)} / {tokenCount}
          </span>
        </div>
      </header>

      <footer className="reader-shell__footer">
        <div className="reader-shell__transport">
          <button className="ghost-button" type="button" onClick={onStepBackward}>
            Prev
          </button>
          <button className="primary-button" type="button" onClick={onTogglePlayback}>
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button className="ghost-button" type="button" onClick={onStepForward}>
            Next
          </button>
          <button className="ghost-button" type="button" onClick={onRestart}>
            Restart
          </button>
          <button className="ghost-button" type="button" onClick={onMarkPoint}>
            Mark point
          </button>
          <button className="ghost-button" type="button" onClick={onToggleHighlights}>
            {isHighlightsOpen ? 'Hide highlights' : `Highlights${highlightCount ? ` (${highlightCount})` : ''}`}
          </button>
        </div>

        <div className="reader-shell__speed">
          <span className="reader-shell__eyebrow">Cadence</span>
          <div className="reader-shell__speed-row">
            <button className="ghost-button" type="button" onClick={() => onAdjustWordsPerMinute(-25)}>
              -
            </button>
            <strong>{wordsPerMinute} WPM</strong>
            <button className="ghost-button" type="button" onClick={() => onAdjustWordsPerMinute(25)}>
              +
            </button>
          </div>
          <div className="reader-shell__preset-strip">
            {presets.map((preset) => (
              <button
                key={preset}
                className={preset === wordsPerMinute ? 'preset-button preset-button--active' : 'preset-button'}
                type="button"
                onClick={() => onPresetSelect(preset)}
              >
                {preset}
              </button>
            ))}
          </div>
          <p className="reader-shell__hotkeys">Hotkeys: Space play/pause, arrows step, H mark, B highlights, M music.</p>
        </div>
      </footer>
    </>
  );
}

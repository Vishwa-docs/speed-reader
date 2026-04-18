import type { ChangeEvent, DragEvent } from 'react';
import type { ParsedDocument } from '../lib/types';

interface UploadStageProps {
  document: ParsedDocument | null;
  error: string | null;
  isLoading: boolean;
  wordsPerMinute: number;
  presets: readonly number[];
  onFileSelect: (file: File) => void;
  onPresetSelect: (value: number) => void;
  onAdjustWordsPerMinute: (delta: number) => void;
  onStart: () => void;
}

export function UploadStage({
  document,
  error,
  isLoading,
  wordsPerMinute,
  presets,
  onFileSelect,
  onPresetSelect,
  onAdjustWordsPerMinute,
  onStart
}: UploadStageProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];

    if (nextFile) {
      onFileSelect(nextFile);
      event.target.value = '';
    }
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const nextFile = event.dataTransfer.files?.[0];

    if (nextFile) {
      onFileSelect(nextFile);
    }
  };

  return (
    <main className="upload-stage">
      <section className="upload-stage__hero">
        <p className="upload-stage__eyebrow">Video-faithful speed reading</p>
        <h1>Lock your gaze. Let the words come to you.</h1>
        <p className="upload-stage__lede">
          Drop in a text file or a digital PDF and play it back in a fixed-focus reading lane inspired by the
          reference short.
        </p>
      </section>

      <section className="upload-stage__controls">
        <label
          className={isLoading ? 'upload-dropzone upload-dropzone--busy' : 'upload-dropzone'}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
        >
          <input
            className="sr-only"
            type="file"
            accept=".txt,.pdf,text/plain,application/pdf"
            aria-label="Upload a TXT or PDF"
            onChange={handleChange}
          />
          <span className="upload-dropzone__label">{isLoading ? 'Parsing file...' : 'Upload a TXT or PDF'}</span>
          <span className="upload-dropzone__hint">Drop a file here or tap to choose one locally.</span>
        </label>

        <div className="upload-stage__speed-panel">
          <div>
            <p className="upload-stage__eyebrow">Reader pace</p>
            <div className="upload-stage__speed-row">
              <button className="ghost-button" type="button" onClick={() => onAdjustWordsPerMinute(-25)}>
                -
              </button>
              <strong>{wordsPerMinute} WPM</strong>
              <button className="ghost-button" type="button" onClick={() => onAdjustWordsPerMinute(25)}>
                +
              </button>
            </div>
          </div>
          <div className="upload-stage__preset-strip">
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
        </div>

        <div className="upload-stage__status">
          {document ? (
            <>
              <p className="upload-stage__loaded">{document.sourceName} loaded</p>
              <p>
                {document.tokens.length} words prepared across {document.blocks.length} reading blocks.
              </p>
              {document.parsingNotes.length > 0 ? (
                <ul className="upload-stage__note-list">
                  {document.parsingNotes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              ) : null}
              {document.captions.length > 0 ? (
                <div className="upload-stage__captions">
                  <strong>Detected captions</strong>
                  <ul className="upload-stage__note-list">
                    {document.captions.slice(0, 3).map((caption) => (
                      <li key={caption}>{caption}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="upload-stage__preview">
                {document.blocks.slice(0, 3).map((block) => (
                  <article key={`${block.index}-${block.text}`} className="upload-stage__preview-block">
                    <span className="upload-stage__preview-kind">{block.kind}</span>
                    <p>{block.text}</p>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <p>TXT stays straightforward. PDFs preserve headings, paragraph gaps, and page rhythm when text is extractable.</p>
          )}
          {error ? <p className="upload-stage__error">{error}</p> : null}
        </div>

        <button className="primary-button primary-button--wide" type="button" onClick={onStart} disabled={!document || isLoading}>
          Start reading
        </button>
      </section>
    </main>
  );
}

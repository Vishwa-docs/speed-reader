import { useEffect } from 'react';

interface HelpOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpOverlay({ isOpen, onClose }: HelpOverlayProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="help-overlay" role="dialog" aria-modal="true" aria-label="Speed Reader help" onClick={onClose}>
      <div className="help-overlay__panel" onClick={(event) => event.stopPropagation()}>
        <header className="help-overlay__header">
          <div>
            <p className="reader-shell__eyebrow">How to use</p>
            <strong>Speed Reader</strong>
          </div>
          <button className="ghost-button" type="button" onClick={onClose}>
            Close
          </button>
        </header>

        <section className="help-overlay__section">
          <h3>The idea</h3>
          <p>
            Words appear one at a time, aligned around a coloured <em>pivot</em> letter. Keep your eyes on the
            pivot and let the text come to you — you do not have to move your eyes left-to-right.
          </p>
          <p>
            Start around <strong>300 WPM</strong>. Once it feels relaxed, nudge it up. Most people land
            comfortably between 450 and 700 WPM with a little practice.
          </p>
        </section>

        <section className="help-overlay__section">
          <h3>Hotkeys</h3>
          <table className="help-overlay__table">
            <tbody>
              <tr><td><kbd>Space</kbd></td><td>Play / pause</td></tr>
              <tr><td><kbd>←</kbd> / <kbd>→</kbd></td><td>Step one word</td></tr>
              <tr><td><kbd>H</kbd></td><td>Save current point as highlight</td></tr>
              <tr><td><kbd>B</kbd></td><td>Toggle highlights panel</td></tr>
              <tr><td><kbd>M</kbd></td><td>Toggle focus audio</td></tr>
              <tr><td><kbd>?</kbd></td><td>Open this help</td></tr>
              <tr><td><kbd>Esc</kbd></td><td>Close any open panel</td></tr>
            </tbody>
          </table>
        </section>

        <section className="help-overlay__section">
          <h3>Good to know</h3>
          <ul>
            <li>Your reading position is saved automatically per document.</li>
            <li>Highlights live in your browser and can be exported to a Markdown file.</li>
            <li>Nothing leaves your device — there is no server.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

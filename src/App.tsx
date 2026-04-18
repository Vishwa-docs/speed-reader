import { startTransition, useEffect, useMemo, useRef, useState } from 'react';
import { FocusAudioPanel, type FocusStation } from './components/FocusAudioPanel';
import { HighlightsPanel } from './components/HighlightsPanel';
import { ReaderControls } from './components/ReaderControls';
import { ReaderLane } from './components/ReaderLane';
import { UploadStage } from './components/UploadStage';
import { deleteHighlight, listHighlights, saveHighlight } from './lib/highlightsDb';
import { parseFile } from './lib/fileParser';
import { buildHighlightContext, getTokenDurationMs } from './lib/readerCore';
import type { ParsedDocument, SavedHighlight } from './lib/types';

const PRESETS = [300, 500, 700, 900] as const;
const MIN_WPM = 150;
const MAX_WPM = 1200;
const FOCUS_STATIONS: readonly FocusStation[] = [
  {
    id: 'groove-salad',
    label: 'Groove Salad',
    description: 'A gentle ambient station for deep work and steady attention.',
    streamUrl: 'https://ice5.somafm.com/groovesalad-128-mp3'
  },
  {
    id: 'groove-salad-classic',
    label: 'Groove Salad Classic',
    description: 'Softer classic ambient textures when you want less movement.',
    streamUrl: 'https://ice5.somafm.com/gsclassic-128-mp3'
  },
  {
    id: 'drone-zone',
    label: 'Drone Zone',
    description: 'Minimal atmospheric space for the calmest reading sessions.',
    streamUrl: 'https://ice5.somafm.com/dronezone-128-mp3'
  }
];

export default function App() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [document, setDocument] = useState<ParsedDocument | null>(null);
  const [highlights, setHighlights] = useState<SavedHighlight[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReaderMode, setIsReaderMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHighlightsOpen, setIsHighlightsOpen] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [wordsPerMinute, setWordsPerMinute] = useState<number>(500);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [musicStationId, setMusicStationId] = useState<string>(FOCUS_STATIONS[0].id);
  const [musicVolume, setMusicVolume] = useState<number>(0.35);

  const currentToken = document?.tokens[currentIndex] ?? null;
  const currentStation = useMemo(
    () => FOCUS_STATIONS.find((station) => station.id === musicStationId) ?? FOCUS_STATIONS[0],
    [musicStationId]
  );

  useEffect(() => {
    if (!document) {
      setHighlights([]);
      return;
    }

    let cancelled = false;

    void listHighlights(document.documentId).then((nextHighlights) => {
      if (!cancelled) {
        setHighlights(nextHighlights);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [document]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.volume = musicVolume;
  }, [musicVolume]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (isMusicPlaying) {
      audio
        .play()
        .catch(() => {
          setIsMusicPlaying(false);
        });
    } else {
      audio.pause();
    }
  }, [isMusicPlaying, musicStationId]);

  useEffect(() => {
    if (!document || !isReaderMode) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName ?? '';

      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
        return;
      }

      const lowerKey = event.key.toLowerCase();

      if (event.key === ' ') {
        event.preventDefault();
        setIsPlaying((value) => !value);
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        stepIndex(1);
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        stepIndex(-1);
      }

      if (lowerKey === 'h') {
        event.preventDefault();
        void handleMarkPoint();
      }

      if (lowerKey === 'b') {
        event.preventDefault();
        setIsHighlightsOpen((value) => !value);
      }

      if (lowerKey === 'm') {
        event.preventDefault();
        setIsMusicPlaying((value) => !value);
      }

      if (event.key === 'Escape') {
        setIsHighlightsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [document, isReaderMode, currentIndex, currentToken]);

  useEffect(() => {
    if (!document || !isPlaying) {
      return;
    }

    if (currentIndex >= document.tokens.length - 1) {
      setIsPlaying(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCurrentIndex((value) => Math.min(value + 1, document.tokens.length - 1));
    }, getTokenDurationMs(document.tokens[currentIndex], wordsPerMinute));

    return () => window.clearTimeout(timeoutId);
  }, [currentIndex, document, isPlaying, wordsPerMinute]);

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const parsed = await parseFile(file);

      if (parsed.tokens.length === 0) {
        throw new Error('This file did not contain readable words for the speed reader.');
      }

      startTransition(() => {
        setDocument(parsed);
        setCurrentIndex(0);
        setHighlights([]);
        setIsPlaying(false);
        setIsReaderMode(false);
        setIsHighlightsOpen(false);
        setError(null);
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to parse this file.');
      setDocument(null);
      setHighlights([]);
      setIsReaderMode(false);
      setIsPlaying(false);
      setIsHighlightsOpen(false);
      setCurrentIndex(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = () => {
    if (!document) {
      return;
    }

    setCurrentIndex(0);
    setIsReaderMode(true);
    setIsPlaying(true);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  const handleExit = () => {
    setIsReaderMode(false);
    setIsPlaying(false);
    setIsHighlightsOpen(false);
  };

  const handleMarkPoint = async () => {
    if (!document || !currentToken) {
      return;
    }

    const highlightContext = buildHighlightContext(document.tokens, currentIndex);
    const savedHighlight = await saveHighlight({
      documentId: document.documentId,
      sourceName: document.sourceName,
      tokenIndex: currentIndex,
      focusText: currentToken.text,
      beforeContext: highlightContext.beforeText,
      afterContext: highlightContext.afterText,
      excerpt: highlightContext.excerpt
    });

    setHighlights((existingHighlights) =>
      [savedHighlight, ...existingHighlights.filter((highlight) => highlight.id !== savedHighlight.id)].sort(
        (left, right) => right.createdAt - left.createdAt
      )
    );
  };

  const handleDeleteHighlight = async (id: string) => {
    await deleteHighlight(id);
    setHighlights((existingHighlights) => existingHighlights.filter((highlight) => highlight.id !== id));
  };

  function stepIndex(delta: number) {
    if (!document) {
      return;
    }

    setCurrentIndex((value) => clamp(value + delta, 0, document.tokens.length - 1));
    setIsPlaying(false);
  }

  return isReaderMode && document && currentToken ? (
    <main className="reader-shell">
      <audio ref={audioRef} src={currentStation.streamUrl} preload="none" />
      <div className="reader-shell__noise" aria-hidden="true" />
      <div className="reader-shell__top-dock">
        <FocusAudioPanel
          stations={FOCUS_STATIONS}
          currentStationId={musicStationId}
          isPlaying={isMusicPlaying}
          volume={musicVolume}
          onStationChange={setMusicStationId}
          onTogglePlayback={() => setIsMusicPlaying((value) => !value)}
          onVolumeChange={setMusicVolume}
        />
      </div>
      <ReaderControls
        documentName={document.sourceName}
        currentIndex={currentIndex}
        tokenCount={document.tokens.length}
        highlightCount={highlights.length}
        isHighlightsOpen={isHighlightsOpen}
        wordsPerMinute={wordsPerMinute}
        presets={PRESETS}
        isPlaying={isPlaying}
        onTogglePlayback={() => setIsPlaying((value) => !value)}
        onRestart={handleRestart}
        onStepBackward={() => stepIndex(-1)}
        onStepForward={() => stepIndex(1)}
        onMarkPoint={() => {
          void handleMarkPoint();
        }}
        onToggleHighlights={() => setIsHighlightsOpen((value) => !value)}
        onPresetSelect={setWordsPerMinute}
        onAdjustWordsPerMinute={(delta) => setWordsPerMinute((value) => clamp(value + delta, MIN_WPM, MAX_WPM))}
        onExit={handleExit}
      />

      <section className="reader-shell__stage" aria-live="polite">
        <div className="reader-shell__lane-frame">
          <ReaderLane token={currentToken} />
        </div>
      </section>

      <HighlightsPanel
        highlights={highlights}
        isOpen={isHighlightsOpen}
        onClose={() => setIsHighlightsOpen(false)}
        onJumpToHighlight={(tokenIndex) => {
          setCurrentIndex(tokenIndex);
          setIsPlaying(false);
        }}
        onDeleteHighlight={(id) => {
          void handleDeleteHighlight(id);
        }}
      />
    </main>
  ) : (
    <UploadStage
      document={document}
      error={error}
      isLoading={isLoading}
      wordsPerMinute={wordsPerMinute}
      presets={PRESETS}
      onFileSelect={handleFileSelect}
      onPresetSelect={setWordsPerMinute}
      onAdjustWordsPerMinute={(delta) => setWordsPerMinute((value) => clamp(value + delta, MIN_WPM, MAX_WPM))}
      onStart={handleStart}
    />
  );
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

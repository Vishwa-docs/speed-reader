import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { ReaderToken } from '../lib/types';

interface ReaderLaneProps {
  token: ReaderToken;
}

const PIVOT_POSITION_RATIO = 0.24;

export function ReaderLane({ token }: ReaderLaneProps) {
  const laneRef = useRef<HTMLDivElement>(null);
  const beforeRef = useRef<HTMLSpanElement>(null);
  const pivotRef = useRef<HTMLSpanElement>(null);
  const [translateX, setTranslateX] = useState(0);
  const wordParts = useMemo(() => splitTokenForDisplay(token), [token]);
  const wordStyle = {
    '--word-x': `${translateX}px`
  } as CSSProperties;

  useLayoutEffect(() => {
    const updateAlignment = () => {
      const laneWidth = laneRef.current?.getBoundingClientRect().width ?? 0;
      const beforeWidth = beforeRef.current?.getBoundingClientRect().width ?? 0;
      const pivotWidth = pivotRef.current?.getBoundingClientRect().width ?? 0;
      const targetPivotCenter = laneWidth * PIVOT_POSITION_RATIO;

      setTranslateX(targetPivotCenter - (beforeWidth + pivotWidth / 2));
    };

    updateAlignment();

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            updateAlignment();
          })
        : null;

    if (resizeObserver && laneRef.current) {
      resizeObserver.observe(laneRef.current);
    }

    document.fonts?.ready.then(() => {
      updateAlignment();
    });
    window.addEventListener('resize', updateAlignment);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateAlignment);
    };
  }, [wordParts.after, wordParts.before, wordParts.pivot]);

  return (
    <div className="reader-lane" ref={laneRef}>
      <div className="reader-lane__rails" aria-hidden="true" />
      <div className="reader-lane__pivot-guide" aria-hidden="true" />
      <div className="reader-lane__word" data-testid="lane-word" aria-label={token.text} style={wordStyle}>
        <span ref={beforeRef}>{wordParts.before}</span>
        <span className="reader-lane__pivot-letter" data-testid="pivot-letter" ref={pivotRef}>
          {wordParts.pivot}
        </span>
        <span>{wordParts.after}</span>
      </div>
    </div>
  );
}

function splitTokenForDisplay(token: ReaderToken) {
  const leading = token.text.match(/^[^A-Za-z0-9]*/)?.[0] ?? '';
  const trailing = token.text.match(/[^A-Za-z0-9]*$/)?.[0] ?? '';
  const core = token.text.slice(leading.length, token.text.length - trailing.length);
  const characters = [...(core || token.normalizedText)];
  const pivotIndex = Math.min(token.pivotIndex, Math.max(characters.length - 1, 0));
  const beforeCore = characters.slice(0, pivotIndex).join('');
  const pivot = characters[pivotIndex] ?? '';
  const afterCore = characters.slice(pivotIndex + 1).join('');

  return {
    before: `${leading}${beforeCore}`,
    pivot,
    after: `${afterCore}${trailing}`
  };
}

const SAMPLE_RATE = 16_000;
const DURATION_SECONDS = 6;

// Integer frequencies complete whole cycles in DURATION_SECONDS, so the loop has no seam.
// Kept in the 150-450 Hz range so laptop and phone speakers can actually reproduce them.
const STATION_TONES: Record<string, readonly [number, number, number]> = {
  'groove-salad': [196, 294, 392],
  'groove-salad-classic': [220, 330, 440],
  'drone-zone': [147, 220, 294]
};

export function createFocusFallbackUrl(stationId: string) {
  const sampleCount = SAMPLE_RATE * DURATION_SECONDS;
  const buffer = new ArrayBuffer(44 + sampleCount * 2);
  const view = new DataView(buffer);
  const tones = STATION_TONES[stationId] ?? STATION_TONES['groove-salad'];

  writeWaveHeader(view, sampleCount);

  let randomState = 0x12345678;
  let smoothedNoise = 0;

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / SAMPLE_RATE;
    const swell = 0.8 + 0.2 * Math.sin((2 * Math.PI * time) / DURATION_SECONDS);
    randomState = (randomState * 1664525 + 1013904223) >>> 0;
    const noise = randomState / 0xffffffff * 2 - 1;
    smoothedNoise += (noise - smoothedNoise) * 0.08;

    const pad =
      Math.sin(2 * Math.PI * tones[0] * time) * 0.22 +
      Math.sin(2 * Math.PI * tones[1] * time) * 0.14 +
      Math.sin(2 * Math.PI * tones[2] * time) * 0.1;
    const sample = Math.max(-1, Math.min(1, pad * swell + smoothedNoise * 0.12));

    view.setInt16(44 + index * 2, Math.round(sample * 0x7fff), true);
  }

  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
}

function writeWaveHeader(view: DataView, sampleCount: number) {
  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + sampleCount * 2, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, sampleCount * 2, true);
}

function writeAscii(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

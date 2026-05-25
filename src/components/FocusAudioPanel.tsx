export interface FocusStation {
  id: string;
  label: string;
  description: string;
  streamUrl: string;
}

interface FocusAudioPanelProps {
  stations: readonly FocusStation[];
  currentStationId: string;
  isPlaying: boolean;
  volume: number;
  onStationChange: (stationId: string) => void;
  onTogglePlayback: () => void;
  onVolumeChange: (volume: number) => void;
}

export function FocusAudioPanel({
  stations,
  currentStationId,
  isPlaying,
  volume,
  onStationChange,
  onTogglePlayback,
  onVolumeChange
}: FocusAudioPanelProps) {
  const currentStation = stations.find((station) => station.id === currentStationId) ?? stations[0];

  return (
    <section className="focus-audio" aria-label="Focus audio">
      <div>
        <p className="reader-shell__eyebrow">Focus audio</p>
        <strong>{currentStation.label}</strong>
        <p className="focus-audio__description">{currentStation.description}</p>
      </div>

      <div className="focus-audio__controls">
        <label className="focus-audio__label">
          <span>Station</span>
          <select value={currentStationId} onChange={(event) => onStationChange(event.target.value)}>
            {stations.map((station) => (
              <option key={station.id} value={station.id}>
                {station.label}
              </option>
            ))}
          </select>
        </label>

        <button className="ghost-button" type="button" onClick={onTogglePlayback}>
          {isPlaying ? 'Pause music' : 'Play music'}
        </button>

        <label className="focus-audio__label focus-audio__label--compact">
          <span>Volume</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(event) => onVolumeChange(Number(event.target.value))}
          />
        </label>
      </div>

      <p className="focus-audio__attribution">
        Streams courtesy of{' '}
        <a href="https://somafm.com/" target="_blank" rel="noopener noreferrer">
          SomaFM
        </a>
        {' '}— commercial-free, listener-supported radio.{' '}
        <a href="https://somafm.com/support/" target="_blank" rel="noopener noreferrer">
          Please donate
        </a>
        .
      </p>
    </section>
  );
}

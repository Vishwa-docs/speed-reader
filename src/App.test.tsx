import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    vi.useRealTimers();
    window.localStorage.clear();
  });

  it('accepts a local txt file and enters reader mode', async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByLabelText(/upload a txt or pdf/i);
    await user.upload(input, makeTextFile('Read faster now.'));

    await waitFor(() => {
      expect(screen.getByText(/sample.txt loaded/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /start reading/i }));

    expect(screen.getByTestId('lane-word')).toHaveTextContent('Read');
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
  });

  it('advances through words based on playback timing', async () => {
    const user = userEvent.setup();

    render(<App />);

    const input = screen.getByLabelText(/upload a txt or pdf/i);
    await user.upload(input, makeTextFile('Read faster now.'));

    await waitFor(() => {
      expect(screen.getByText(/sample.txt loaded/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /start reading/i }));
    expect(screen.getByTestId('lane-word')).toHaveTextContent('Read');

    await waitFor(() => {
      expect(screen.getByTestId('lane-word')).toHaveTextContent('faster');
    });

    await waitFor(() => {
      expect(screen.getByTestId('lane-word')).toHaveTextContent('now.');
    });
  }, 10000);

  it('marks the current point and shows saved context in the highlights panel', async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByLabelText(/upload a txt or pdf/i);
    await user.upload(input, makeTextFile('Read faster now and keep this point for context review.'));

    await waitFor(() => {
      expect(screen.getByText(/sample.txt loaded/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /start reading/i }));
    await waitFor(() => {
      expect(screen.getByTestId('lane-word')).toHaveTextContent('keep');
    });
    await user.click(screen.getByRole('button', { name: /pause/i }));
    await user.click(screen.getByRole('button', { name: /mark point/i }));
    await user.click(screen.getByRole('button', { name: /highlights/i }));

    await waitFor(() => {
      const card = screen.getByRole('button', { name: /keep/i }).closest('article');
      expect(card).toHaveTextContent('Read faster now and');
      expect(card).toHaveTextContent('keep');
      expect(card).toHaveTextContent('this point for context review.');
    });
  });

  it('falls back to local ambient audio when the radio stream cannot play', async () => {
    const user = userEvent.setup();
    const play = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockRejectedValueOnce(new DOMException('Unsupported source', 'NotSupportedError'))
      .mockResolvedValueOnce();
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
    Object.defineProperties(URL, {
      createObjectURL: { configurable: true, value: vi.fn(() => 'blob:focus-audio') },
      revokeObjectURL: { configurable: true, value: vi.fn() }
    });

    render(<App />);
    await user.upload(screen.getByLabelText(/upload a txt or pdf/i), makeTextFile('Read faster now.'));
    await screen.findByText(/sample.txt loaded/i);
    await user.click(screen.getByRole('button', { name: /start reading/i }));
    await user.click(screen.getByRole('button', { name: /play music/i }));

    await waitFor(() => {
      expect(play).toHaveBeenCalledTimes(2);
      expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
      expect(screen.getByRole('status')).toHaveTextContent(/local ambient fallback/i);
    });

    expect(document.querySelector('audio')).toHaveAttribute('src', 'blob:focus-audio');
  });

  it('falls back to local ambient audio when the radio stream stalls', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const play = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockReturnValueOnce(new Promise<void>(() => undefined))
      .mockResolvedValueOnce();
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
    Object.defineProperties(URL, {
      createObjectURL: { configurable: true, value: vi.fn(() => 'blob:focus-audio') },
      revokeObjectURL: { configurable: true, value: vi.fn() }
    });

    try {
      render(<App />);
      await user.upload(screen.getByLabelText(/upload a txt or pdf/i), makeTextFile('Read faster now.'));
      await screen.findByText(/sample.txt loaded/i);
      await user.click(screen.getByRole('button', { name: /start reading/i }));
      await user.click(screen.getByRole('button', { name: /play music/i }));

      expect(play).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(8000);

      await waitFor(() => {
        expect(play).toHaveBeenCalledTimes(2);
        expect(screen.getByRole('status')).toHaveTextContent(/local ambient fallback/i);
      });
    } finally {
      vi.useRealTimers();
    }
  });
});

function makeTextFile(contents: string) {
  const file = new File([contents], 'sample.txt', {
    type: 'text/plain'
  });

  Object.defineProperty(file, 'text', {
    value: async () => contents
  });

  return file;
}

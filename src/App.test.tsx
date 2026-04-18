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

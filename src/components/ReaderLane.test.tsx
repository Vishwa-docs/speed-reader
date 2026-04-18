import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReaderLane } from './ReaderLane';

describe('ReaderLane', () => {
  it('renders the pivot character separately so it can stay aligned', () => {
    render(
      <ReaderLane
        token={{
          text: 'focus',
          normalizedText: 'focus',
          pivotIndex: 1,
          pauseKind: 'none',
          pauseMultiplier: 1,
          blockIndex: 0
        }}
      />
    );

    expect(screen.getByTestId('pivot-letter')).toHaveTextContent('o');
    expect(screen.getByTestId('lane-word')).toHaveTextContent('focus');
  });
});

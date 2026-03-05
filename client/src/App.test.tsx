import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

it('renders title', () => {
  render(<App />);
  expect(screen.getByText(/Mathable/i)).toBeDefined();
});

describe('board rendering', () => {
  it('shows 16 tiles after round start', async () => {
    render(<App />);
    const tiles = await screen.findAllByTestId('tile');
    expect(tiles.length).toBe(16);
  });
});

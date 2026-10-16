import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CopyAddressButton } from './CopyAddressButton';

describe('CopyAddressButton', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(),
      },
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('copies the full, untruncated address, announces Copied! in a live region, then resets', async () => {
    const writeTextMock = vi.mocked(navigator.clipboard.writeText).mockResolvedValue(undefined);
    const fullAddress = 'G' + 'A'.repeat(55);

    render(<CopyAddressButton address={fullAddress} />);

    const button = screen.getByRole('button', { name: `Copy address ${fullAddress}` });
    expect(button).toHaveTextContent('Copy');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();

    await act(async () => {
      fireEvent.click(button);
    });

    expect(writeTextMock).toHaveBeenCalledWith(fullAddress);
    expect(button).toHaveTextContent('Copied!');
    // The accessible name follows the visible text instead of staying stale.
    expect(screen.getByRole('button', { name: 'Copied!' })).toBe(button);
    expect(screen.getByRole('status')).toHaveTextContent('Address copied to clipboard.');

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(button).toHaveTextContent('Copy');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('shows an error state and announces it if the clipboard write rejects', async () => {
    const writeTextMock = vi
      .mocked(navigator.clipboard.writeText)
      .mockRejectedValue(new Error('Denied'));
    const fullAddress = 'G' + 'B'.repeat(55);

    render(<CopyAddressButton address={fullAddress} />);

    const button = screen.getByRole('button', { name: `Copy address ${fullAddress}` });

    await act(async () => {
      fireEvent.click(button);
    });

    expect(writeTextMock).toHaveBeenCalledWith(fullAddress);
    expect(button).toHaveTextContent('Copy failed');
    expect(screen.getByRole('status')).toHaveTextContent('Could not copy the address');

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(button).toHaveTextContent('Copy');
  });

  it('clears the reset timer on unmount', async () => {
    vi.mocked(navigator.clipboard.writeText).mockResolvedValue(undefined);

    const { unmount } = render(<CopyAddressButton address="GABC" />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    expect(vi.getTimerCount()).toBe(1);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});

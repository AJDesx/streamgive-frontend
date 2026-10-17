import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useLatestRequest } from './useLatestRequest';

describe('useLatestRequest', () => {
  it('only the most recently begun request is current, and older ones are aborted', () => {
    const { result } = renderHook(() => useLatestRequest());

    const first = result.current.begin();
    const second = result.current.begin();

    expect(first.isCurrent()).toBe(false);
    expect(first.signal.aborted).toBe(true);
    expect(second.isCurrent()).toBe(true);
    expect(second.signal.aborted).toBe(false);
  });

  it('lets the latest of two out-of-order requests win', async () => {
    const { result } = renderHook(() => useLatestRequest());
    let shown: string | null = null;

    function load(label: string, delayMs: number) {
      const request = result.current.begin();
      return new Promise<void>((resolve) => setTimeout(resolve, delayMs)).then(() => {
        if (request.isCurrent()) shown = label;
      });
    }

    // The older request is slower, so it settles after the newer one.
    await Promise.all([load('old', 20), load('new', 0)]);

    expect(shown).toBe('new');
  });

  it('cancels the in-flight request on unmount', () => {
    const { result, unmount } = renderHook(() => useLatestRequest());
    const request = result.current.begin();

    unmount();

    expect(request.isCurrent()).toBe(false);
    expect(request.signal.aborted).toBe(true);
  });
});

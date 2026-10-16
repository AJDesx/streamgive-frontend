import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EmbedAutoResizer } from './EmbedAutoResizer';

describe('EmbedAutoResizer', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('posts streamgive:resize to window.parent on mount', () => {
    const postMessageSpy = vi.spyOn(window.parent, 'postMessage');

    render(
      <EmbedAutoResizer>
        <div style={{ height: 420 }}>Content</div>
      </EmbedAutoResizer>,
    );

    expect(postMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'streamgive:resize',
        height: expect.any(Number),
      }),
      '*',
    );
  });

  it('posts updated height when ResizeObserver detects a change', () => {
    let observerCallback: ResizeObserverCallback | undefined;

    class MockResizeObserver {
      constructor(cb: ResizeObserverCallback) {
        observerCallback = cb;
      }
      observe = vi.fn();
      disconnect = vi.fn();
      unobserve = vi.fn();
    }

    vi.stubGlobal('ResizeObserver', MockResizeObserver);

    const postMessageSpy = vi.spyOn(window.parent, 'postMessage');

    render(
      <EmbedAutoResizer>
        <div>Content</div>
      </EmbedAutoResizer>,
    );

    expect(observerCallback).toBeDefined();

    // Trigger resize observer callback
    observerCallback!(
      [
        {
          borderBoxSize: [{ blockSize: 580, inlineSize: 400 }],
          contentRect: { height: 580 } as DOMRectReadOnly,
          target: document.createElement('div'),
        } as unknown as ResizeObserverEntry,
      ],
      {} as ResizeObserver,
    );

    expect(postMessageSpy).toHaveBeenLastCalledWith(
      {
        type: 'streamgive:resize',
        height: 580,
      },
      '*',
    );
  });
});

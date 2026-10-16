'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Automatically measures the widget's content height and posts
 * `{ type: 'streamgive:resize', height }` to the parent window so host pages
 * can resize their embed <iframe> without scrollbars or layout gaps.
 */
export function EmbedAutoResizer({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.parent) return;

    const postHeight = (h?: number) => {
      const height =
        typeof h === 'number' && h > 0
          ? Math.ceil(h)
          : Math.ceil(
              containerRef.current?.getBoundingClientRect().height ??
                document.documentElement.scrollHeight,
            );
      window.parent.postMessage({ type: 'streamgive:resize', height }, '*');
    };

    postHeight();

    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const blockSize = entry.borderBoxSize?.[0]?.blockSize;
          postHeight(blockSize ?? entry.contentRect.height);
        }
      });
      observer.observe(containerRef.current);
      return () => {
        observer.disconnect();
      };
    }
  }, []);

  return <div ref={containerRef}>{children}</div>;
}

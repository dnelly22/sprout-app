import { useSyncExternalStore } from 'react';

/*
 * Tablet breakpoint. The app is inline-styled (no CSS classes to hang media
 * queries on), so screens read this hook and widen their layout on iPad —
 * multi-column grids and a comfortable centered content width instead of a
 * phone column. 768px is the iPad-portrait threshold.
 */
const QUERY = '(min-width: 768px)';

function subscribe(cb: () => void): () => void {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

export function useIsTablet(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false, // SSR/first paint: assume phone
  );
}

/** Comfortable max content width for a centered column on tablet. */
export const TABLET_CONTENT = 900;

/*
 * Spread onto a screen's root element. Its background (dots) still fills the
 * full iPad width, but the content is centred to TABLET_CONTENT via horizontal
 * padding. On phones the padding computes to 0, so it's a no-op — safe to add
 * to any screen root.
 */
export const centeredOnTablet = {
  paddingInline: `max(0px, calc((100% - ${TABLET_CONTENT}px) / 2))`,
} as const;

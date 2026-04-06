/**
 * Open store URL — MRAID-aware with fallbacks
 * Order of preference:
 *   1. MRAID `mraid.open(url)` — required by ad networks (AdMob, AppLovin, IronSource, Facebook)
 *   2. window.open(url) — desktop browsers
 *   3. location.href — iOS Safari fallback when window.open is blocked
 */
export function openUrl(url) {
  // 1. MRAID (preferred for playable ads in real ad placements)
  try {
    if (typeof mraid !== 'undefined' && typeof mraid.open === 'function') {
      mraid.open(url);
      return;
    }
  } catch (_) { /* fall through */ }

  // 2. window.open (desktop, dev preview)
  try {
    const w = window.open(url, '_blank');
    if (w && !w.closed && typeof w.closed !== 'undefined') return;
  } catch (_) { /* fall through */ }

  // 3. location.href (iOS Safari, popup blocked)
  location.href = url;
}

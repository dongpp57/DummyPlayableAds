/**
 * Open store URL — handles iOS Safari window.open blocking
 */
export function openUrl(url) {
  try {
    const w = window.open(url, '_blank');
    if (!w || w.closed || typeof w.closed === 'undefined') {
      location.href = url;
    }
  } catch (_) {
    location.href = url;
  }
}

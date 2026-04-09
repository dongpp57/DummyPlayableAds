/**
 * Simple concurrent-safe audio helper for playable ads.
 *
 * Usage:
 *   import { loadSounds, play, setMuted, isMuted } from './sound.js';
 *   await loadSounds({ tap: tapUrl, chip: chipUrl });
 *   play('tap');                        // single instance (interrupts if still playing)
 *   play('chip', { concurrent: true }); // clones to allow overlapping
 *   setMuted(true);
 *
 * Browser autoplay policy: audio stays locked until the first user
 * gesture. Call `unlock()` once from a pointerdown handler to unlock.
 */

const sounds = {};
let muted = false;
let unlocked = false;

/** Preload audio elements for every url. Keys become play() ids. */
export async function loadSounds(map) {
  const entries = Object.entries(map);
  await Promise.all(entries.map(([key, url]) => {
    return new Promise((resolve) => {
      const a = new Audio(url);
      a.preload = 'auto';
      a.addEventListener('canplaythrough', () => resolve(), { once: true });
      a.addEventListener('error', () => resolve(), { once: true }); // resolve anyway
      sounds[key] = a;
    });
  }));
}

/** Play a preloaded sound. Safe to call before user gesture (no-op until unlocked). */
export function play(key, opts = {}) {
  if (muted || !unlocked) return;
  const base = sounds[key];
  if (!base) return;
  try {
    if (opts.concurrent) {
      // Clone so multiple calls can overlap
      const clone = base.cloneNode(true);
      clone.volume = opts.volume != null ? opts.volume : 1;
      clone.play().catch(() => {});
    } else {
      base.pause();
      base.currentTime = 0;
      base.volume = opts.volume != null ? opts.volume : 1;
      base.play().catch(() => {});
    }
  } catch (_) {}
}

/** Unlock audio after the first user gesture (iOS/Safari requires this). */
export function unlock() {
  if (unlocked) return;
  unlocked = true;
  // Touch every preloaded sound so the browser counts them as user-initiated
  Object.values(sounds).forEach((a) => {
    try {
      a.play().then(() => { a.pause(); a.currentTime = 0; }).catch(() => {});
    } catch (_) {}
  });
}

export function setMuted(value) {
  muted = !!value;
  if (muted) {
    // Stop anything currently playing
    Object.values(sounds).forEach((a) => { try { a.pause(); } catch (_) {} });
  }
}

export function isMuted() {
  return muted;
}

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
  // Touch every preloaded sound so the browser counts them as user-initiated.
  // Skip BGM — it will be started separately by playBgm() right after unlock.
  Object.entries(sounds).forEach(([key, a]) => {
    if (key === 'bgm') return; // don't touch-and-pause the BGM track
    try {
      a.play().then(() => { a.pause(); a.currentTime = 0; }).catch(() => {});
    } catch (_) {}
  });
}

/** Play a sound as looping background music at low volume. Returns stop function. */
let activeBgm = null;
export function playBgm(key, volume = 0.15) {
  if (muted || !unlocked) return;
  const base = sounds[key];
  if (!base) return;
  try {
    base.loop = true;
    base.volume = volume;
    base.currentTime = 0;
    base.play().catch(() => {});
    activeBgm = base;
  } catch (_) {}
}

export function stopBgm() {
  if (activeBgm) {
    try { activeBgm.pause(); activeBgm.currentTime = 0; } catch (_) {}
    activeBgm = null;
  }
}

export function setMuted(value) {
  muted = !!value;
  if (muted) {
    // Stop anything currently playing (SFX + BGM)
    Object.values(sounds).forEach((a) => { try { a.pause(); } catch (_) {} });
    activeBgm = null;
  } else if (activeBgm) {
    // If BGM was playing when muted, don't auto-resume — user must re-trigger
    activeBgm = null;
  }
}

export function isMuted() {
  return muted;
}

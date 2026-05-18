/**
 * Sound Manager
 *
 * Singleton that loads all game sound effects via Howler.js and exposes
 * a single `playSound(id)` function. Safe to call before sounds have loaded
 * (Howler queues playback internally). Silently skips if the placeholder
 * file is empty / not a valid audio file.
 */

import { Howl, Howler } from 'howler';

// =============================================================================
// VOLUME PERSISTENCE
// =============================================================================

const VOLUME_STORAGE_KEY = 'splendubious_volumes';

function loadStoredVolumes(): { master: number; music: number; sfx: number } {
  try {
    const raw = localStorage.getItem(VOLUME_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as { master: number; music: number; sfx: number };
  } catch { /* ignore */ }
  return { master: 1.0, music: 0.3, sfx: 1.0 };
}

function saveVolumes(): void {
  try {
    localStorage.setItem(
      VOLUME_STORAGE_KEY,
      JSON.stringify({ master: masterVolume, music: musicVolumeLevel, sfx: sfxVolume })
    );
  } catch { /* ignore */ }
}

const _stored = loadStoredVolumes();
let masterVolume = _stored.master;
let musicVolumeLevel = _stored.music;
let sfxVolume = _stored.sfx;

// Apply stored master volume immediately
Howler.volume(masterVolume);

// Background music — loops for the lifetime of the app.
// Playback must be started after a user gesture to satisfy browser autoplay policy.
const bgMusic = new Howl({
  src: ['/sounds/background_music.mp3'],
  loop: true,
  volume: musicVolumeLevel,
});

let bgStarted = false;

export function startBackgroundMusic(): void {
  if (bgStarted) return;
  bgStarted = true;
  try {
    bgMusic.play();
  } catch {
    // Silently ignore errors from missing / invalid audio files
  }
}

export type SoundId =
  | 'gem-take'
  | 'gem-discard'
  | 'card-purchase'
  | 'card-reserve'
  | 'card-flip'
  | 'noble'
  | 'your-turn'
  | 'player-win'
  | 'player-lose'
  | 'select-click';

const BASE_SFX_VOLUMES: Record<SoundId, number> = {
  'gem-take': 0.6,
  'gem-discard': 0.6,
  'card-purchase': 0.7,
  'card-reserve': 0.6,
  'card-flip': 0.6,
  'noble': 0.8,
  'your-turn': 0.7,
  'player-win': 0.9,
  'player-lose': 0.9,
  'select-click': 0.5,
};

const sounds: Record<SoundId, Howl> = {
  'gem-take': new Howl({ src: ['/sounds/take-coins.mp3'], volume: BASE_SFX_VOLUMES['gem-take'] * sfxVolume }),
  'gem-discard': new Howl({ src: ['/sounds/gem-discard.mp3'], volume: BASE_SFX_VOLUMES['gem-discard'] * sfxVolume }),
  'card-purchase': new Howl({ src: ['/sounds/purchase-card.mp3'], volume: BASE_SFX_VOLUMES['card-purchase'] * sfxVolume }),
  'card-reserve': new Howl({ src: ['/sounds/reserve-card.mp3'], volume: BASE_SFX_VOLUMES['card-reserve'] * sfxVolume }),
  'card-flip': new Howl({ src: ['/sounds/card-flip.mp3'], volume: BASE_SFX_VOLUMES['card-flip'] * sfxVolume }),
  'noble': new Howl({ src: ['/sounds/noble.mp3'], volume: BASE_SFX_VOLUMES['noble'] * sfxVolume }),
  'your-turn': new Howl({ src: ['/sounds/your-turn.mp3'], volume: BASE_SFX_VOLUMES['your-turn'] * sfxVolume }),
  'player-win': new Howl({ src: ['/sounds/player-win.mp3'], volume: BASE_SFX_VOLUMES['player-win'] * sfxVolume }),
  'player-lose': new Howl({ src: ['/sounds/player-lose.mp3'], volume: BASE_SFX_VOLUMES['player-lose'] * sfxVolume }),
  'select-click': new Howl({ src: ['/sounds/select-click.mp3'], volume: BASE_SFX_VOLUMES['select-click'] * sfxVolume }),
};

export function playSound(id: SoundId): void {
  try {
    sounds[id].play();
  } catch {
    // Silently ignore errors from empty placeholder files
  }
}

// =============================================================================
// VOLUME CONTROLS
// =============================================================================

export function setMasterVolume(v: number): void {
  masterVolume = v;
  Howler.volume(v);
  saveVolumes();
}

export function setMusicVolume(v: number): void {
  musicVolumeLevel = v;
  bgMusic.volume(v);
  saveVolumes();
}

export function setSfxVolume(v: number): void {
  sfxVolume = v;
  (Object.keys(sounds) as SoundId[]).forEach((id) => {
    sounds[id].volume(BASE_SFX_VOLUMES[id] * v);
  });
  saveVolumes();
}

export function getVolumes(): { master: number; music: number; sfx: number } {
  return { master: masterVolume, music: musicVolumeLevel, sfx: sfxVolume };
}

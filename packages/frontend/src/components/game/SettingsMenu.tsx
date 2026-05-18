/**
 * SettingsMenu Component
 *
 * Cog wheel button that opens a dropdown with Settings and How To Play options.
 */

import { useState, useRef, useEffect } from 'react';
import { getVolumes, setMasterVolume, setMusicVolume, setSfxVolume } from '../../sound/manager.js';

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function SettingsMenu(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [dialog, setDialog] = useState<'settings' | 'howtoplay' | null>(null);
  const [volumes, setVolumes] = useState(getVolumes);
  const [htpPage, setHtpPage] = useState(1);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const openDialog = (d: 'settings' | 'howtoplay') => {
    setDialog(d);
    setHtpPage(1);
    setIsOpen(false);
  };

  const handleMasterVolume = (v: number) => {
    setMasterVolume(v);
    setVolumes((prev) => ({ ...prev, master: v }));
  };

  const handleMusicVolume = (v: number) => {
    setMusicVolume(v);
    setVolumes((prev) => ({ ...prev, music: v }));
  };

  const handleSfxVolume = (v: number) => {
    setSfxVolume(v);
    setVolumes((prev) => ({ ...prev, sfx: v }));
  };

  return (
    <>
      <div className="settings-menu" ref={menuRef}>
        <button
          className={`settings-cog-btn${isOpen ? ' active' : ''}`}
          onClick={() => setIsOpen((o) => !o)}
          aria-label="Open settings menu"
          aria-expanded={isOpen}
        >
          <img src="/settings/settings-icon.png" alt="Settings" className="settings-icon-img" />
        </button>

        {isOpen && (
          <div className="settings-dropdown">
            <button className="settings-dropdown-item" onClick={() => openDialog('settings')}>
              <span className="settings-dropdown-icon">⚙️</span>
              Settings
            </button>
            <button className="settings-dropdown-item" onClick={() => openDialog('howtoplay')}>
              <span className="settings-dropdown-icon">📖</span>
              How To Play
            </button>
          </div>
        )}
      </div>

      {/* Settings dialog — rendered outside the menu div to avoid z-index clipping */}
      {dialog === 'settings' && (
        <div className="settings-dialog-overlay" onClick={() => setDialog(null)}>
          <div className="settings-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="settings-dialog-header">
              <h2>Settings</h2>
              <button className="dialog-close-btn" onClick={() => setDialog(null)} aria-label="Close">
                ✕
              </button>
            </div>
            <div className="settings-dialog-body">
              <VolumeSlider label="Master Volume" value={volumes.master} onChange={handleMasterVolume} />
              <VolumeSlider label="Music Volume" value={volumes.music} onChange={handleMusicVolume} />
              <VolumeSlider label="Sound Effects" value={volumes.sfx} onChange={handleSfxVolume} />
            </div>
          </div>
        </div>
      )}

      {/* How To Play dialog */}
      {dialog === 'howtoplay' && (
        <div className="settings-dialog-overlay" onClick={() => setDialog(null)}>
          <div
            className="settings-dialog settings-dialog--howtoplay"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="settings-dialog-header">
              <h2>How To Play</h2>
              <button className="dialog-close-btn" onClick={() => setDialog(null)} aria-label="Close">
                ✕
              </button>
            </div>
            <div className="settings-dialog-body howtoplay-body">
              <img
                key={htpPage}
                src={`/settings/howtoplay${htpPage}.png`}
                alt={`How to play – page ${htpPage} of 2`}
                className="howtoplay-image"
              />
              <div className="howtoplay-nav">
                <button
                  className="howtoplay-nav-btn"
                  onClick={() => setHtpPage(1)}
                  disabled={htpPage === 1}
                  aria-label="Previous page"
                >
                  ← Previous
                </button>
                <span className="howtoplay-nav-indicator">{htpPage} / 2</span>
                <button
                  className="howtoplay-nav-btn"
                  onClick={() => setHtpPage(2)}
                  disabled={htpPage === 2}
                  aria-label="Next page"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// =============================================================================
// VOLUME SLIDER
// =============================================================================

interface VolumeSliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
}

function VolumeSlider({ label, value, onChange }: VolumeSliderProps): JSX.Element {
  return (
    <div className="volume-slider-row">
      <label className="volume-slider-label">{label}</label>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="volume-slider"
        aria-label={label}
      />
      <span className="volume-slider-value">{Math.round(value * 100)}%</span>
    </div>
  );
}



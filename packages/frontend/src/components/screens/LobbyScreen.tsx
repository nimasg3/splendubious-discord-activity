/**
 * Lobby Screen Component
 *
 * Pre-game lobby showing players and game settings.
 */

import { useState } from 'react';
import { useGame } from '../../context';
import { SettingsMenu } from '../game/index.js';

const PLAYER_COLORS = [
  { label: 'Red',    value: '#c0392b' },
  { label: 'Blue',   value: '#2471a3' },
  { label: 'Green',  value: '#1e8449' },
  { label: 'Yellow', value: '#d4ac0d' },
  { label: 'Purple', value: '#7d3c98' },
  { label: 'Orange', value: '#ca6f1e' },
];

const MAX_PLAYERS = 4;
const MAX_SPECTATORS = 4;

function getDiscordAvatarUrl(userId: string, avatarHash: string): string {
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=64`;
}

export function LobbyScreen(): JSX.Element {
  const { state, startGame, leaveRoom, updatePlayerName, updatePlayerColor, switchRole } = useGame();
  const [isStarting, setIsStarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  const { room, isHost, user } = state;

  const handleStartGame = async () => {
    setIsStarting(true);
    try {
      await startGame(players.length as 2 | 3 | 4);
    } catch (error) {
      console.error('Failed to start game:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleCopyCode = async () => {
    if (room?.id) {
      try {
        await navigator.clipboard.writeText(room.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

  const handleLeave = async () => {
    try {
      await leaveRoom();
    } catch (error) {
      console.error('Failed to leave room:', error);
    }
  };

  const handleStartEditName = () => {
    const currentName = room?.players.find(p => p.id === user?.id)?.name || '';
    setEditedName(currentName);
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (editedName.trim()) {
      try {
        await updatePlayerName(editedName.trim());
      } catch (error) {
        console.error('Failed to update name:', error);
      }
    }
    setIsEditingName(false);
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditedName('');
  };

  const handleColorChange = async (color: string) => {
    try {
      await updatePlayerColor(color);
    } catch (error) {
      console.error('Failed to update color:', error);
    }
  };

  const handleSwitchRole = async (asSpectator: boolean) => {
    try {
      await switchRole(asSpectator);
    } catch (error) {
      console.error('Failed to switch role:', error);
    }
  };

  if (!room) {
    return (
      <div className="lobby-screen">
        <p>Loading room...</p>
      </div>
    );
  }

  const players    = room.players.filter(p => !p.isSpectator);
  const spectators = room.players.filter(p => p.isSpectator);
  const myPlayer   = room.players.find(p => p.id === user?.id);
  const amSpectator = myPlayer?.isSpectator ?? false;
  const canStart = isHost && players.length >= 2 && players.length <= 4;

  const takenColors = new Set(
    players.filter(p => p.id !== user?.id).map(p => p.color)
  );

  // Render a single filled player slot
  const renderPlayerSlot = (player: typeof players[0]) => {
    const isMe = player.id === user?.id;
    return (
      <li key={player.id} className={`lobby-slot filled ${isMe ? 'local' : ''}`}>
        <div className="slot-identity">
          {player.avatarHash && (
            <img
              className="player-avatar"
              src={getDiscordAvatarUrl(player.id, player.avatarHash)}
              alt={player.name}
            />
          )}
          <span className="slot-name">
            {isMe && isEditingName ? (
              <span className="name-edit-container">
                <input
                  type="text"
                  className="name-input"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') handleCancelEditName();
                  }}
                  autoFocus
                  maxLength={20}
                />
                <button className="btn btn-tiny btn-primary" onClick={handleSaveName}>✓</button>
                <button className="btn btn-tiny btn-secondary" onClick={handleCancelEditName}>✗</button>
              </span>
            ) : (
              <>
                {player.name}
                {player.id === room.hostId && <span className="host-badge">Host</span>}
                {isMe && (
                  <>
                    <span className="you-badge">You</span>
                    <button
                      className="btn btn-tiny btn-secondary edit-name-btn"
                      onClick={handleStartEditName}
                      title="Edit name"
                    >
                      ✎
                    </button>
                  </>
                )}
              </>
            )}
          </span>
        </div>

        {/* Color picker for self; read-only dot for others */}
        {isMe ? (
          <div className="player-color-picker">
            {PLAYER_COLORS.map(({ label, value }) => {
              const taken = takenColors.has(value);
              const selected = myPlayer?.color === value;
              return (
                <button
                  key={value}
                  className={`color-swatch ${selected ? 'selected' : ''} ${taken ? 'taken' : ''}`}
                  style={{ backgroundColor: value }}
                  title={taken ? `${label} (taken)` : label}
                  disabled={taken}
                  onClick={() => !taken && handleColorChange(value)}
                  aria-label={label}
                />
              );
            })}
          </div>
        ) : (
          <div
            className="player-color-dot"
            style={{ backgroundColor: player.color }}
            title={PLAYER_COLORS.find(c => c.value === player.color)?.label ?? player.color}
          />
        )}
      </li>
    );
  };

  // Render a single filled spectator slot
  const renderSpectatorSlot = (spectator: typeof spectators[0]) => {
    const isMe = spectator.id === user?.id;
    return (
      <li key={spectator.id} className={`lobby-slot filled ${isMe ? 'local' : ''}`}>
        <div className="slot-identity">
          {spectator.avatarHash && (
            <img
              className="player-avatar"
              src={getDiscordAvatarUrl(spectator.id, spectator.avatarHash)}
              alt={spectator.name}
            />
          )}
          <span className="slot-name">
            {spectator.name}
            {isMe && <span className="you-badge">You</span>}
          </span>
        </div>
      </li>
    );
  };

  return (
    <div className="lobby-screen">
      <div className="screen-settings-corner">
        <SettingsMenu />
      </div>
      <div className="lobby-content">
        {/* Room header */}
        <div className="lobby-header">
          <h2>Game Lobby</h2>
          <div className="room-code-section">
            <span className="room-code-label">Room Code:</span>
            <span className="room-code" style={{ fontFamily: 'monospace' }}>{room.id}</span>
            <button
              className="btn btn-small btn-secondary"
              onClick={handleCopyCode}
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="lobby-sections">
          {/* Players section */}
          <div className="lobby-section">
            <h3 className="section-heading">
              <span className="section-icon">♟</span>
              Players
              <span className="section-count">{players.length}/{MAX_PLAYERS}</span>
            </h3>
            <ul className="lobby-slots-list">
              {players.map(renderPlayerSlot)}

              {/* Empty slots */}
              {Array.from({ length: MAX_PLAYERS - players.length }).map((_, i) => {
                const isJoinSlot = i === 0 && amSpectator;
                return (
                  <li
                    key={`empty-player-${i}`}
                    className={`lobby-slot empty ${isJoinSlot ? 'join-slot' : ''}`}
                    onClick={isJoinSlot ? () => handleSwitchRole(false) : undefined}
                    role={isJoinSlot ? 'button' : undefined}
                    tabIndex={isJoinSlot ? 0 : undefined}
                    onKeyDown={isJoinSlot ? (e) => e.key === 'Enter' && handleSwitchRole(false) : undefined}
                  >
                    {isJoinSlot ? (
                      <>
                        <span className="plus-icon">+</span>
                        <span className="join-label">Join as Player</span>
                      </>
                    ) : (
                      <span className="empty-slot-dash">—</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Spectators section */}
          <div className="lobby-section">
            <h3 className="section-heading">
              <span className="section-icon">👁</span>
              Spectators
              <span className="section-count">{spectators.length}/{MAX_SPECTATORS}</span>
            </h3>
            <ul className="lobby-slots-list">
              {spectators.map(renderSpectatorSlot)}

              {/* Empty slots */}
              {Array.from({ length: MAX_SPECTATORS - spectators.length }).map((_, i) => {
                const isJoinSlot = i === 0 && !amSpectator;
                return (
                  <li
                    key={`empty-spectator-${i}`}
                    className={`lobby-slot empty ${isJoinSlot ? 'join-slot' : ''}`}
                    onClick={isJoinSlot ? () => handleSwitchRole(true) : undefined}
                    role={isJoinSlot ? 'button' : undefined}
                    tabIndex={isJoinSlot ? 0 : undefined}
                    onKeyDown={isJoinSlot ? (e) => e.key === 'Enter' && handleSwitchRole(true) : undefined}
                  >
                    {isJoinSlot ? (
                      <>
                        <span className="plus-icon">+</span>
                        <span className="join-label">Join as Spectator</span>
                      </>
                    ) : (
                      <span className="empty-slot-dash">—</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Not host message */}
        {!isHost && (
          <div className="waiting-section">
            <p>Waiting for host to start the game...</p>
          </div>
        )}

        {/* Actions */}
        <div className="lobby-actions">
          <button
            className="btn btn-secondary"
            onClick={handleLeave}
          >
            Leave Lobby
          </button>

          {isHost && (
            <button
              className="btn btn-primary"
              onClick={handleStartGame}
              disabled={!canStart || isStarting}
            >
              {isStarting ? 'Starting...' : `Start Game (${players.length} players)`}
            </button>
          )}
        </div>

        {isHost && players.length < 2 && (
          <p className="waiting-message">
            Need at least {2 - players.length} more player(s) to start.
          </p>
        )}
        {isHost && players.length > 4 && (
          <p className="waiting-message" style={{ color: 'var(--error)' }}>
            Too many players — maximum is 4.
          </p>
        )}
      </div>
    </div>
  );
}


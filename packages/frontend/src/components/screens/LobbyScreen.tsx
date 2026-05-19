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

function getDiscordAvatarUrl(userId: string, avatarHash: string): string {
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=64`;
}

export function LobbyScreen(): JSX.Element {
  const { state, startGame, leaveRoom, updatePlayerName, updatePlayerColor } = useGame();
  const [isStarting, setIsStarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  const { room, isHost, user } = state;

  const handleStartGame = async () => {
    setIsStarting(true);
    try {
      await startGame(activePlayers as 2 | 3 | 4);
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
    if (editedName.trim() && editedName.trim() !== user?.globalName) {
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

  if (!room) {
    return (
      <div className="lobby-screen">
        <p>Loading room...</p>
      </div>
    );
  }

  const activePlayers = room.players.filter(p => !p.isSpectator).length;
  const canStart = isHost && activePlayers >= 2 && activePlayers <= 4;

  // Colors taken by other players
  const myPlayer = room.players.find(p => p.id === user?.id);
  const takenColors = new Set(
    room.players.filter(p => p.id !== user?.id).map(p => p.color)
  );

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

        {/* Players list */}
        <div className="players-section">
          <h3>Players ({activePlayers}/4)</h3>
          <ul className="players-list">
            {room.players.map((player) => {
              const isMe = player.id === user?.id;
              return (
                <li 
                  key={player.id} 
                  className={`player-item ${isMe ? 'local' : ''} ${player.isSpectator ? 'spectator' : ''}`}
                >
                  {player.avatarHash && (
                    <img
                      className="player-avatar"
                      src={getDiscordAvatarUrl(player.id, player.avatarHash)}
                      alt={player.name}
                    />
                  )}
                  <span className="player-name">
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

                  {/* Color picker — editable only for local player */}
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
            })}
          </ul>
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
              {isStarting ? 'Starting...' : `Start Game (${activePlayers} players)`}
            </button>
          )}
        </div>

        {/* Waiting for players message */}
        {isHost && activePlayers < 2 && (
          <p className="waiting-message">
            Waiting for {2 - activePlayers} more player(s)...
          </p>
        )}
        {isHost && activePlayers > 4 && (
          <p className="waiting-message" style={{ color: 'var(--error)' }}>
            Too many players — maximum is 4.
          </p>
        )}
      </div>
    </div>
  );
}

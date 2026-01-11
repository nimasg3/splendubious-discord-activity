/**
 * Lobby Screen Component
 *
 * Pre-game lobby showing players and game settings.
 */

import { useState } from 'react';
import { useGame } from '../../context';

export function LobbyScreen(): JSX.Element {
  const { state, startGame, leaveRoom, updatePlayerName } = useGame();
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(2);
  const [isStarting, setIsStarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  const { room, isHost, user } = state;

  const handleStartGame = async () => {
    setIsStarting(true);
    try {
      await startGame(playerCount);
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

  if (!room) {
    return (
      <div className="lobby-screen">
        <p>Loading room...</p>
      </div>
    );
  }

  const canStart = isHost && room.players.filter(p => !p.isSpectator).length >= playerCount;

  return (
    <div className="lobby-screen">
      <div className="lobby-content">
        {/* Room header */}
        <div className="lobby-header">
          <h2>Game Lobby</h2>
          <div className="room-code-section">
            <span className="room-code-label">Room Code:</span>
            <span className="room-code">{room.id}</span>
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
          <h3>Players ({room.players.filter(p => !p.isSpectator).length}/{playerCount})</h3>
          <ul className="players-list">
            {room.players.map((player) => (
              <li 
                key={player.id} 
                className={`player-item ${player.id === user?.id ? 'local' : ''} ${player.isSpectator ? 'spectator' : ''}`}
              >
                <span className="player-name">
                  {player.id === user?.id && isEditingName ? (
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
                      {player.id === user?.id && (
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
                <span className={`player-status status-${player.status}`}>
                  {player.status === 'connected' ? '●' : '○'}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Game settings (host only) */}
        {isHost && (
          <div className="settings-section">
            <h3>Game Settings</h3>
            <div className="player-count-selector">
              <label>Number of Players:</label>
              <div className="count-buttons">
                {([2, 3, 4] as const).map((count) => (
                  <button
                    key={count}
                    className={`btn btn-count ${playerCount === count ? 'active' : ''}`}
                    onClick={() => setPlayerCount(count)}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

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
              {isStarting ? 'Starting...' : `Start Game (${room.players.filter(p => !p.isSpectator).length}/${playerCount} players)`}
            </button>
          )}
        </div>

        {/* Waiting for players message */}
        {isHost && !canStart && (
          <p className="waiting-message">
            Waiting for {playerCount - room.players.filter(p => !p.isSpectator).length} more player(s)...
          </p>
        )}
      </div>
    </div>
  );
}

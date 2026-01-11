/**
 * Menu Screen Component
 *
 * Main menu for creating or joining games.
 */

import { useState } from 'react';
import { useGame } from '../../context';

export function MenuScreen(): JSX.Element {
  const { state, createRoom, joinRoom, setLocalPlayerName } = useGame();
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  const currentName = state.user?.globalName || state.user?.username || 'Player';

  const handleCreateRoom = async () => {
    try {
      await createRoom();
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      setJoinError('Please enter a room code');
      return;
    }
    
    setIsJoining(true);
    setJoinError(null);
    
    try {
      await joinRoom(roomCode.trim());
    } catch (error) {
      setJoinError('Failed to join room. Check the code and try again.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="menu-screen">
      <div className="menu-content">
        {/* Game title */}
        <div className="menu-header">
          <h1 className="game-title">Splendubious</h1>
          <p className="game-subtitle">A Gem Trading Game</p>
        </div>

        {/* User info */}
        {state.user && (
          <div className="user-info">
            <span className="user-label">Playing as:</span>
            {isEditingName ? (
              <span className="name-edit-container">
                <input
                  type="text"
                  className="name-input"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (editedName.trim()) {
                        setLocalPlayerName(editedName.trim());
                      }
                      setIsEditingName(false);
                    }
                    if (e.key === 'Escape') {
                      setIsEditingName(false);
                    }
                  }}
                  autoFocus
                  maxLength={20}
                />
                <button 
                  className="btn btn-tiny btn-primary" 
                  onClick={() => {
                    if (editedName.trim()) {
                      setLocalPlayerName(editedName.trim());
                    }
                    setIsEditingName(false);
                  }}
                >
                  ✓
                </button>
                <button 
                  className="btn btn-tiny btn-secondary" 
                  onClick={() => setIsEditingName(false)}
                >
                  ✗
                </button>
              </span>
            ) : (
              <span className="user-name-editable">
                <span className="user-name">{currentName}</span>
                <button 
                  className="btn btn-tiny btn-secondary edit-name-btn"
                  onClick={() => {
                    setEditedName(currentName);
                    setIsEditingName(true);
                  }}
                  title="Edit name"
                >
                  ✎
                </button>
              </span>
            )}
          </div>
        )}

        {/* Menu actions */}
        <div className="menu-actions">
          {/* Create Room */}
          <button 
            className="btn btn-primary btn-large"
            onClick={handleCreateRoom}
          >
            Create Game
          </button>

          {/* Divider */}
          <div className="menu-divider">
            <span>or</span>
          </div>

          {/* Join Room */}
          <div className="join-room-section">
            <input
              type="text"
              className="input room-code-input"
              placeholder="Enter room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={8}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
            />
            <button 
              className="btn btn-secondary"
              onClick={handleJoinRoom}
              disabled={isJoining}
            >
              {isJoining ? 'Joining...' : 'Join Game'}
            </button>
            {joinError && (
              <p className="error-text">{joinError}</p>
            )}
          </div>
        </div>

        {/* Error display */}
        {state.error && (
          <div className="menu-error">
            <p>{state.error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

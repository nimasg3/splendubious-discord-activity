/**
 * Game Screen Component
 *
 * Main game screen containing the game board and player panels.
 */

import { useGame } from '../../context';
import { GameBoard, PlayerPanel, ActionPanel } from '../game';

export function GameScreen(): JSX.Element {
  const { state, isMyTurn, clearSelection, leaveRoom } = useGame();
  const { gameState, user, selectedAction } = state;

  // Handle right-click to clear selection
  const handleContextMenu = (e: React.MouseEvent) => {
    // Only clear if something is selected
    if (selectedAction.type !== 'none') {
      e.preventDefault();
      clearSelection();
    }
  };

  if (!gameState) {
    return (
      <div className="game-screen loading">
        <p>Loading game...</p>
      </div>
    );
  }

  const currentPlayerIndex = gameState.currentPlayerIndex;
  const currentPlayer = gameState.players[currentPlayerIndex];
  const isGameEnded = gameState.phase === 'ended';
  const isFinalRound = gameState.phase === 'final_round';

  // Get player positions based on player count and local player index
  const localPlayerIndex = gameState.players.findIndex(p => p.id === user?.id);
  const playerCount = gameState.players.length;

  // Local player at bottom, opponents ordered by turn order starting from the player after local
  const localPlayer = localPlayerIndex >= 0 ? gameState.players[localPlayerIndex] : undefined;
  const opponentsInTurnOrder: typeof gameState.players = [];
  for (let i = 1; i < playerCount; i++) {
    const nextIndex = (localPlayerIndex + i) % playerCount;
    opponentsInTurnOrder.push(gameState.players[nextIndex]);
  }

  return (
    <div 
      className={`game-screen players-${playerCount}`}
      onContextMenu={handleContextMenu}
    >
      {/* Game status banner */}
      <div className="game-status-banner">
        {isGameEnded ? (
          <div className="game-ended">
            <span className="trophy">🏆</span>
            <span>
              {gameState.winners.length === 1 
                ? `${gameState.players.find(p => p.id === gameState.winners[0])?.name} wins!`
                : 'Game ended in a tie!'}
            </span>
          </div>
        ) : isFinalRound ? (
          <div className="final-round">
            <span className="warning">⚡</span>
            <span>Final Round!</span>
          </div>
        ) : (
          <div className="current-turn-info">
            <span>
              {isMyTurn() ? 'Your turn' : `${currentPlayer?.name}'s turn`}
            </span>
            <span className="round-indicator">Round {gameState.round}</span>
          </div>
        )}
      </div>

      {/* Players sidebar (left) - opponents in turn order, local player at bottom */}
      <div className="players-sidebar">
        {/* Opponents in turn order (player after local at top) */}
        {opponentsInTurnOrder.length > 0 && (
          <div className="opponents-section">
            {opponentsInTurnOrder.map((player) => (
              <PlayerPanel
                key={player.id}
                player={player}
                isCurrentPlayer={gameState.players.indexOf(player) === currentPlayerIndex}
                isLocalPlayer={false}
                position="opponent"
              />
            ))}
          </div>
        )}

        {/* Local player */}
        {localPlayer && (
          <div className="local-player-section">
            <PlayerPanel
              player={localPlayer}
              isCurrentPlayer={localPlayerIndex === currentPlayerIndex}
              isLocalPlayer={true}
              position="bottom"
            />
          </div>
        )}
      </div>

      {/* Game board (right) - fills available space */}
      <div className="game-area">
        <div className="game-board-wrapper">
          <GameBoard gameState={gameState} />
          {/* Action panel - anchored under game board */}
          <div className="action-panel-container">
            <ActionPanel />
          </div>
        </div>
      </div>

      {/* Game end overlay */}
      {isGameEnded && (
        <div className="game-end-overlay">
          <div className="game-end-modal">
            <h2>Game Over!</h2>
            <div className="final-scores">
              {gameState.players
                .sort((a, b) => b.prestigePoints - a.prestigePoints)
                .map((player, rank) => (
                  <div 
                    key={player.id} 
                    className={`score-row ${gameState.winners.includes(player.id) ? 'winner' : ''}`}
                  >
                    <span className="rank">#{rank + 1}</span>
                    <span className="player-name">{player.name}</span>
                    <span className="score">{player.prestigePoints} pts</span>
                    {gameState.winners.includes(player.id) && (
                      <span className="winner-badge">🏆</span>
                    )}
                  </div>
                ))}
            </div>
            <button className="btn btn-primary return-to-menu-btn" onClick={leaveRoom}>
              Return to Main Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

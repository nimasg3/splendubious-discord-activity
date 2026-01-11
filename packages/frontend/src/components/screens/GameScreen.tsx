/**
 * Game Screen Component
 *
 * Main game screen containing the game board and player panels.
 */

import { useGame } from '../../context';
import { GameBoard, PlayerPanel, ActionPanel } from '../game';

export function GameScreen(): JSX.Element {
  const { state, isMyTurn, clearSelection } = useGame();
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

  // Local player at bottom, all opponents stacked on the left sidebar
  const localPlayer = gameState.players[localPlayerIndex];
  const opponents = gameState.players.filter((_, i) => i !== localPlayerIndex);

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

      {/* Opponents sidebar (left) */}
      {opponents.length > 0 && (
        <div className="opponents-sidebar">
          {opponents.map((player) => (
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

      {/* Game board (center) */}
      <div className="game-area">
        <GameBoard gameState={gameState} />
      </div>

      {/* Local player area (bottom) */}
      {localPlayer && (
        <div className="player-area bottom">
          <PlayerPanel
            player={localPlayer}
            isCurrentPlayer={localPlayerIndex === currentPlayerIndex}
            isLocalPlayer={true}
            position="bottom"
          />
        </div>
      )}

      {/* Action panel - always visible for local player during their turn */}
      <div className="action-panel-container">
        <ActionPanel />
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
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Socket Module
 */

export {
  connect,
  disconnect,
  getSocket,
  isConnected,
  createRoom,
  joinRoom,
  leaveRoom,
  startGame,
  sendAction,
  onRoomUpdated,
  onPlayerJoined,
  onPlayerLeft,
  onGameStateUpdated,
  onGameStarted,
  onGameEnded,
  onError,
  ping,
} from './client';

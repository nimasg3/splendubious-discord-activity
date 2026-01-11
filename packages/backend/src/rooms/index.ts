/**
 * Rooms Module
 */

export {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoom,
  getAllRooms,
  deleteRoom,
  updatePlayerStatus,
  updatePlayerName,
  getPlayer,
  getRoomBySocketId,
  getPlayerBySocketId,
  updateRoomStatus,
  setGameState,
  toRoomDTO,
  toPlayerDTO,
  cleanupInactiveRooms,
} from './roomManager';

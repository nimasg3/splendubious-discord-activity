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
  updatePlayerColor,
  getPlayer,
  getRoomBySocketId,
  getPlayerBySocketId,
  updateRoomStatus,
  setGameState,
  toRoomDTO,
  toPlayerDTO,
  cleanupInactiveRooms,
  getOrCreateChannelRoom,
  findRoomByChannelId,
} from './roomManager.js';

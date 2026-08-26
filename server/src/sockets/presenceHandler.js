import { SOCKET_EVENTS } from '../constants/socketEvents.js';
import { storageService } from '../services/storageService.js';

export function registerPresenceHandlers(io, socket) {
  // Track user socket connection
  storageService.addSocket(socket.userId, socket.id);

  // Broadcast user online status
  io.emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
    userId: socket.userId,
    isOnline: true,
    lastSeen: new Date().toISOString()
  });

  // On Disconnect
  socket.on('disconnect', () => {
    storageService.removeSocket(socket.userId, socket.id);
    const isStillOnline = storageService.isUserOnline(socket.userId);

    if (!isStillOnline) {
      io.emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
        userId: socket.userId,
        isOnline: false,
        lastSeen: new Date().toISOString()
      });
    }
  });
}

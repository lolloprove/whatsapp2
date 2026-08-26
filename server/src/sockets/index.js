import { socketAuthMiddleware } from '../middlewares/socketAuthMiddleware.js';
import { registerChatHandlers } from './chatHandler.js';
import { registerPresenceHandlers } from './presenceHandler.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';

export function setupSockets(io) {
  // Authentication middleware during handshake
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.userId} (${socket.user?.username || 'Guest'}) [SocketID: ${socket.id}]`);

    // Join personal user room for direct notifications
    socket.join(`user:${socket.userId}`);

    // Emit authentication success
    socket.emit(SOCKET_EVENTS.AUTHENTICATED, {
      userId: socket.userId,
      status: 'connected',
      user: socket.user
    });

    // Register event handlers
    registerPresenceHandlers(io, socket);
    registerChatHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] User disconnected: ${socket.userId} (${reason})`);
    });
  });
}

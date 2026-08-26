import { storageService } from '../services/storageService.js';

/**
 * Socket.io Handshake Authentication Middleware.
 * Richiede l'userId ottenuto dalla registrazione (salvato lato client).
 */
export async function socketAuthMiddleware(socket, next) {
  try {
    const auth = socket.handshake.auth || {};
    const query = socket.handshake.query || {};

    const userId = auth.userId || auth.guestUserId || query.userId || query.guestUserId;

    if (!userId) {
      return next(new Error('Autenticazione richiesta: userId mancante'));
    }

    const user = await storageService.getUserById(String(userId).trim());
    if (!user) {
      return next(new Error('Utente non registrato'));
    }

    socket.userId = user.id;
    socket.user = user;
    return next();
  } catch (err) {
    console.error('Socket auth handshake error:', err.message);
    return next(new Error('Errore durante l\'autenticazione Socket.io'));
  }
}

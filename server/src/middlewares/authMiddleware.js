import { storageService } from '../services/storageService.js';

/**
 * Middleware di autenticazione per Express.
 * L'identità è l'header `x-user-id` emesso dal server alla registrazione
 * (POST /auth/register) e salvato dal client. Deve corrispondere a un
 * utente realmente registrato: niente auto-creazione da header arbitrari.
 */
export async function authMiddleware(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Autenticazione richiesta. Registrati con un username.'
      });
    }

    const user = await storageService.getUserById(String(userId).trim());
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Utente non registrato. Effettua di nuovo la registrazione.'
      });
    }

    req.user = user;
    return next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(500).json({ success: false, error: 'Errore interno durante l\'autenticazione' });
  }
}

import { storageService } from '../services/storageService.js';

function publicProfile(user, isOnline) {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    statusMessage: user.statusMessage,
    isOnline,
    lastSeen: user.lastSeen,
    createdAt: user.createdAt
  };
}

export const authController = {
  /**
   * POST /auth/register (pubblico)
   * Registrazione username-only: username univoco = credenziale.
   * Se l'username esiste già, restituisce il profilo esistente (login implicito).
   */
  async register(req, res, next) {
    try {
      const { username, fullName } = req.body;
      const { user, created } = await storageService.registerUser({ username, fullName });

      return res.status(created ? 201 : 200).json({
        success: true,
        data: publicProfile(user, storageService.isUserOnline(user.id))
      });
    } catch (err) {
      if (err.statusCode === 400) {
        return res.status(400).json({ success: false, error: err.message });
      }
      next(err);
    }
  },

  async syncProfile(req, res, next) {
    try {
      const { username, fullName, avatarUrl, statusMessage } = req.body;
      const user = await storageService.syncUser({
        id: req.user.id,
        username,
        fullName,
        avatarUrl,
        statusMessage
      });

      if (!user) {
        return res.status(404).json({ success: false, error: 'Utente non trovato' });
      }

      return res.status(200).json({
        success: true,
        data: publicProfile(user, true)
      });
    } catch (err) {
      next(err);
    }
  },

  async getMe(req, res, next) {
    try {
      return res.status(200).json({
        success: true,
        data: publicProfile(req.user, true)
      });
    } catch (err) {
      next(err);
    }
  }
};
